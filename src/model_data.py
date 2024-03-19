# Author: Mukund Sudarshan, Nhi Nguyen

import pandas as pd
import numpy as np
from tensorflow.keras.models import Model, load_model
from tensorflow.keras import Input
from figutils import extract_str_patches
from sequence_logo import plot_logo
import src.quad_model
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

def get_logo_data(model, xTr, npy_files, N=1000):
    """
    Compute the height for sequence logo for sequence filters and structure filters
    """
    # Model parameters
    num_seq_filters = model.get_layer("qc_incl").kernel.shape[2]
    num_struct_filters = model.get_layer("c_incl_struct").kernel.shape[2]
    seq_filter_width = model.get_layer("qc_incl").kernel.shape[0]
    struct_filter_width = model.get_layer("c_incl_struct").kernel.shape[0]

    # Subsample
    xTr_seq_oh, xTr_struct_oh, xTr_wobble = xTr
    xTr_seq_oh = xTr_seq_oh[:N]
    xTr_struct_oh = xTr_struct_oh[:N]
    xTr_wobble = xTr_wobble[:N]

    # Activations model
    activations_model = Model(inputs=model.inputs, outputs=[
        model.get_layer("activation_2").output,
        model.get_layer("activation_3").output
    ])
    incl_acts, skip_acts = activations_model.predict([xTr_seq_oh, xTr_struct_oh, xTr_wobble])
    
    nts = ["A", "C", "G", "U"]
    xTr_seqs = ["".join([nts[np.where(one_hot == 1)[0].item()] for one_hot in row]) for row in xTr_seq_oh]
    seq_logo_data = get_fixed_width_logo_data(
        xTr=xTr_seqs,
        incl_data=incl_acts[..., :num_seq_filters],
        skip_data=skip_acts[..., :num_seq_filters],
        num_filters=num_seq_filters,
        filter_width=seq_filter_width,
        nts=nts,
        npy_file=npy_files[0]
    )
    
    nts = [ ".", "(", ")"]
    xTr_structs = ["".join([nts[np.where(one_hot == 1)[0].item()] for one_hot in row]) for row in xTr_struct_oh]
    struct_logo_data = get_fixed_width_logo_data(
        xTr=xTr_structs,
        incl_data=incl_acts[..., num_seq_filters:],
        skip_data=skip_acts[..., num_seq_filters:],
        num_filters=num_struct_filters,
        filter_width=struct_filter_width,
        nts=[".", "(", ")"],
        npy_file=npy_files[1]
    )

    return seq_logo_data, struct_logo_data

def get_fixed_width_logo_data(xTr, incl_data, skip_data, num_filters, filter_width, nts, npy_file):
    # Extract sequence patches and activations
    patches = extract_str_patches(xTr, filter_width)

    incl_acts_data_seq = [(c, *d) for a, b in zip(patches, incl_data) for c, d in zip(a, b)]
    skip_acts_data_seq = [(c, *d) for a, b in zip(patches, skip_data) for c, d in zip(a, b)]

    incl_acts_df_seq = pd.DataFrame(
        incl_acts_data_seq, columns=["input"] + [f"f{i}" for i in range(num_filters)]
    )
    skip_acts_df_seq = pd.DataFrame(
        skip_acts_data_seq, columns=["input"] + [f"f{i}" for i in range(num_filters)]
    )

    # Create all sequence logo data
    logo_data = np.empty((2, num_filters, filter_width, len(nts)))
    for i in range(num_filters):
        dfS = incl_acts_df_seq[["input", f"f{i}"]]
        dfS.columns = ["input", "activation"]
        dfS = dfS.reset_index(drop=True)
        logo_data[0,i,...] = plot_logo(dfS, 1, nts=nts)

        dfS = skip_acts_df_seq[["input", f"f{i}"]]
        dfS.columns = ["input", "activation"]
        dfS = dfS.reset_index(drop=True)
        logo_data[1,i,...] = plot_logo(dfS, 1, nts=nts)

    # Save to numpy file
    with open(npy_file, "wb") as f:
        np.save(f, logo_data)

    return logo_data


def get_logo_boundaries(logo_data, threshold=0.8):
    """
    Get the significant portion of the logo
    Define as from the leftmost position with information content > threshold
    to the rightmost position with information content > threshold
    """
    _, num_filters, filter_width, num_nts = logo_data.shape
    boundaries = np.zeros((2, num_filters, 2))
    for i in range(2):
        for fi in range(num_filters):
            logo_info_content = logo_data[i,fi].sum(axis=1)
            for p in range(filter_width):
                if logo_info_content[p] > threshold:
                    boundaries[i,fi,0] = p
                    break
            for p in range(filter_width-1,-1,-1):
                if logo_info_content[p] > threshold:
                    boundaries[i,fi,1] = p
                    break
    if num_nts == 3: #TODO: structure
        boundaries = np.zeros((2, num_filters, 2))
        boundaries[...,1] = filter_width-1

    result = {"incl": [], "skip": []}
    for i in range(num_filters):
        result["incl"].append({
            "left": boundaries[0,i,0],
            "right": boundaries[0,i,1]
        })
        result["skip"].append({
            "left": boundaries[1,i,0],
            "right": boundaries[1,i,1]
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
    seq_logo_data, struct_logo_data = get_logo_data(model, xTr, 
        npy_files=[f"{DATA_DIR}/seq_logo_data.npy", f"{DATA_DIR}/struct_logo_data.npy"]
    )

    # Filter logo boundaries
    model_data["seq_logo_boundaries"] = get_logo_boundaries(seq_logo_data)
    model_data["struct_logo_boundaries"] = get_logo_boundaries(struct_logo_data)

    with open(JSON_FILE, "w") as f:
        json.dump(model_data, f, indent=2)

