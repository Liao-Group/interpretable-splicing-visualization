// WARNING: Don't forget your semicolons (;)

// Create a "stage" to draw graphs on
let width = 1200;
let height = 600;

let svg = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

// Color palette
let inclusion_color = "#c5d6fb";
let inclusion_highlight_color = "#669aff";
let skipping_color = "#f6c3c2";
let skipping_highlight_color = "#ff6666";

let background_color = "#e4e4e4";
let background_model_color = "#e4f2e3"
let line_color = "#6b6b6b";
let strength_difference_color = "#dad7cd";

// Draw background
let padding = 5;

let svg_plot = svg.append("g")
                    .attr("id", "plot")
                    .attr("transform", "translate(" + padding + "," + padding + ")");

svg_plot.append("rect")
            .attr("class", "background")
            .attr("fill", background_color)
            .attr("width", width-2*padding)
            .attr("height", height/2-2*padding);

// Draw position plot
d3.csv("./data/deciphering_rna_splicing.csv", 
function(data) {
    console.log(data);
    //Add bar chart here
})