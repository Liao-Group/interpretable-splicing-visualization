# Author: Mukund Sudarshan, Nhi Nguyen

import pandas as pd
import numpy as np
from tensorflow.keras.models import Model, load_model
from tensorflow.keras import Input
from figutils import extract_str_patches
from sequence_logo import plot_logo
import quad_model
import json
from joblib import load

def get_link_midpoint(link_function, midpoint=0.5, epsilon=1e-5, lb=-100, ub=100, max_iters=50):
    """
    Assumes monotonicity and smoothness of link function
    """
    iters = 0
    while iters < max_iters:
        xx = np.linspace(lb, ub, 1000)
        yy = link_function(xx[:, None]).numpy().flatten()

        if min(np.abs(yy - midpoint)) < epsilon:
            return xx[np.abs(yy - midpoint) < epsilon][0]
        lb_idx = np.where((yy - midpoint) < 0)[0][-1]
        ub_idx = np.where((yy - midpoint) > 0)[0][0]

        lb = xx[lb_idx]
        ub = xx[ub_idx]

        iters += 1
    raise RuntimeError(f"Max iterations ({max_iters}) reached without solution...")

def get_model_midpoint(model, midpoint=0.5):    
    """ 
    Compute the midpoint using the model"s link function. This is the negation of the basal strength. 
    I.e., positive value corresponds to a skipping basal strength. 
    """
    link_input = Input(shape=(1,))
    w = model.get_layer("energy_seq_struct").w.numpy()
    b = model.get_layer("energy_seq_struct").b.numpy()
    link_output = model.get_layer("output_activation")(model.get_layer("gen_func")(w*link_input + b))
    link_function = Model(inputs=link_input, outputs=link_output)
    return get_link_midpoint(link_function, midpoint)

def get_logo_data(model, num_seq_filters, num_struct_filters, xTr, npy_files, N=1000):
    """
    Compute the height for sequence logo for sequence filters and structure filters
    """
    # Model parameters
    seq_filter_width = model.get_layer("qc_incl").kernel.shape[0]
    struct_filter_width = model.get_layer("c_incl_struct").kernel.shape[0]

    # Subsample
    xTr_seq_oh, xTr_struct_oh, xTr_wobble = xTr
    xTr_seq_oh = xTr_seq_oh[:N]
    xTr_struct_oh = xTr_struct_oh[:N]
    xTr_wobble = xTr_wobble[:N]
    nts = ["A", "C", "G", "U"]
    xTr_seqs = ["".join([nts[np.where(one_hot == 1)[0].item()] for one_hot in row]) for row in xTr_seq_oh]

    # Activations model
    activations_model = Model(inputs=model.inputs, outputs=[
        model.get_layer("activation_2").output,
        model.get_layer("activation_3").output
    ])
    incl_acts, skip_acts = activations_model.predict([xTr_seq_oh, xTr_struct_oh, xTr_wobble])

    # Extract sequence patches and activations
    seq_patches = extract_str_patches(xTr_seqs, seq_filter_width)

    incl_acts_data_seq = [(c, *d) for a, b in zip(
        seq_patches, incl_acts[:, :, :num_seq_filters]
    ) for c, d in zip(a, b)]
    skip_acts_data_seq = [(c, *d) for a, b in zip(
        seq_patches, skip_acts[:, :, :num_seq_filters]
    ) for c, d in zip(a, b)]

    incl_acts_df_seq = pd.DataFrame(
        incl_acts_data_seq, columns=["input"] + [f"f{i}" for i in range(num_seq_filters)]
    )
    skip_acts_df_seq = pd.DataFrame(
        skip_acts_data_seq, columns=["input"] + [f"f{i}" for i in range(num_seq_filters)]
    )

    # Create all sequence logo data
    seq_logo_data = np.empty((num_seq_filters*2, seq_filter_width, len( nts)))
    for i in range(num_seq_filters):
        dfS = incl_acts_df_seq[["input", f"f{i}"]]
        dfS.columns = ["input", "activation"]
        dfS = dfS.reset_index(drop=True)
        seq_logo_data[i,...] = plot_logo(dfS, 1)

        dfS = skip_acts_df_seq[["input", f"f{i}"]]
        dfS.columns = ["input", "activation"]
        dfS = dfS.reset_index(drop=True)
        seq_logo_data[i+num_seq_filters,...] = plot_logo(dfS, 1)

    # Save to numpy file
    with open(npy_files[0], "wb") as f:
        np.save(f, seq_logo_data)
    return seq_logo_data, None # TODO

def get_logo_boundaries(logo_data, threshold=0.8):
    """
    Get the significant portion of the logo
    Define as from the leftmost position with information content > threshold
    to the rightmost position with information content > threshold
    """
    if logo_data is not None:
        num_filters, filter_width, num_nts = logo_data.shape
        boundaries = np.zeros((num_filters, 2))
        for fi in range(num_filters):
            logo_info_content = logo_data[fi].sum(axis=1)
            for p in range(filter_width):
                if logo_info_content[p] > threshold:
                    boundaries[fi,0] = p
                    break
            for p in range(filter_width-1,-1,-1):
                if logo_info_content[p] > threshold:
                    boundaries[fi,1] = p
                    break
    else: #TODO
        num_filters = 8
        filter_width = 30
        boundaries = np.hstack([
            np.zeros((num_filters, 1)),
            np.full((num_filters, 1), filter_width-1),
        ])

    result = []
    for i in range(num_filters):
        result.append({
            "left": boundaries[i,0],
            "right": boundaries[i,1]
        })
    return result


if __name__ == "__main__":

    DATA_DIR = "../data"
    MODEL_DIR = "../model"
    JSON_FILE = f"{DATA_DIR}/model_data.json"
    MODEL_FNAME = f"{MODEL_DIR}/custom_adjacency_regularizer_20210731_124_step3.h5"

    model_data = {}
    model = load_model(MODEL_FNAME)

    # Model"s link midpoint
    model_data["link_midpoint"] = get_model_midpoint(model)

    # Number of filters
    num_seq_filters = model.get_layer("qc_incl").kernel.shape[2]
    num_struct_filters = model.get_layer("c_incl_struct").kernel.shape[2]

    model_data["num_seq_filters"] = num_seq_filters
    model_data["num_struct_filters"] = num_struct_filters

    # Group filters from manual inspections
    model_data["incl_seq_groups"] = {
        1: [6, 9, 11, 14],
        3: [4, 5, 8, 16, 17],
        7: [2, 12, 13],
        5: [3, 10, 15],
        6: [1, 7],
        2: [0, 19],
        4: [18],
    }
    model_data["skip_seq_groups"] = {
        6: [1, 5, 9, 19], 
        4: [3, 10, 14, 15, 18],  
        3: [2, 4, 8, 13],     
        5: [6, 7, 12],     
        1: [0, 17],                    
        2: [11, 16],                   
    }
    model_data["incl_struct_groups"] = {
        1: [0, 1, 2, 3, 4, 5, 6, 7], 
    }
    model_data["skip_struct_groups"] = {
        1: [1], 
        2: [0, 2, 3], 
        3: [5, 6, 7], 
        4: [4]
    }

    # Get logo data
    xTr = load(f"{DATA_DIR}/xTr_ES7_HeLa_ABC.pkl.gz")
    seq_logo_data, struct_logo_data = get_logo_data(
        model, num_seq_filters, num_struct_filters, xTr, 
        npy_files=[f"{DATA_DIR}/seq_logo_data.npy", f"{DATA_DIR}/struct_logo_data.npy"]
    )

    # Filter logo boundaries
    model_data["seq_logo_boundaries"] = get_logo_boundaries(seq_logo_data)
    model_data["struct_logo_boundaries"] = get_logo_boundaries(struct_logo_data)

    with open(JSON_FILE, "w") as f:
        json.dump(model_data, f)

