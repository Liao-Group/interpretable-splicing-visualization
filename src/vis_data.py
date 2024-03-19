# Authors: Mukund Sudarshan, Nhi Nguyen

import pandas as pd
import numpy as np
from tensorflow.keras.models import Model, load_model
from tensorflow.keras import Input
from src.figutils import create_input_data, add_flanking
import src.quad_model
import json

## CONSTANTS

# model
MODEL_FNAME = "model/custom_adjacency_regularizer_20210731_124_step3.h5"
MODEL_DATA_FNAME = "data/model_data.json"

## MAIN FUNCTION
def get_vis_data(exon, json_file=None):
    # Model
    model = load_model(MODEL_FNAME)
    with open(MODEL_DATA_FNAME, "r") as f:
        model_data = json.load(f)

    # Bias
    link_midpoint = model_data["link_midpoint"]
    incl_bias, skip_bias = (np.abs(link_midpoint), 0) if link_midpoint < 0 else (0, np.abs(link_midpoint))

    # Number of filters
    num_seq_filters = model_data["num_seq_filters"]
    num_struct_filters = model_data["num_struct_filters"]
    
    # Filter groups
    incl_seq_groups = model_data["incl_seq_groups"]
    skip_seq_groups = model_data["skip_seq_groups"]
    incl_struct_groups = model_data["incl_struct_groups"]
    skip_struct_groups = model_data["skip_struct_groups"]

    # Filter boundaries
    seq_logo_boundaries = model_data["seq_logo_boundaries"]
    struct_logo_boundaries = model_data["struct_logo_boundaries"]

    # Sequences
    sequence = add_flanking(exon, 10)
    predicted_psi = model.predict(create_input_data([sequence])).item()

    # Compute activations
    activations_model = Model(inputs=model.inputs, outputs=[
        model.get_layer("activation_2").output,
        model.get_layer("activation_3").output
    ])
    data_incl_acts, data_skip_acts = activations_model.predict(create_input_data([sequence]))
    incl_acts = data_incl_acts[0]
    skip_acts = data_skip_acts[0]
    delta_force = incl_bias - skip_bias + incl_acts.sum() - skip_acts.sum()

    # Collapse filters
    (
        collapsed_seq_incl_acts, collapsed_struct_incl_acts, 
        collapsed_seq_skip_acts, collapsed_struct_skip_acts
    ) = collapse_activations(
        incl_acts=incl_acts,
        skip_acts=skip_acts,
        incl_seq_groups=incl_seq_groups,
        skip_seq_groups=skip_seq_groups,
        incl_struct_groups=incl_struct_groups,
        skip_struct_groups=skip_struct_groups,
        seq_logo_boundaries=seq_logo_boundaries,
        struct_logo_boundaries=struct_logo_boundaries,
        num_seq_filters=num_seq_filters,
        num_struct_filters=num_struct_filters,
        sequence_length=len(sequence),
    )
    
    # Get hierarchical data
    feature_activations = get_feature_activations(
        collapsed_seq_incl_acts=collapsed_seq_incl_acts,
        collapsed_struct_incl_acts=collapsed_struct_incl_acts, 
        collapsed_seq_skip_acts=collapsed_seq_skip_acts, 
        collapsed_struct_skip_acts=collapsed_struct_skip_acts,
        sequence_length=len(sequence),
        incl_bias=incl_bias,
        skip_bias=skip_bias
    )

    # nucleotide_activations = get_nucleotide_activations(
    #     incl_acts=incl_acts, 
    #     skip_acts=skip_acts, 
    #     num_seq_filters=num_seq_filters, 
    #     num_struct_filters=num_struct_filters,
    #     seq_filter_width=seq_filter_width,
    #     struct_filter_width=struct_filter_width,
    #     incl_seq_groups=incl_seq_groups, 
    #     skip_seq_groups=skip_seq_groups, 
    #     incl_struct_groups=incl_struct_groups, 
    #     skip_struct_groups=skip_struct_groups,
    #     seq_logo_boundaries=seq_logo_boundaries, 
    #     struct_logo_boundaries=struct_logo_boundaries,
    #     sequence_length=len(sequence),
    # )

    result = {
        "exon": exon,
        "sequence": sequence,
        "predicted_psi": predicted_psi,
        "delta_force": delta_force,
        "incl_bias": incl_bias,
        "skip_bias": skip_bias,
        # "nucleotide_activations": nucleotide_activations,
        "feature_activations": feature_activations,
    }

    if json_file is not None:
        with open(json_file, "w") as f:
            json.dump(result, f, indent=2)
    return result

def shift_row(row, shift, total_len=90):
    shift = int(shift)
    out = np.zeros(total_len)
    out[shift:len(row)+shift] += row
    return out

def collapse(groups, shifted_acts, logo_boundaries, sequence_length):
    collapsed_acts = np.zeros((sequence_length, len(groups), 2))
    for i in range(sequence_length):
        for feature_id in groups.keys():
            filter_strengths = shifted_acts[i,groups[feature_id]]
            feature_strength = filter_strengths.sum()
            repr_filter = groups[feature_id][np.argmax(filter_strengths)]
            feature_length = logo_boundaries[repr_filter]["length"]
            collapsed_acts[i,int(feature_id)-1,:] = [feature_strength, feature_length]
    return collapsed_acts

def collapse_activations(incl_acts, skip_acts, incl_seq_groups, skip_seq_groups,
    incl_struct_groups, skip_struct_groups, seq_logo_boundaries, struct_logo_boundaries,
    num_seq_filters, num_struct_filters, sequence_length
):
    # Shift by start boundaries
    seq_incl_shifts = [seq_logo_boundaries["incl"][i]["left"] for i in range(num_seq_filters)]
    seq_skip_shifts = [seq_logo_boundaries["skip"][i]["left"] for i in range(num_seq_filters)]
    
    struct_incl_shifts = [struct_logo_boundaries["incl"][i]["left"] for i in range(num_struct_filters)]
    struct_skip_shifts = [struct_logo_boundaries["skip"][i]["left"] for i in range(num_struct_filters)]
    
    incl_shifts = seq_incl_shifts + struct_incl_shifts
    skip_shifts = seq_skip_shifts + struct_skip_shifts

    shifted_incl_acts = np.array([
        shift_row(row, row_shift, sequence_length) 
        for row, row_shift in zip(incl_acts.T, incl_shifts)
    ]).T
    shifted_skip_acts = np.array([
        shift_row(row, row_shift, sequence_length) 
        for row, row_shift in zip(skip_acts.T, skip_shifts)
    ]).T

    # Combine strength; Save the length of strongest filter
    collapsed_seq_incl_acts = collapse(
        groups=incl_seq_groups,
        shifted_acts=shifted_incl_acts[:,:num_seq_filters],
        logo_boundaries=seq_logo_boundaries["incl"],
        sequence_length=sequence_length
    )
    collapsed_struct_incl_acts = collapse(
        groups=incl_struct_groups,
        shifted_acts=shifted_incl_acts[:,num_seq_filters:],
        logo_boundaries=struct_logo_boundaries["incl"],
        sequence_length=sequence_length
    )
    collapsed_seq_skip_acts = collapse(
        groups=skip_seq_groups,
        shifted_acts=shifted_skip_acts[:,:num_seq_filters],
        logo_boundaries=seq_logo_boundaries["skip"],
        sequence_length=sequence_length
    )
    collapsed_struct_skip_acts = collapse(
        groups=skip_struct_groups,
        shifted_acts=shifted_skip_acts[:,num_seq_filters:],
        logo_boundaries=struct_logo_boundaries["skip"],
        sequence_length=sequence_length
    )

    return (
        collapsed_seq_incl_acts, collapsed_struct_incl_acts, 
        collapsed_seq_skip_acts, collapsed_struct_skip_acts
    )
                
def get_feature_activations(collapsed_seq_incl_acts, collapsed_struct_incl_acts, 
    collapsed_seq_skip_acts, collapsed_struct_skip_acts, sequence_length, incl_bias, skip_bias, threshold=0
):
    feature_activations = {
        "incl": {"incl_bias": {"strength": incl_bias}},
        "skip": {"skip_bias": {"strength": skip_bias}}
    }
    total_strength = 0
    for fi in range(collapsed_seq_incl_acts.shape[1]):
        feature_activations["incl"][f"incl_{fi+1}"] = {}
        for i in range(sequence_length):
            if collapsed_seq_incl_acts[i,fi,0] > threshold:
                total_strength += collapsed_seq_incl_acts[i,fi,0]
                feature_activations["incl"][f"incl_{fi+1}"][f"pos_{i+1}"] = {
                    "strength": collapsed_seq_incl_acts[i,fi,0],
                    "length": int(collapsed_seq_incl_acts[i,fi,1]),
                }
    for fi in range(collapsed_struct_incl_acts.shape[1]):
        feature_activations["incl"][f"incl_struct_{fi+1}"] = {}
        for i in range(sequence_length):
            if collapsed_struct_incl_acts[i,fi,0] > threshold:
                feature_activations["incl"][f"incl_struct_{fi+1}"][f"pos_{i+1}"] = {
                    "strength": collapsed_struct_incl_acts[i,fi,0],
                    "length": int(collapsed_struct_incl_acts[i,fi,1]),
                }
    for fi in range(collapsed_seq_skip_acts.shape[1]):
        feature_activations["skip"][f"skip_{fi+1}"] = {}
        for i in range(sequence_length):
            if collapsed_seq_skip_acts[i,fi,0] > threshold:
                feature_activations["skip"][f"skip_{fi+1}"][f"pos_{i+1}"] = {
                    "strength": collapsed_seq_skip_acts[i,fi,0],
                    "length": int(collapsed_seq_skip_acts[i,fi,1]),
                }
    for fi in range(collapsed_struct_skip_acts.shape[1]):
        feature_activations["skip"][f"skip_struct_{fi+1}"] = {}
        for i in range(sequence_length):
            if collapsed_struct_skip_acts[i,fi,0] > threshold:
                feature_activations["skip"][f"skip_struct_{fi+1}"][f"pos_{i+1}"] = {
                    "strength": collapsed_struct_skip_acts[i,fi,0],
                    "length": int(collapsed_struct_skip_acts[i,fi,1]),
                }

    return feature_activations

# def get_nucleotide_activations(incl_acts, skip_acts, num_seq_filters, num_struct_filters,
#     seq_filter_width, struct_filter_width, incl_seq_groups, skip_seq_groups, 
#     incl_struct_groups, skip_struct_groups, seq_logo_boundaries, struct_logo_boundaries, 
#     sequence_length
# ):
#     nucleotide_activations = {}

#     return nucleotide_activations