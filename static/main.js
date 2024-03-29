// Color palette

const inclusion_color = "#c5d6fb";
const inclusion_highlight_color = "#669aff";
const skipping_color = "#f6c3c2";
const skipping_highlight_color = "#ff6666";

const background_color = "whitesmoke"; // "#e4e4e4";
const background_model_color = "#e4f2e3"
const line_color = "#6b6b6b";
const strength_difference_color = "#dad7cd";
const nucleotide_color = "black";

d3.json("./get-data", function (data) {
  sequence_length = data.sequence.length;
  // console.log(data.structs);
  nucleotide_view(data.sequence, data.structs, data.nucleotide_activations);
  PSIview(data);
  HierarchicalBarChart(data, data.feature_activations);
})

function recursive_total_strength(data) {
  if (!("children" in data)) { return data.strength; }
  else { return d3.sum(d3.map(data["children"], recursive_total_strength).keys()) }
}

/**
 * 
 * PSI view function
 */
const PSIview = (value) => {
  const deltaForce = value.delta_force
  const predictedPSI = value.predicted_psi

  const svg = d3.select("svg.psi-view");
  const width = parseFloat(d3.select("svg.psi-view").style("width"));
  const height = parseFloat(d3.select("svg.psi-view").style("height"));;
  const margin = { top: 40, right: 60, bottom: 30, left: 50 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom ;

  const yScale = d3.scaleLinear().domain([-20, 20]).range([chartHeight, 0]);
  const yAxis = d3.axisLeft(yScale).ticks(5);

  const yScale2 = d3.scaleLinear().domain([0, 1]).range([chartHeight, 0]);
  const yAxis2 = d3.axisRight(yScale2).ticks(4);

  svg.attr('width', width).attr('height', height);

  const chartGroup = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

  chartGroup.append('g').call(yAxis);
  svg.append('text')
    .attr('x', (width / 2))
    .attr('y', margin.top / 2 + 5)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .text('Difference-to-Prediction');

  // Position yAxis2 on the right side of the chart
  chartGroup.append('g')
    .attr('transform', `translate(${chartWidth + 5}, 0)`)
    .call(yAxis2);


  // Add title for the right y-axis (PSI)
  chartGroup.append('text')
    .attr('transform', `translate(${chartWidth + 60}, ${chartHeight / 2}) rotate(-90) `)
    .attr("font-size", "12px")
    .attr('dy', '-1.25em')
    .style('text-anchor', 'middle')
    .text('Predicted PSI');
  // Add title for the left y-axis (ΔStrength)
  chartGroup.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -chartHeight / 2)
    .attr('y', -margin.left - 3)
    .attr("font-size", "12px")
    .attr('dy', '2.25em')
    .style('text-anchor', 'middle')
    .text('Δ Strength (a.u)');

  // Add zero line
  chartGroup.append("line")
    .attr("x1", 0)
    .attr("x2", chartWidth + 5)
    .attr("y1", yScale(0))
    .attr("y2", yScale(0))
    .attr("stroke", "black")
    .attr("stroke-width", 1);


  const barHeight = Math.abs(deltaForce) * (chartHeight / 40);

  const barColor = predictedPSI < 0.5 ? "#f6c3c2" : "#c5d6fb";

  const bar = chartGroup
    .append('rect')
    .attr('x', 8)
    .attr('y', yScale(0))
    .attr('width', chartWidth - 10)
    .attr('height', 0)
    .attr('fill', barColor)
    .attr("stroke", "#000")
    .attr("stroke-width", 1);

  // Animation
  bar.transition()
    .duration(1000)
    .attr('y', yScale(Math.max(0, deltaForce)))
    .attr('height', barHeight);

  // Hover effect
  // Hover effect
  const tooltip = chartGroup.append('text')
    .attr('x', chartWidth / 2)
    .attr('y', height - margin.bottom - 20)
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .attr('fill', 'black')
    .style('opacity', 1);

  tooltip.append('tspan')
      .attr('x', chartWidth / 2)
      .attr('dy', '-0.5em')
      .attr("font-size", "10px")
      .text('Δ Strength: ' + deltaForce.toFixed(2));
  tooltip.append('tspan')
      .attr('x', chartWidth / 2)
      .attr('dy', '1.2em')
      .attr("font-size", "10px")
      .text('Predicted PSI: ' + predictedPSI.toFixed(2));

  // bar.on('mouseover', function () {
  //   tooltip.selectAll('tspan').remove(); // Remove existing tspan elements

  //   tooltip.append('tspan')
  //     .attr('x', chartWidth / 2)
  //     .attr('dy', '-0.5em')
  //     .text('Δ Strength: ' + deltaForce.toFixed(2));

  //   tooltip.append('tspan')
  //     .attr('x', chartWidth / 2)
  //     .attr('dy', '1.2em')
  //     .text('Predicted PSI: ' + predictedPSI.toFixed(2));

  //   tooltip.style('opacity', 1);
  // })
  //   .on('mouseout', function () {
  //     tooltip.style('opacity', 0);
  //   });

};


/**
 * 
 * Feature view 1 
 */
const HierarchicalBarChart = (parent, data) => {
  const margin = { top: 40, right: 20, bottom: 30, left: 50 };
  const width = parseFloat(d3.select("svg.feature-view-1").style("width")) - margin.left - margin.right;
  const height = parseFloat(d3.select("svg.feature-view-1").style("height")) - margin.top - margin.bottom;

  const getFillColor = (node) => {
    if (typeof node === "number") {
      return node === 1 ? "#f6c3c2" : "#c5d6fb";
    } else if (node) {
      return node.data.name === "skip" ? "#f6c3c2" : "#c5d6fb";
    } else {
      return "#c5d6fb"; // Default color if node is neither a number nor an object
    }
  };

  const getHighlightColor = (node) => {
    return node === 1 ? "#ff6666" : "#669aff";
  };
  const svgElement = d3.select("svg.feature-view-1");
  // console.log(svgElement);
  // svgElement.selectAll("*").remove(); // Clear SVG before redrawing

  const svg = svgElement
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const root = d3.hierarchy(data).sum(d => d.strength);

  const xScale = d3.scaleBand()
    .domain(root.children ? root.children.map(d => d.data.name) : [])
    .range([0, width])
    .padding(0.2);

  const yScale = d3.scaleLinear()
    .domain([0, root.value])
    .range([height, 0]);

  // Axes
  const xAxis = d3.axisBottom(xScale).tickFormat("").tickSize(0);
  const yAxis = d3.axisLeft(yScale);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", - margin.top / 2)
    .attr("text-anchor", "middle")
    .style('font-size', '14px')
    // .text('Inclusion and Skipping');
     .text('Class Strengths');


  svg.append("text")
    .attr("class", "x-axis-label")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + 15)
    .text("Classes");

  svg.append("text")
    .attr("class", "y-axis-label")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -31)
    .attr("font-size", "12px")
    .text("Strength (a.u)");

  // Append the axes to the SVG
  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis);

  svg.append("g")
    .attr("class", "y-axis")
    .call(yAxis);

  // Create bars
  svg.selectAll(".bar")
    .data(root.children ? root.children : [])
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", d => xScale(d.data.name))
    .attr("y", d => yScale(d.value))
    .attr("width", xScale.bandwidth())
    .attr("height", d => height - yScale(d.value))
    .attr("fill", d => getFillColor(d))
    .attr("stroke", "#000")
    .attr("stroke-width", 1)
    .on("click", (event, d) => {
      // console.log(data.children[d])
      if (data.children[d].children) {
        HierarchicalBarChart2(parent, data.children[d])
        // setSelectedNode(d.data);
        nucleotide_view(parent.sequence, parent.structs, parent.nucleotide_activations);
      }
    })
    .on("mouseover", function (event, d) {
      d3.select(this).transition()
        .duration(100)
        .attr("fill", getHighlightColor(d));
    })
    .on("mouseout", function (event, d) {
      d3.select(this).transition()
        .duration(100)
        .attr("fill", getFillColor(d));
    });
};

/**
 * 
 * HierarchicalBarChart2
 */
const HierarchicalBarChart2 = (parent, data) => {
  // console.log('Bar2')
  const margin = { top: 40, right: 20, bottom: 30, left: 40 };
  const width = parseFloat(d3.select("svg.feature-view-2").style("width")) - margin.left - margin.right;
  const height = parseFloat(d3.select("svg.feature-view-2").style("height")) - margin.top - margin.bottom;

  const getFillColor = (data) => {
    // Custom logic for color
    if (data.name === 'incl') {
      return "#c5d6fb";
    } else {
      return "#f6c3c2";
    }
  };

  const getHighlightColor = (data) => {

    // Custom logic for color
    if (data.name === 'incl') {
      return "#669aff";
    } else {
      return "#ff6666";
    }
  };

  const color = getFillColor(data);
  const highlightColor = getHighlightColor(data);

  const svgElement = d3.select("svg.feature-view-2");
  svgElement.selectAll("*").remove(); // Clear SVG before redrawing

  const svg = svgElement
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Compute the hierarchical data
  const root = d3.hierarchy(data).sum(d => d.strength);

  // Sort children by strength in descending order and keep only the top 10
  const topChildren = root.children
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Use the topChildren for xScale domain
  const xScale = d3.scaleBand()
    .domain(topChildren.map(d => d.data.name))
    .range([0, width])
    .padding(0.2);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(topChildren, d => d.value)]) // Update to use the max of topChildren
    .range([height, 0]);

  // Axes
  const xAxis = d3.axisBottom(xScale).tickSize(0).tickFormat("");
  const yAxis = d3.axisLeft(yScale).ticks(5); // Adjust tick count if necessary

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", - margin.top / 2)
    .attr("text-anchor", "middle")
    .style('font-size', '14px')
    .text("Strongest " + (data.name == "incl" ? "Inclusion" : "Skipping") + ' Features');

  svg.append("text")
    .attr("class", "x-axis-label")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 15)
    .text("Features");

  svg.append("text")
    .attr("class", "y-axis-label")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -25)
    .text("Strength (a.u)");

  // Append the axes to the SVG
  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis)
    .selectAll("text") // select all the text elements for the x-axis
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-30)");

  // Your existing Y-axis code
  svg.append("g")
    .attr("class", "y-axis")
    .call(yAxis);

  // Create bars for topChildren
  svg.selectAll(".bar")
    .data(topChildren)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", d => xScale(d.data.name))
    .attr("y", d => yScale(d.value))
    .attr("width", xScale.bandwidth())
    .attr("height", d => height - yScale(d.value))
    .attr("fill", d => color)
    .attr("stroke", "#000") // Set the color of the outline
    .attr("stroke-width", 1)
    .on("click", (event, d) => {
      // console.log('bar2', topChildren[d].children);
      d3.select(this).transition()
        .duration(100)
        .attr("fill", highlightColor);
      if (topChildren[d].children) {
        // console.log(topChildren[d].data.name)
        HierarchicalBarChart3(topChildren[d], topChildren[d].data.name);
        if (topChildren[d].data.name.slice(-4) != "bias") {
          nucleotide_feature_view(parent, parent.feature_activations, topChildren[d].data.name);
        }
        // setSelectedNode(d.data);
      }
    })
    // Highlight bar on mouseover
    .on("mouseover", function (event, d) {
      d3.select(this).transition()
        .duration(100)
        .attr("fill", highlightColor);
    })
    // Revert bar color on mouseout
    .on("mouseout", function (event, d) {
      d3.select(this).transition()
        .duration(100)
        .attr("fill", color);
    });

};




/**
 * 
 * HierarchicalBarChart3
 */

const HierarchicalBarChart3 = (data, parentName) => {
  // console.log('Bar3');
  // console.log('name', parentName);

  const margin = { top: 40, right: 20, bottom: 40, left: 50 };
  const width = 380 - margin.left - margin.right;
  const height = 340 - margin.top - margin.bottom;

  const getFillColor = (name) => {
    // Custom logic for color
    // console.log(typeof (String(name)))
    if (String(name).split("_")[0] === 'incl') {
      return "#c5d6fb";
    } else {
      return "#f6c3c2";
    }
  };

  const getHighlightColor = (name) => {
    // Custom logic for color
    if (String(name).split("_")[0] === 'incl') {
      return "#669aff";
    } else {
      return "#ff6666";
    }
  };
  const color = getFillColor(parentName);
  const highlightColor = getHighlightColor(parentName);

  const svgElement = d3.select("svg.feature-view-3");
  svgElement.selectAll("*").remove(); // Clear SVG before redrawing

  const svg = svgElement
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const children = data.children || [];

  // Sort children by value in descending order and keep only the top 10
  const topChildren = children
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const xScale = d3.scaleBand()
    .domain(topChildren.map(d => d.data.name))
    .range([0, width])
    .padding(0.2);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(topChildren, d => d.value)])
    .range([height, 0]);

  // Axes
  const xAxis = d3.axisBottom(xScale).tickSize(0).tickFormat("");
  const yAxis = d3.axisLeft(yScale).ticks(5);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 10 - margin.top / 2)
    .attr("text-anchor", "middle")
    .style('font-size', '14px')
    .text("Strongest Positions for Given Feature");

  svg.append("text")
    .attr("class", "x-axis-label")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + 15)
    .text("Positions");

  svg.append("text")
    .attr("class", "y-axis-label")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -35)
    .attr("font-size", "12px")
    .text("Strength (a.u) ");

  // Append the axes to the SVG
  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-30)");

  svg.append("g")
    .attr("class", "y-axis")
    .call(yAxis);

  // Create bars
  svg.selectAll(".bar")
    .data(topChildren)
    .enter().append("rect")
    .attr("class", function(d) { return "bar " + d.data.name;})
    .attr("x", d => xScale(d.data.name))
    .attr("y", d => yScale(d.value))
    .attr("width", xScale.bandwidth())
    .attr("height", d => height - yScale(d.value))
    .attr("fill", d => color)
    .attr("stroke", "#000")
    .attr("stroke-width", 1)
    .on('click', function (d) {
      d3.select(this).transition()
        .duration(100)
        .attr("fill", highlightColor);
      d3.select("svg.nucleotide-view").selectAll(".obj.bar." + d.data.name)
        .transition()
        .duration(100)
        .attr("fill", highlightColor);
    })
    .on("mouseover", function (d) {
      d3.select(this).transition()
        .duration(100)
        .attr("fill", highlightColor);
      console.log(d3.select("svg.nucleotide-view").selectAll(".obj.bar"));
      console.log(d);
      d3.select("svg.nucleotide-view").selectAll(".obj.bar." + d.data.name)
        .raise()
        .transition()
        .duration(300)
        .attr("fill", highlightColor);
    })
    .on("mouseout", function (d) {
      d3.select(this).transition()
        .duration(100)
        .attr("fill", color);
      d3.select("svg.nucleotide-view").selectAll(".obj.bar")
        .transition()
        .duration(100)
        .attr("fill", color);
    });
};







/**
 * @function nucleotide_view
 * @param {*} sequence 
 * @param {*} structs 
 * @param {*} data 
 * @returns 
 */

function nucleotide_view(sequence, structs, data) {
  svg = d3.select("svg.nucleotide-view")
  svg.selectAll("*").remove();
  d3.select("svg.nucleotide-sort").selectAll("*").remove();
  d3.select("svg.nucleotide-zoom").selectAll("*").remove();

  // console.log("nucleotide_view", sequence, structs, data);
  var margin = { top: 30, right: 10, bottom: 20, left: 50, middle: 22 };
  var width = parseFloat(d3.select("svg.nucleotide-view").style("width"));
  var height = parseFloat(d3.select("svg.nucleotide-view").style("height"));
  // var width = 1200
  // var height = 400
  var svg_nucl = d3.select("svg.nucleotide-view");

  // Title
  svg_nucl.append("text")
    .attr("x", (width / 2))
    .attr("y", margin.top / 2 + 5)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Exon View");

  // Add X axis
  var positions = Array.from(new Array(sequence.length), (x, i) => i + 1);
  var x = d3.scaleBand()
    .range([margin.left, width - margin.right])
    .domain(positions)
    .padding(0.2);
  var xInclAxis = d3.axisBottom(x)
    .tickSize(2)
    .tickFormat(function (d) {
      return Array.from(structs)[d - 1];
    });
  var xSkipAxis = d3.axisTop(x)
    .tickSize(2)
    .tickFormat(function (d) {
      if (((d+3) % 10 == 0 & d > 7 & d < 84) | d == 8 | d == 83) { 
        return d - 10 + 3;
      } else { return "" };
    });
  var xNuAxis = d3.axisBottom(x)
    .tickSize(0)
    .tickFormat(function (d) {
      return Array.from(sequence)[d - 1];
    });
  var gxIncl = svg_nucl.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (margin.top + (height - margin.top - margin.bottom) / 2 - margin.middle) + ")")
    .call(xInclAxis);
  var gxSkip = svg_nucl.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (margin.top + (height - margin.top - margin.bottom) / 2 + margin.middle) + ")")
    .call(xSkipAxis);
  var gxNu = svg_nucl.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (margin.top + (height - margin.top - margin.bottom) / 2 - 5) + ")")
    .call(xNuAxis);
  gxNu.selectAll("path")
    .style("stroke-width", 0);
  gxNu.selectAll(".tick")
    .each(function (d, i) {
      d3.select(this)
        .select("text")
        .attr("fill", (d <= 10 || d > 80) ? line_color : nucleotide_color)
    });

  // Add Y axis
  var max_incl = d3.max(d3.map(data.children[0].children, recursive_total_strength).keys());
  var max_skip = d3.max(d3.map(data.children[1].children, recursive_total_strength).keys());
  var max_strength = d3.max([max_incl, max_skip]);
  var yIncl = d3.scaleLinear()
    .domain([0, max_strength])
    .range([margin.top + (height - margin.top - margin.bottom) / 2 - margin.middle, margin.top]);
  var ySkip = d3.scaleLinear()
    .domain([0, max_strength])
    .range([margin.top + (height - margin.top - margin.bottom) / 2 + margin.middle, height - margin.bottom]);
  var gyIncl = svg_nucl.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + margin.left + ",0)");
  var gySkip = svg_nucl.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + margin.left + ",0)");
  gyIncl.transition().duration(800).call(d3.axisLeft(yIncl).ticks(4));
  gySkip.transition().duration(800).call(d3.axisLeft(ySkip).ticks(4));
  svg_nucl.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "middle")
    .attr("x", -(margin.top + (height - margin.top - margin.bottom) / 4 - margin.middle / 2))
    .attr("y", margin.left)
    .attr("dy", "-2.25em")
    .attr("font-size", "12px")
    .attr("transform", "rotate(-90)")
    .text("Inclusion strength (a.u)");
  svg_nucl.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "middle")
    .attr("x", -(margin.top / 2 + (height - margin.top - margin.bottom) / 4 + margin.middle / 2 + height / 2 - margin.bottom / 2))
    .attr("y", margin.left)
    .attr("dy", "-2.25em")
    .attr("font-size", "12px")
    .attr("transform", "rotate(-90)")
    .text("Skipping strength (a.u)");


  // Nucleotide bars
  svg_nucl.selectAll("nucleotide-incl-bar")
    .data(data.children[0].children)
    .enter()
    .append("rect")
    .datum(function (d) { return d; })
    .attr("class", function (d) { return "obj incl pos_" + d.name.slice(4); })
    .attr("x", function (d) { return x(parseInt(d.name.slice(4))); })
    .attr("y", function (d) { return yIncl(0); })
    .attr("width", x.bandwidth())
    .attr("height", 0)
    .attr("fill", inclusion_color)
    .attr("stroke", line_color)
    .lower()
    .transition()
    .duration(800)
    .attr("y", function (d) { return yIncl(recursive_total_strength(d)); })
    .attr("height", function (d) { return (margin.top + (height - margin.top - margin.bottom) / 2 - margin.middle) - yIncl(recursive_total_strength(d)); })
    .delay(function (d, i) { return (i * 10) });

  svg_nucl.selectAll("nucleotide-skip-bar")
    .data(data.children[1].children)
    .enter()
    .append("rect")
    .datum(function (d) { return d; })
    .attr("class", function (d) { return "obj skip pos_" + d.name.slice(4); })
    .attr("x", function (d) { return x(parseInt(d.name.slice(4))); })
    .attr("y", (margin.top + (height - margin.top - margin.bottom) / 2 + margin.middle))
    .attr("width", x.bandwidth())
    .attr("height", 0)
    .attr("fill", skipping_color)
    .attr("stroke", line_color)
    .lower()
    .on("mouseover", function (d) {
      d3.select(this).style("fill", skipping_highlight_color);
    })
    .on("mouseleave", function (d) {
      d3.select(this).style("fill", skipping_color);
    })
    .transition()
    .duration(800)
    .attr("y", (margin.top + (height - margin.top - margin.bottom) / 2 + margin.middle))
    .attr("height", function (d) { return ySkip(recursive_total_strength(d)) - (margin.top + (height - margin.top - margin.bottom) / 2 + margin.middle); })
    .delay(function (d, i) { return (i * 10); });

  // Highlight on hover
  gxNu.selectAll(".tick")
    .each(function (d) {
      d3.select(this)
        .select("text")
        .attr("class", "obj nt pos_" + d);
    });

  svg_nucl.selectAll(".obj")
    .classed("free", true);

  svg_nucl.selectAll(".obj.free")
    .on("mouseover", function (d) {
      var pos = d3.select(this)
        .attr("class")
        .slice(9, -4);
      d3.select(".obj.incl.free." + pos)
        .style("fill", inclusion_highlight_color);
      d3.select(".obj.skip.free." + pos)
        .style("fill", skipping_highlight_color);
      d3.select(".obj.nt." + pos)
        .style("font-weight", "bold");
    })

    .on("mouseleave", function (d) {
      var pos = d3.select(this)
        .attr("class")
        .slice(9, -4);
      d3.select(".obj.incl.free." + pos)
        .style("fill", inclusion_color);
      d3.select(".obj.skip.free." + pos)
        .style("fill", skipping_color);
      d3.select(".obj.nt." + pos)
        .style("font-weight", "normal");
    });

  // Set up for nucleotide sort
  var sort_width = parseFloat(d3.select("svg.nucleotide-sort").style("width"));
  var sort_height = parseFloat(d3.select("svg.nucleotide-sort").style("height"));
  var svg_sort = d3.select("svg.nucleotide-sort");

  // Set up for nucleotide zoom
  var zoom_width = parseFloat(d3.select("svg.nucleotide-zoom").style("width"));
  var zoom_height = parseFloat(d3.select("svg.nucleotide-zoom").style("height"));
  var svg_zoom = d3.select("svg.nucleotide-zoom");

  // Show nucleotide zoom on hover
  svg_nucl.selectAll(".obj.free")
    .on("click", function (d) {
      d3.selectAll(".obj.incl")
        .style("fill", inclusion_color)
        .classed("free", true);
      d3.selectAll(".obj.skip")
        .style("fill", skipping_color)
        .classed("free", true);
      d3.selectAll(".obj.nt")
        .style("font-weight", "normal")
        .classed("free", true);

      var pos = d3.select(this)
        .attr("class")
        .slice(9, -4);
      d3.select(".obj.incl.free." + pos)
        .style("fill", inclusion_highlight_color)
        .classed("free", false);
      d3.select(".obj.skip.free." + pos)
        .style("fill", skipping_highlight_color)
        .classed("free", false);
      d3.select(".obj.nt." + pos)
        .style("font-weight", "bold")
        .classed("free", false);
      nucleotide_sort(sequence, structs, pos, margin, sort_width, sort_height, svg_sort, svg_zoom);
      nucleotide_zoom(sequence, structs, pos, margin, zoom_width, zoom_height, svg_zoom, max_strength);
    });

  return svg_nucl
}

function nucleotide_feature_view(parent, data, feature_name) {
  var margin = { top: 30, right: 10, bottom: 20, left: 50, middle: 22 };
  var width = parseFloat(d3.select("svg.nucleotide-view").style("width"));
  var height = parseFloat(d3.select("svg.nucleotide-view").style("height"));

  svg = d3.select("svg.nucleotide-view")
  svg.selectAll("rect").remove();
  svg.selectAll(".y.axis").remove();
  d3.select("svg.nucleotide-sort").selectAll("*").remove();
  d3.select("svg.nucleotide-zoom").selectAll("*").remove();

  var class_name = feature_name.split("_")[0];
  if (class_name == "incl") {
    data = flatten_nested_json(data.children[0]).filter(function(d, i, arr){
      return d.name.split(" ")[1] == feature_name;
    });
  } else {
    data = flatten_nested_json(data.children[1]).filter(function(d, i, arr){
      return d.name.split(" ")[1] == feature_name;
    });
  }

  // console.log(data, class_name, feature_name);

  var max_strength = d3.max(d3.map(data, function (d) { return d.strength / d.length; }).keys());

  // X scale
  var sequence = parent.sequence;
  var positions = Array.from(new Array(sequence.length), (x, i) => i + 1);
  var x = d3.scaleBand()
    .range([margin.left, width - margin.right])
    .domain(positions)
    .padding(0);
  
  // Y Axis
  var yIncl = d3.scaleLinear()
    .domain([0, max_strength])
    .range([margin.top + (height - margin.top - margin.bottom) / 2 - margin.middle, margin.top]);
  var ySkip = d3.scaleLinear()
    .domain([0, max_strength])
    .range([margin.top + (height - margin.top - margin.bottom) / 2 + margin.middle, height - margin.bottom]);
  var gyIncl = svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + margin.left + ",0)");
  var gySkip = svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + margin.left + ",0)");
  gyIncl.transition().duration(800).call(d3.axisLeft(yIncl).ticks(3));
  gySkip.transition().duration(800).call(d3.axisLeft(ySkip).ticks(3));

  if (class_name == "incl"){
    svg.selectAll("nucleotide-incl-bar")
      .data(data)
      .enter()
      .append("rect")
      .datum(function (d) { return d; })
      .attr("class", function (d) { return "obj bar " + d.name.slice(4); })
      .attr("x", function (d) { return x(parseInt(d.name.split(" ")[2].split("_")[1])); })
      .attr("y", function (d) { return yIncl(0); })
      .attr("width", function(d) { return x.bandwidth() * d.length; })
      .attr("height", 0)
      .attr("fill", inclusion_color)
      .attr("stroke", line_color)
      .attr("opacity", 0.8)
      .lower()
      .on("mouseover", function (d) {
        d3.select(this).style("fill", inclusion_highlight_color);
      })
      .on("mouseleave", function (d) {
        d3.select(this).style("fill", inclusion_color);
      })
      .transition()
      .duration(800)
      .attr("y", function (d) { return yIncl(d.strength / d.length); })
      .attr("height", function (d) { return (margin.top + (height - margin.top - margin.bottom) / 2 - margin.middle) - yIncl(d.strength / d.length); })
      .delay(function (d, i) { return (i * 10); });
  }
  if (class_name == "skip"){
    svg.selectAll("nucleotide-skip-bar")
      .data(data)
      .enter()
      .append("rect")
      .datum(function (d) { return d; })
      .attr("class", function (d) { return "obj bar " + d.name.slice(4); })
      .attr("x", function (d) { return x(parseInt(d.name.split(" ")[2].split("_")[1])); })
      .attr("y", (margin.top + (height - margin.top - margin.bottom) / 2 + margin.middle))
      .attr("width", function(d) { return x.bandwidth() * d.length; })
      .attr("height", 0)
      .attr("fill", skipping_color)
      .attr("stroke", line_color)
      .attr("opacity", 0.8)
      .lower()
      .on("mouseover", function (d) {
        d3.select(this).style("fill", skipping_highlight_color);
      })
      .on("mouseleave", function (d) {
        d3.select(this).style("fill", skipping_color);
      })
      .transition()
      .duration(800)
      .attr("y", (margin.top + (height - margin.top - margin.bottom) / 2 + margin.middle))
      .attr("height", function (d) { return ySkip(d.strength / d.length) - (margin.top + (height - margin.top - margin.bottom) / 2 + margin.middle); })
      .delay(function (d, i) { return (i * 10); });
  }
}

function nucleotide_sort(sequence, structs, pos, margin, width, height, svg_sort, svg_zoom) {
  svg_sort.selectAll("*").remove(); // Clear SVG before redrawing

  svg_sort.append("text")
    .attr("x", (width / 2))
    .attr("y", margin.top / 2 + 5)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Nucleotide View");


  // Data
  var incl_data;
  var skip_data;
  if (typeof incl_data === 'undefined') { incl_data = []; }
  if (typeof skip_data === 'undefined') { skip_data = []; }
  d3.selectAll(".obj.incl." + pos)
    .each(function (d) { incl_data = flatten_nested_json(d); });
  d3.selectAll(".obj.skip." + pos)
    .each(function (d) { skip_data = flatten_nested_json(d); });
  var max_incl = d3.max(d3.map(incl_data, function (d) { return d.strength; }).keys());
  var max_skip = d3.max(d3.map(skip_data, function (d) { return d.strength; }).keys());
  var max_strength = d3.max([max_incl, max_skip]);

  var top_incl_data = incl_data
    .sort(function(a, b) { return b.strength - a.strength; })
    .slice(0, 10);
  var top_skip_data = skip_data
    .sort(function(a, b) { return b.strength - a.strength; })
    .slice(0, 10);

  // console.log(top_incl_data);
  // console.log(top_skip_data);
  // console.log(max_strength);

  /* Prepare for X axis */
  var sort_x_incl = d3.scaleBand()
    .range([margin.left, width - margin.right])
    .domain(top_incl_data.map(d => d.name))
    .padding(0.2);
  var sort_x_skip = d3.scaleBand()
    .range([margin.left, width - margin.right])
    .domain(top_skip_data.map(d => d.name))
    .padding(0.2);
  var sort_xInclAxis = d3.axisBottom(sort_x_incl)
    .tickSize(2);
  var sort_xSkipAxis = d3.axisTop(sort_x_skip)
    .tickSize(2);
  var sort_gxIncl = svg_sort.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (margin.top + (height - margin.top - margin.bottom) / 2 - margin.middle) + ")");
  var sort_gxSkip = svg_sort.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (margin.top + (height - margin.top - margin.bottom) / 2 + margin.middle) + ")");

  /* Prepare for Y axis */
  var sort_yIncl = d3.scaleLinear()
    .domain([0, max_strength])
    .range([margin.top + (height - margin.top - margin.bottom) / 2 - margin.middle, margin.top]);
  var sort_ySkip = d3.scaleLinear()
    .domain([0, max_strength])
    .range([margin.top + (height - margin.top - margin.bottom) / 2 + margin.middle, height - margin.bottom]);
  var sort_gyIncl = svg_sort.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + margin.left + ",0)");
  var sort_gySkip = svg_sort.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + margin.left + ",0)");

  var sort_incl_ylabel = svg_sort.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "middle")
    .attr("x", -(margin.top + (height - margin.top - margin.bottom) / 4 - margin.middle / 2))
    .attr("y", margin.left)
    .attr("dy", "-2.25em")
    .attr("font-size", "12px")
    .attr("transform", "rotate(-90)")
    .style("fill", background_color)
    .text("Inclusion strength (a.u)");
  var sort_skip_ylabel = svg_sort.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "middle")
    .attr("x", -(margin.top / 2 + (height - margin.top - margin.bottom) / 4 + margin.middle / 2 + height / 2 - margin.bottom / 2))
    .attr("y", margin.left)
    .attr("dy", "-2.25em")
    .attr("font-size", "12px")
    .attr("transform", "rotate(-90)")
    .style("fill", background_color)
    .text("Skipping strength (a.u)");

  // Add X axis
  sort_xInclAxis.tickFormat(function (d) {
    return "";
    // return "f" + d.split(" ")[0].split("_")[1] + "_p" + d.split(" ")[1].split("_")[1];
  });
  sort_xSkipAxis.tickFormat(function (d) {
    return "";
    // return "f" + d.split(" ")[0].split("_")[1] + "_p" + d.split(" ")[1].split("_")[1];
  });
  sort_gxIncl.transition().duration(800).call(sort_xInclAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-50)");
  sort_gxSkip.transition().duration(800).call(sort_xSkipAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-50)");

  // Add Y axis
  sort_yIncl.domain([0, max_strength]);
  sort_ySkip.domain([0, max_strength]);
  sort_incl_ylabel.transition().duration(800).style("fill", "black");
  sort_skip_ylabel.transition().duration(800).style("fill", "black");
  sort_gyIncl.transition().duration(800).call(d3.axisLeft(sort_yIncl).ticks(5));
  sort_gySkip.transition().duration(800).call(d3.axisLeft(sort_ySkip).ticks(5));

  // Remove previous bars
  svg_sort.selectAll(".incl.narrow-bar")
    .transition()
    .duration(300)
    .attr("y", sort_yIncl(0))
    .attr("height", 0)
    .remove();
  svg_sort.selectAll(".skip.narrow-bar")
    .transition()
    .duration(300)
    .attr("y", sort_ySkip(0))
    .attr("height", 0)
    .remove();

  // Add new bars
  svg_sort.selectAll("incl-narrow-bar")
    .data(top_incl_data)
    .enter()
    .append("rect")
    .attr("class", function (d) { return "obj incl narrow-bar " + d.name.split(" ").join("-"); })
    .attr("x", function (d) { return sort_x_incl(d.name); })
    .attr("y", sort_yIncl(0))
    .attr("width", function (d) { return sort_x_incl.bandwidth(); })
    .attr("height", 0)
    .attr("fill", inclusion_color)
    .attr("stroke", line_color)
    .lower()
    .on("mouseover", function (d) {
      d3.select(this).transition()
        .duration(100)
        .attr("fill", inclusion_highlight_color);
      var feature_class = d3.select(this).attr("class").split(" ")[3];
      // console.log(feature_class);
      d3.selectAll(".incl.wide-bar." + feature_class)
        .raise()
        .transition()
        .duration(300)
        .attr("fill", inclusion_highlight_color)
        .attr("opacity", 1);
      d3.selectAll(".annotate.incl." + feature_class)
        .raise()
        .transition()
        .duration(300)
        .attr("opacity", 0);
    })
    .on("mouseout", function (event, d) {
      d3.select(this).transition()
        .duration(100)
        .attr("fill", inclusion_color);
      svg_zoom.selectAll(".incl.wide-bar")
        .attr("fill", inclusion_color)
        .attr("opacity", 0.5);
      svg_zoom.selectAll(".incl.annotate")
        .attr("opacity", 0);
    })
    .transition()
    .duration(800)
    .attr("y", function (d) { return sort_yIncl(d.strength); })
    .attr("height", function (d) { return (margin.top + (height - margin.top - margin.bottom) / 2 - margin.middle) - sort_yIncl(d.strength); })
    .delay(function (d, i) { return (i * 10); });
    
  svg_sort.selectAll("skip-narrow-bar")
    .data(top_skip_data)
    .enter()
    .append("rect")
    .attr("class", function (d) { return "obj skip narrow-bar " + d.name.split(" ").join("-"); })
    .attr("x", function (d) { return sort_x_skip(d.name); })
    .attr("y", sort_ySkip(0))
    .attr("width", function (d) { return sort_x_skip.bandwidth(); })
    .attr("height", 0)
    .attr("fill", skipping_color)
    .attr("stroke", line_color)
    .lower()
    .on("mouseover", function (d) {
      d3.select(this).transition()
        .duration(100)
        .attr("fill",skipping_highlight_color);
      var feature_class = d3.select(this).attr("class").split(" ")[3];
      // console.log(feature_class);
      d3.selectAll(".skip.wide-bar." + feature_class)
        .raise()
        .transition()
        .duration(300)
        .attr("fill", skipping_highlight_color)
        .attr("opacity", 1);
      d3.selectAll(".annotate.skip." + feature_class)
        .raise()
        .transition()
        .duration(300)
        .attr("opacity", 0);
    })
    .on("mouseout", function (event, d) {
      d3.select(this).transition()
        .duration(100)
        .attr("fill", skipping_color);
      svg_zoom.selectAll(".skip.wide-bar")
        .attr("fill", skipping_color)
        .attr("opacity", 0.5);
      svg_zoom.selectAll(".skip.annotate")
        .attr("opacity", 0);
    })
    .transition()
    .duration(800)
    .attr("y", (margin.top + (height - margin.top - margin.bottom) / 2 + margin.middle))
    .attr("height", function (d) { return sort_ySkip(d.strength) - (margin.top + (height - margin.top - margin.bottom) / 2 + margin.middle); })
    .delay(function (d, i) { return (i * 10); });
}

function nucleotide_zoom(sequence, structs, pos, margin, zoom_width, height, svg_zoom, max_strength) {

  /**
   * @mateus 
   * adjusting the height of so the Zoom view doesnt get cutout. 
   */

  
  height = height

  svg_zoom.selectAll("*").remove(); // Clear SVG before redrawing

  svg_zoom.append("text")
    .attr("x", (zoom_width / 2))
    .attr("y", margin.top / 2 + 5)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Nucleotide Features");

  /* Prepare for X axis */
  var positions = Array.from(new Array(11), (x, i) => i - 5);
  var zoom_x = d3.scaleBand()
    .range([margin.left, zoom_width - margin.right])
    .domain(positions)
    .padding(0);
  var zoom_xInclAxis = d3.axisBottom(zoom_x)
    .tickSize(2);
  var zoom_xSkipAxis = d3.axisTop(zoom_x)
    .tickSize(2);
  var zoom_xNuAxis = d3.axisBottom(zoom_x)
    .tickSize(0);
  var zoom_gxIncl = svg_zoom.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (margin.top + (height - margin.top - margin.bottom) / 2 - margin.middle) + ")");
  var zoom_gxSkip = svg_zoom.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (margin.top + (height - margin.top - margin.bottom) / 2 + margin.middle) + ")");
  var zoom_gxNu = svg_zoom.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (margin.top + (height - margin.top - margin.bottom) / 2 - 5) + ")");

  /* Prepare for Y axis */
  var zoom_yIncl = d3.scaleLinear()
    .domain([0, max_strength])
    .range([margin.top + (height - margin.top - margin.bottom) / 2 - margin.middle, margin.top]);
  var zoom_ySkip = d3.scaleLinear()
    .domain([0, max_strength])
    .range([margin.top + (height - margin.top - margin.bottom) / 2 + margin.middle, height - margin.bottom]);
  var zoom_gyIncl = svg_zoom.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + margin.left + ",0)");
  var zoom_gySkip = svg_zoom.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + margin.left + ",0)");

  var zoom_incl_ylabel = svg_zoom.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "middle")
    .attr("x", -(margin.top + (height - margin.top - margin.bottom) / 4 - margin.middle / 2))
    .attr("y", margin.left)
    .attr("dy", "-3.25em")
    .attr("font-size", "12px")
    .attr("transform", "rotate(-90)")
    .style("fill", background_color)
    .text("Inclusion strength (a.u)");
  var zoom_skip_ylabel = svg_zoom.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "middle")
    .attr("x", -(margin.top / 2 + (height - margin.top - margin.bottom) / 4 + margin.middle / 2 + height / 2 - margin.bottom / 2))
    .attr("y", margin.left)
    .attr("dy", "-3.25em")
    .attr("font-size", "12px")
    .attr("transform", "rotate(-90)")
    .style("fill", background_color)
    .text("Skipping strength (a.u)");

  // Line to segment a single nucleotide
  var left_border = svg_zoom.append("line")
    .attr("x1", zoom_x(0))
    .attr("x2", zoom_x(0))
    .attr("y1", zoom_yIncl(max_strength))
    .attr("y2", zoom_ySkip(max_strength))
    .attr("stroke", "black")
    .attr("stroke-dasharray", [2, 2])
    .attr("opacity", 0);
  var right_border = svg_zoom.append("line")
    .attr("x1", zoom_x(1))
    .attr("x2", zoom_x(1))
    .attr("y1", zoom_yIncl(max_strength))
    .attr("y2", zoom_ySkip(max_strength))
    .attr("stroke", "black")
    .attr("stroke-dasharray", [2, 2])
    .attr("opacity", 0);

  var int_pos = parseInt(pos.slice(4,));

  // Add X axis
  zoom_xInclAxis.tickFormat(function (d) {
    return Array.from(structs.slice(int_pos - 6, int_pos + 5))[d + 5];
  });
  zoom_xSkipAxis.tickFormat(function (d) {
    if (d % 5 == 0 & int_pos + d - 10 > 0 & int_pos + d - 10 < 71) { return int_pos + d - 10; }
    else { return ""; }
  });
  zoom_xNuAxis.tickFormat(function (d) {
    return Array.from(sequence.slice(int_pos - 6, int_pos + 5))[d + 5];
  });
  zoom_gxIncl.transition().duration(800).call(zoom_xInclAxis);
  zoom_gxSkip.transition().duration(800).call(zoom_xSkipAxis);

  zoom_gxNu.call(zoom_xNuAxis);
  zoom_gxNu.selectAll("path")
    .style("stroke-width", 0);
  zoom_gxNu.selectAll(".tick")
    .each(function (d, i) {
      d3.select(this)
        .select("text")
        .attr("font-weight", (d == 0) ? "bold" : "normal")
        .attr("fill", (d == 0) ? "black" : line_color)
    });

  // Data
  var incl_data;
  var skip_data;
  if (typeof incl_data === 'undefined') { incl_data = []; }
  if (typeof skip_data === 'undefined') { skip_data = []; }
  d3.selectAll(".obj.incl." + pos)
    .each(function (d) { incl_data = flatten_nested_json(d); });
  d3.selectAll(".obj.skip." + pos)
    .each(function (d) { skip_data = flatten_nested_json(d); });
  var max_incl = d3.max(d3.map(incl_data, function (d) { return d.strength; }).keys());
  var max_skip = d3.max(d3.map(skip_data, function (d) { return d.strength; }).keys());
  var max_strength = d3.max([max_incl, max_skip]);

  // Add Y axis
  zoom_yIncl.domain([0, max_strength]);
  zoom_ySkip.domain([0, max_strength]);
  zoom_incl_ylabel.transition().duration(800).style("fill", "black");
  zoom_skip_ylabel.transition().duration(800).style("fill", "black");
  zoom_gyIncl.transition().duration(800).call(d3.axisLeft(zoom_yIncl).ticks(5));
  zoom_gySkip.transition().duration(800).call(d3.axisLeft(zoom_ySkip).ticks(5));

  // Remove previous bars
  svg_zoom.selectAll(".incl.wide-bar")
    .transition()
    .duration(300)
    .attr("y", zoom_yIncl(0))
    .attr("height", 0)
    .remove();
  svg_zoom.selectAll(".skip.wide-bar")
    .transition()
    .duration(300)
    .attr("y", zoom_ySkip(0))
    .attr("height", 0)
    .remove();
  svg_zoom.selectAll(".annotate").remove();

  // Add new bars
  svg_zoom.selectAll("incl-feature-bar")
    .data(incl_data)
    .enter()
    .append("rect")
    .attr("class", function (d) { return "obj incl wide-bar " + d.name.split(" ").join("-"); })
    .attr("x", function (d) {
      if (d.length <= 6) {
        return zoom_x(1 - parseInt(d.name.slice(-1)));
      } else {
        return zoom_x(-5);
      }
    })
    .attr("y", zoom_yIncl(0))
    .attr("width", function (d) {
      if (d.length <= 6) {
        return (zoom_x.bandwidth() * d.length);
      } else {
        return zoom_x.bandwidth() * 11;
      }
    })
    .attr("height", 0)
    .attr("fill", inclusion_color)
    .attr("stroke", line_color)
    .attr("opacity", 0.5)
    .lower()
    .on("click", function (d) {
      // svg_zoom.selectAll(".incl.wide-bar")
      //   .attr("fill", inclusion_color)
      //   .attr("opacity", 0.5);
      // svg_zoom.selectAll(".incl.annotate")
      //   .attr("opacity", 0);
      // var feature_class = d3.select(this).attr("class").split(" ")[3];
      // if (!(d3.select(this).classed("focus"))) {
      //   d3.select(this)
      //     .classed("focus", true)
      //     .raise()
      //     .transition()
      //     .duration(300)
      //     .attr("fill", inclusion_highlight_color)
      //     .attr("opacity", 1);
      //   d3.selectAll(".annotate.incl." + feature_class)
      //     .raise()
      //     .transition()
      //     .duration(300)
      //     .attr("opacity", 1);
      //   left_border.raise().transition().duration(300);
      //   right_border.raise().transition().duration(300);
      // } else {
      //   d3.selectAll(".annotate.incl." + feature_class)
      //     .lower()
      //     .transition()
      //     .duration(300)
      //     .attr("opacity", 0);
      //   d3.select(this)
      //     .classed("focus", false)
      //     .lower()
      //     .transition()
      //     .duration(300)
      //     .attr("fill", inclusion_color)
      //     .attr("opacity", 0.5);
      //   left_border.raise().transition().duration(300);
      //   right_border.raise().transition().duration(300);
      // }
    })
    .transition()
    .duration(800)
    .attr("y", function (d) { return zoom_yIncl(d.strength); })
    .attr("height", function (d) { return (margin.top + (height - margin.top - margin.bottom) / 2 - margin.middle) - zoom_yIncl(d.strength); })
    .delay(function (d, i) { return (i * 10); });

  svg_zoom.selectAll("skip-feature-bar")
    .data(skip_data)
    .enter()
    .append("rect")
    .attr("class", function (d) { return "obj skip wide-bar " + d.name.split(" ").join("-"); })
    .attr("x", function (d) {
      if (d.length <= 6) {
        return zoom_x(1 - parseInt(d.name.slice(-1)));
      } else {
        return zoom_x(-5);
      }
    })
    .attr("y", zoom_ySkip(0))
    .attr("width", function (d) {
      if (d.length <= 6) {
        return (zoom_x.bandwidth() * d.length);
      } else {
        return zoom_x.bandwidth() * 11;
      }
    })
    .attr("height", 0)
    .attr("fill", skipping_color)
    .attr("stroke", line_color)
    .attr("opacity", 0.5)
    .lower()
    .on("click", function (d) {
      // svg_zoom.selectAll(".skip.wide-bar")
      //   .attr("fill", skipping_color)
      //   .attr("opacity", 0.5);
      // svg_zoom.selectAll(".skip.annotate")
      //   .attr("opacity", 0);
      // var feature_class = d3.select(this).attr("class").split(" ")[3];
      // if (!(d3.select(this).classed("focus"))) {
      //   d3.select(this)
      //     .classed("focus", true)
      //     .raise()
      //     .transition()
      //     .duration(300)
      //     .attr("fill", skipping_highlight_color)
      //     .attr("opacity", 1);
      //   d3.selectAll(".annotate.skip." + feature_class)
      //     .raise()
      //     .transition()
      //     .duration(300)
      //     .attr("opacity", 1)
      //   left_border.raise().transition().duration(300);
      //   right_border.raise().transition().duration(300);
      // } else {
      //   d3.selectAll(".annotate.skip." + feature_class)
      //     .lower()
      //     .transition()
      //     .duration(300)
      //     .attr("opacity", 0);
      //   d3.select(this)
      //     .classed("focus", false)
      //     .lower()
      //     .transition()
      //     .duration(300)
      //     .attr("fill", skipping_color)
      //     .attr("opacity", 0.5);
      //   left_border.raise().transition().duration(300);
      //   right_border.raise().transition().duration(300);
      // }
    })
    .transition()
    .duration(800)
    .attr("y", (margin.top + (height - margin.top - margin.bottom) / 2 + margin.middle))
    .attr("height", function (d) { return zoom_ySkip(d.strength) - (margin.top + (height - margin.top - margin.bottom) / 2 + margin.middle); })
    .delay(function (d, i) { return (i * 10); });

  svg_zoom.selectAll("incl-feature-text")
    .data(incl_data)
    .enter()
    .append("text")
    .text(function (d) { return (d.name.split(" ")[1]); })
    .attr("class", function (d) { return "annotate incl " + d.name.split(" ").join("-"); })
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("opacity", 0)
    .attr("x", function (d) {
      if (d.length <= 6) {
        return (zoom_x(1 - parseInt(d.name.slice(-1))) + zoom_x.bandwidth() * d.length / 2);
      } else {
        return (zoom_x(-5) + zoom_x.bandwidth() * 11 / 2);
      }
    })
    .attr("y", function (d) { return (zoom_yIncl(d.strength) + zoom_yIncl(0)) / 2; })
    .lower()
    .transition()
    .duration(1000)
    .attr("opacity", 0);

  svg_zoom.selectAll("skip-feature-text")
    .data(skip_data)
    .enter()
    .append("text")
    .text(function (d) { return (d.name.split(" ")[1]); })
    .attr("class", function (d) { return "annotate skip " + d.name.split(" ").join("-"); })
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("opacity", 0)
    .attr("x", function (d) {
      if (d.length <= 6) {
        return (zoom_x(1 - parseInt(d.name.slice(-1))) + zoom_x.bandwidth() * d.length / 2);
      } else {
        return (zoom_x(-5) + zoom_x.bandwidth() * 11 / 2);
      }
    })
    .attr("y", function (d) { return (zoom_ySkip(d.strength) + zoom_ySkip(0)) / 2; })
    .attr("dy", "0.75em")
    .lower()
    .transition()
    .duration(1000)
    .attr("opacity", 0);

  // Add borders
  left_border.raise()
    .transition()
    .duration(1000)
    .attr("opacity", 1);
  right_border.raise()
    .transition()
    .duration(1000)
    .attr("opacity", 1);

}

function flatten_nested_json(data) {
  if (!("children" in data)) { return [data]; }
  var result = [];
  data.children.forEach(function (child) {
    var grandchildren = flatten_nested_json(child)
    grandchildren.forEach(function (grandchild) {
      result.push({
        "name": data.name + " " + grandchild.name,
        "strength": grandchild.strength,
        "length": grandchild.length
      });
    })
  });
  return result;
}