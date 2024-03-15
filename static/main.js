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

// Temp sample data
const data = [
    {category: 'incl_1', value: 30},
    {category: 'incl_2', value: 80},
    {category: 'incl_3', value: 45},
    {category: 'skip_4', value: 60},
    {category: 'skip_5', value: 40},
    {category: 'skip_6', value: 70},
    {category: 'skip_s', value: 50}
  ];

// Draw background

let padding = 10;

let svg_plot = svg.append("g")
  .attr("id", "plot")
  .attr("transform", "translate(" + padding + "," + padding + ")");

svg_plot.append("rect")
  .attr("class", "background")
  .attr("fill", background_color)
  .attr("width", width - 2 * padding)
  .attr("height", height / 2 - 2 * padding);

// Draw static bar chart

const margin = {top: 50, right: 50, bottom: 50, left: 50};
const chartWidth = width - 2 * padding - margin.left - margin.right;
const chartHeight = height / 2 - 2 * padding - margin.top - margin.bottom;

const x = d3.scaleBand()
  .rangeRound([0, chartWidth])
  .padding(0.1)
  .domain(data.map(d => d.category));

const y = d3.scaleLinear()
  .rangeRound([chartHeight, 0])
  .domain([0, d3.max(data, d => d.value)]);

let g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

g.selectAll(".bar")
  .data(data)
  .enter().append("rect")
  .attr("class", "bar")
  .attr("x", d => x(d.category))
  .attr("y", d => y(d.value))
  .attr("width", x.bandwidth())
  .attr("height", d => chartHeight - y(d.value))
  .attr("fill", d => d.category.startsWith('incl') ? inclusion_color : skipping_color);

g.append("g")
  .attr("transform", `translate(0, ${chartHeight})`)
  .call(d3.axisBottom(x));

g.append("g")
  .call(d3.axisLeft(y));

/***d3.csv("./data/deciphering_rna_splicing.csv", 
function(data) {
    console.log(data);
    //Add bar chart here
})***/