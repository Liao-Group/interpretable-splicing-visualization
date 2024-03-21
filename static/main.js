// // Temp sample data
// const data = [
//     {category: 'incl_1', value: 30},
//     {category: 'incl_2', value: 80},
//     {category: 'incl_3', value: 45},
//     {category: 'skip_4', value: 60},
//     {category: 'skip_5', value: 40},
//     {category: 'skip_6', value: 70},
//     {category: 'skip_s', value: 50}
//   ];

// // Draw background

// let padding = 10;

// let svg_plot = svg.append("g")
//   .attr("id", "plot")
//   .attr("transform", "translate(" + padding + "," + padding + ")");

// svg_plot.append("rect")
//   .attr("class", "background")
//   .attr("fill", background_color)
//   .attr("width", width - 2 * padding)
//   .attr("height", height / 2 - 2 * padding);

// // Draw static bar chart

// const margin = {top: 50, right: 50, bottom: 50, left: 50};
// const chartWidth = width - 2 * padding - margin.left - margin.right;
// const chartHeight = height / 2 - 2 * padding - margin.top - margin.bottom;

// const x = d3.scaleBand()
//   .rangeRound([0, chartWidth])
//   .padding(0.1)
//   .domain(data.map(d => d.category));

// const y = d3.scaleLinear()
//   .rangeRound([chartHeight, 0])
//   .domain([0, d3.max(data, d => d.value)]);

// let g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

// g.selectAll(".bar")
//   .data(data)
//   .enter().append("rect")
//   .attr("class", "bar")
//   .attr("x", d => x(d.category))
//   .attr("y", d => y(d.value))
//   .attr("width", x.bandwidth())
//   .attr("height", d => chartHeight - y(d.value))
//   .attr("fill", d => d.category.startsWith('incl') ? inclusion_color : skipping_color);

// g.append("g")
//   .attr("transform", `translate(0, ${chartHeight})`)
//   .call(d3.axisBottom(x));

// g.append("g")
//   .call(d3.axisLeft(y));

// d3.json("./data/deciphering_rna_splicing.json", 
// function(data) {
//   console.log(data);
//   draw_hierarchical_view(data);
// })

// function draw_hierarchical_view(data) {

//   let width = d3.select(".hierarchical-view-1").style("width");
//   let height = d3.select(".hierarchical-view-1").style("height");
  
// }

// d3.json("/get-data", function(error, data){
//   console.log(data);
// });

// Color palette
const inclusion_color = "#c5d6fb";
const inclusion_highlight_color = "#669aff";
const skipping_color = "#f6c3c2";
const skipping_highlight_color = "#ff6666";

const background_color = "#e4e4e4";
const background_model_color = "#e4f2e3"
const line_color = "#6b6b6b";
const strength_difference_color = "#dad7cd";

d3.json("./get-data", function(data){
  console.log(data);
  nucleotide_view(data.nucleotide_activations);
})

function nucleotide_view(data){
  console.log(data)
  var margin = {top: 10, right: 30, bottom: 20, left: 50};
  var width = d3.select("svg.nucleotide-view").style("width");
  var height = d3.select("svg.nucleotide-view").style("height");
  var svg_view = d3.select("svg.nucleotide-view");

  // // Add X axis
  // var x = d3.scaleBand()
  //           .domain(groups)
  //           .range([0, width])
  //           .padding([0.2])
  // svg.append("g")
  //   .attr("transform", "translate(0," + height + ")")
  //   .call(d3.axisBottom(x).tickSizeOuter(0));
}