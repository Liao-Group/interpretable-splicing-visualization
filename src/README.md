# Documentation

## 1. What does each files in `src` do?

Files copied straight from the original paper's repository [regev-lab/interpretable-splicing-model](https://github.com/regev-lab/interpretable-splicing-model)

1. `vis_data.py`: The main file to generate the json files. Will explain in Section 4.

2. `quad_model.py`: Define the architecture of the model. We don't have to directly call anything from this file. Just always include
```
import src.quad_model
```

3. `generate_custom_model.py`: Generate a modified version of the original model for different length exon and with different bias. We only care about the main function
```
generate_custom_model(new_input_length, delta_basal)
```

4. `RNAutils.py`: Use in `figutils.py` to estimate the structure of exon in the dot-bracket (.()) notation. Don't have to use this file outside of `figutils.py` in general.

5. `figutils.py`: Important functions are

```
rna_fold_structs(seq_nts)
```
Take in a list of string input such as ["ATG...", ...] and return the dot-bracket structures. Bypass the need to access `RNAutils.py` outside of `figutils.py`.

```
add_flanking(nts, ...)
```
Given a string input "ATG...", add padding to the left and right of the string. 

```
create_input_data(seq_nts)
```
Given a list of string inputs ["ATG...", ...] with N elements of length L, return 3 elements of a proper input for the pretrained model:
- `seq_oh` (shape (N,L,4)): one-hot vector representation of the string input. Notice that the shape is (L, 4) because there are 4 different nucleotides.
- `struct_oh` (shape (N,L,3)): one-hot vector representation of the dot-bracket structure. Notice that the shape is (L, 3) because there are 3 different symbols ".", "(", and ")".
- `wobbles` (shape (N,L,)): represent the confidence about each nucleotide position (e.g., whether a recorded A is actually an A)

6. `pnas_vis.py`: Code from the original paper that is the basis of the main file `vis_data.py`. Don't have to use this file. 

7. `model_data.py`: #TODO

8. `sequence_logo.py`: #TODO

## 2. How to predict using the pretrained model?

In combination with the trained model's parameters `model/custom_adjacency_regularizer_20210731_124_step3`, we can generate output from the model using the following code chunk
```
# Load pretrained model
model_file_name = f"../model/custom_adjacency_regularizer_20210731_124_step3.h5"
model = tensorflow.keras.models.load_model(model_file_name)

# Convert input to proper format
exon = "ACTG[...]"
sequence = figutils.add_flanking(exon, 10)
input_to_model = figutils.create_input_data([sequence])

# Make a prediction
predictions = model(input_to_model)
```

## 3. How to get the activations of the pretrained model?

The architecture of the original model can be found at `model/model_summary.txt`. The activation we are interested in is in layers `activation_2` (for inclusion) and `activation_3` (for skipping). To get the activation of the model given some input, we can use the following code chunk
```
# Create a custom activation model
activations_model = Model(inputs=model.inputs, outputs=[
    model.get_layer("activation_2").output,
    model.get_layer("activation_3").output
])

# Compute activations by passing the input through this custom model
data_incl_acts, data_skip_acts = activations_model.predict(input_to_model))
incl_acts = data_incl_acts[0]
skip_acts = data_skip_acts[0]
```

For an input with length 90 (per original paper), `incl_acts` and `skip_acts` both have shape (85, 28), where 85 is the number of windows the convolution kernel slides through (note that the convolution kernel has size 6 in this case), and 28 represents the 20 short sequence convolution kernels (of size 6) and 8 long structure convolution kernels (of size 30). The first 20 kernels are sequence kernels, and the last 8 kernels are structure kernels.


## 4. How to get visualization json files?

The main function to get the visualization json files is
```
get_vis_data(
    exon,                       # the sequence of exon
    json_file=None,             # where to save the results
    threshold=0.001,            # filter for feature strengths that are too weak
    use_new_grouping=False,     # using 13 or 18 features
    dataset="ES7"               # which dataset is the model trained no
)
```

Examples of how to use `get_vis_data()` for to generate json files can be found in `notebooks/vis_data.ipynb`. Below, I describe the flow of the code in `vis_data.py`.

1. Load the pretrain model and customize the model to the length of the exon and the specified dataset
```
model = load_model(MODEL_FNAME)
model = generate_custom_model(
    new_input_length=exon_len+pre_flanking_len+post_flanking_len, 
    delta_basal=basal_shift
)
```

2. Get the metadata about the model from `data/model_data_18.json`. The most important values are
```
# Filter groups
incl_seq_groups = model_data["incl_seq_groups"]
skip_seq_groups = model_data["skip_seq_groups"]
incl_struct_groups = model_data["incl_struct_groups"]
skip_struct_groups = model_data["skip_struct_groups"]
```
which define how the 20+8 kernels are grouped together to 13 or 18 features

```
# Filter boundaries
seq_logo_boundaries = model_data["seq_logo_boundaries"]
struct_logo_boundaries = model_data["struct_logo_boundaries"]
```
which define the boundaries of the kernels that is smaller than its maximum size (of 6 ot 30).

3. Prepare the input sequence by adding flanking sequences and estimate the dot-bracket structure. These are tick labels for the x-axis of the Exon View.
```
sequence = add_flanking(exon, ...)
structs, _ = rna_fold_structs([sequence])
structs = structs[0]
input_to_model = create_input_data([sequence])
```

4. Get the activations following Section 3
```
activations_model = Model(inputs=model.inputs, outputs=[
    model.get_layer("activation_2").output,
    model.get_layer("activation_3").output
])
data_incl_acts, data_skip_acts = activations_model.predict(input_to_model)
incl_acts = data_incl_acts[0]
skip_acts = data_skip_acts[0]
```

5. Compute overal predictions that are not position-dependent along the exon
```
predicted_psi = model.predict(input_to_model), verbose=0).item()
incl_strength = incl_bias + incl_acts.sum()
skip_strength = skip_bias + skip_acts.sum()
delta_force = incl_strength - skip_strength
```

6. Group the kernels into specified groups from `model_data`
```
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
```

7. Structure data into hierarchical format for Feature view and Exon view
```
# Get hierarchical data
feature_activations = get_feature_activations(
    collapsed_seq_incl_acts=collapsed_seq_incl_acts,
    collapsed_struct_incl_acts=collapsed_struct_incl_acts, 
    collapsed_seq_skip_acts=collapsed_seq_skip_acts, 
    collapsed_struct_skip_acts=collapsed_struct_skip_acts,
    sequence_length=len(sequence),
    incl_bias=incl_bias,
    skip_bias=skip_bias,
    threshold=threshold
)

nucleotide_activations = get_nucleotide_activations(
    collapsed_seq_incl_acts=collapsed_seq_incl_acts,
    collapsed_struct_incl_acts=collapsed_struct_incl_acts, 
    collapsed_seq_skip_acts=collapsed_seq_skip_acts, 
    collapsed_struct_skip_acts=collapsed_struct_skip_acts,
    sequence_length=len(sequence),
    seq_filter_width=seq_filter_width,
    struct_filter_width=struct_filter_width,
    threshold=threshold
)
```

## 5. How to draw sequence logos?

#TODO

## 6. Important metadata: 

#TODO

1. `model_data_18.json`
2. `seq_logo_data.npy`
3. `datasets_data.json`