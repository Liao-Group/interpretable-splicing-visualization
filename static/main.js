// Color palette
const inclusion_color = "#c5d6fb";
const inclusion_highlight_color = "#669aff";
const skipping_color = "#f6c3c2";
const skipping_highlight_color = "#ff6666";

const background_color = "#e4e4e4";
const background_model_color = "#e4f2e3"
const line_color = "#6b6b6b";
const strength_difference_color = "#dad7cd";
const nucleotide_color = "black";

d3.json("./get-data", function(data){
  sequence_length = data.sequence.length;
  nucleotide_view(data.sequence, data.structs, data.nucleotide_activations);
})

function recursive_total_strength(data){
  if(!("children" in data)){ return data.strength; }
  else { return d3.sum(d3.map(data["children"], recursive_total_strength).keys()) }
}

function nucleotide_view(sequence, structs, data){
  var margin = {top: 30, right: 10, bottom: 20, left: 50, middle: 22};
  var width = parseFloat(d3.select("svg.nucleotide-view").style("width"));
  var height = parseFloat(d3.select("svg.nucleotide-view").style("height"));
  var svg_nucl = d3.select("svg.nucleotide-view");

  // Title
  svg_nucl.append("text")
          .attr("x", (width / 2))             
          .attr("y", margin.top / 2 + 5)
          .attr("text-anchor", "middle")  
          .style("font-size", "14px") 
          .text("Nucleotide View");

  // Add X axis
  var positions = Array.from(new Array(sequence.length), (x, i) => i + 1);
  var x = d3.scaleBand()
            .range([margin.left, width-margin.right])
            .domain(positions)
            .padding(0.2);
  var xInclAxis = d3.axisBottom(x)
                    .tickSize(2)
                    .tickFormat(function (d) {
                      return Array.from(structs)[d-1];
                    });
  var xSkipAxis = d3.axisTop(x)
                    .tickSize(2)
                    .tickFormat(function (d) {
                      if(d % 5 == 0){ return d} else { return ""};
                    });
  var xNuAxis = d3.axisBottom(x)
                    .tickSize(0)
                    .tickFormat(function (d) {
                      return Array.from(sequence)[d-1];
                    });
  var gxIncl = svg_nucl.append("g")
                      .attr("class", "x axis")
                      .attr("transform", "translate(0," + (margin.top + (height - margin.top - margin.bottom)/2 - margin.middle) + ")")
                      .call(xInclAxis);
  var gxSkip = svg_nucl.append("g")
                      .attr("class", "x axis")
                      .attr("transform", "translate(0," + (margin.top + (height - margin.top - margin.bottom)/2 + margin.middle) + ")")
                      .call(xSkipAxis);
  var gxNu = svg_nucl.append("g")
                      .attr("class", "x axis")
                      .attr("transform", "translate(0," + (margin.top + (height - margin.top - margin.bottom)/2 - 5) + ")")
                      .call(xNuAxis);
  gxNu.selectAll("path")
      .style("stroke-width", 0);
  gxNu.selectAll(".tick")
        .each(function(d, i) {
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
                .range([margin.top + (height - margin.top - margin.bottom)/2 - margin.middle, margin.top]);
  var ySkip= d3.scaleLinear()
                .domain([0, max_strength])
                .range([margin.top + (height - margin.top - margin.bottom)/2 + margin.middle, height-margin.bottom]);
  var gyIncl = svg_nucl.append("g")
                        .attr("class", "y axis")
                        .attr("transform", "translate(" + margin.left + ",0)");
  var gySkip = svg_nucl.append("g")
                        .attr("class", "y axis")
                        .attr("transform", "translate(" + margin.left + ",0)");
  gyIncl.transition().duration(800).call(d3.axisLeft(yIncl).ticks(5));
  gySkip.transition().duration(800).call(d3.axisLeft(ySkip).ticks(5));
  svg_nucl.append("text")
          .attr("class", "y label")
          .attr("text-anchor", "middle")
          .attr("x", -(margin.top + (height - margin.top - margin.bottom)/4 - margin.middle/2))
          .attr("y", margin.left)
          .attr("dy", "-2.25em")
          .attr("font-size", "12px")
          .attr("transform", "rotate(-90)")
          .text("Inclusion strength");
  svg_nucl.append("text")
          .attr("class", "y label")
          .attr("text-anchor", "middle")
          .attr("x", -(margin.top/2 + (height - margin.top - margin.bottom)/4 + margin.middle/2 + height/2 - margin.bottom/2))
          .attr("y", margin.left)
          .attr("dy", "-2.25em")
          .attr("font-size", "12px")
          .attr("transform", "rotate(-90)")
          .text("Skipping strength");


  // Nucleotide bars
  svg_nucl.selectAll("nucleotide-incl-bar")
          .data(data.children[0].children)
          .enter()
          .append("rect")
            .datum(function(d) { return d; })
            .attr("class", function(d) { return "obj incl pos_" + d.name.slice(4); })
            .attr("x", function(d) { return x(parseInt(d.name.slice(4))); })
            .attr("y", function(d) { return yIncl(0); })
            .attr("width", x.bandwidth())
            .attr("height", 0)
            .attr("fill", inclusion_color)
            .attr("stroke", line_color)
            .lower()
            .transition()
              .duration(800)
              .attr("y", function(d) { return yIncl(recursive_total_strength(d)); })
              .attr("height", function(d) { return (margin.top + (height - margin.top - margin.bottom)/2 - margin.middle) - yIncl(recursive_total_strength(d)); })
              .delay(function(d,i){ return(i*10) });
  svg_nucl.selectAll("nucleotide-skip-bar")
          .data(data.children[1].children)
          .enter()
          .append("rect")
            .datum(function(d) { return d; })
            .attr("class", function(d) { return "obj skip pos_" + d.name.slice(4); })
            .attr("x", function(d) { return x(parseInt(d.name.slice(4))); })
            .attr("y", (margin.top + (height - margin.top - margin.bottom)/2 + margin.middle))
            .attr("width", x.bandwidth())
            .attr("height", 0)
            .attr("fill", skipping_color)
            .attr("stroke", line_color)
            .lower()
            .on("mouseover", function(d) {
              d3.select(this).style("fill", skipping_highlight_color);
            }) 
            .on("mouseleave", function(d) {
              d3.select(this).style("fill", skipping_color);
            }) 
            .transition()
              .duration(800)
              .attr("y", (margin.top + (height - margin.top - margin.bottom)/2 + margin.middle))
              .attr("height", function(d) { return ySkip(recursive_total_strength(d)) - (margin.top + (height - margin.top - margin.bottom)/2 + margin.middle); })
              .delay(function(d,i){ return(i*10); });
  
  // Highlight on hover
  gxNu.selectAll(".tick")
        .each(function(d) {
          d3.select(this)
            .select("text")
            .attr("class", "obj nt pos_" + d);
        });

  svg_nucl.selectAll(".obj")
          .classed("free", true);

  svg_nucl.selectAll(".obj.free")
          .on("mouseover", function(d) {
            var pos = d3.select(this)
                        .attr("class")
                        .slice(9,-4);
            d3.select(".obj.incl.free." + pos)
              .style("fill", inclusion_highlight_color);
            d3.select(".obj.skip.free." + pos)
              .style("fill", skipping_highlight_color);
            d3.select(".obj.nt." + pos)
              .style("font-weight", "bold");
          })
          .on("mouseleave", function(d) {
            var pos = d3.select(this)
                        .attr("class")
                        .slice(9,-4);
            d3.select(".obj.incl.free." + pos)
              .style("fill", inclusion_color);
            d3.select(".obj.skip.free." + pos)
              .style("fill", skipping_color);
            d3.select(".obj.nt." + pos)
              .style("font-weight", "normal");
          });

  // Set up for nucleotide zoom
  var zoom_width = parseFloat(d3.select("svg.nucleotide-zoom").style("width"));
  var zoom_height = parseFloat(d3.select("svg.nucleotide-zoom").style("height"));
  var svg_zoom = d3.select("svg.nucleotide-zoom");

  svg_zoom.append("text")
          .attr("x", (zoom_width / 2))             
          .attr("y", margin.top / 2 + 5)
          .attr("text-anchor", "middle")  
          .style("font-size", "14px") 
          .text("Single Nucleotide Zoom View");

  /* Prepare for X axis */
  var positions = Array.from(new Array(11), (x, i) => i - 5);
  var zoom_x = d3.scaleBand()
            .range([margin.left, zoom_width-margin.right])
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
                      .attr("transform", "translate(0," + (margin.top + (height - margin.top - margin.bottom)/2 - margin.middle) + ")");
  var zoom_gxSkip = svg_zoom.append("g")
                      .attr("class", "x axis")
                      .attr("transform", "translate(0," + (margin.top + (height - margin.top - margin.bottom)/2 + margin.middle) + ")");
  var zoom_gxNu = svg_zoom.append("g")
                      .attr("class", "x axis")
                      .attr("transform", "translate(0," + (margin.top + (height - margin.top - margin.bottom)/2 - 5) + ")");

  /* Prepare for Y axis */
  var zoom_yIncl = d3.scaleLinear()
                      .domain([0, max_strength])
                      .range([margin.top + (height - margin.top - margin.bottom)/2 - margin.middle, margin.top]);
  var zoom_ySkip= d3.scaleLinear()
                      .domain([0, max_strength])
                      .range([margin.top + (height - margin.top - margin.bottom)/2 + margin.middle, height-margin.bottom]);
  var zoom_gyIncl = svg_zoom.append("g")
                            .attr("class", "y axis")
                            .attr("transform", "translate(" + margin.left + ",0)");
  var zoom_gySkip = svg_zoom.append("g")
                            .attr("class", "y axis")
                            .attr("transform", "translate(" + margin.left + ",0)");

  var zoom_incl_ylabel = svg_zoom.append("text")
                                  .attr("class", "y label")
                                  .attr("text-anchor", "middle")
                                  .attr("x", -(margin.top + (height - margin.top - margin.bottom)/4 - margin.middle/2))
                                  .attr("y", margin.left)
                                  .attr("dy", "-2.25em")
                                  .attr("font-size", "12px")
                                  .attr("transform", "rotate(-90)")
                                  .style("fill", background_color)
                                  .text("Inclusion strength");
  var zoom_skip_ylabel = svg_zoom.append("text")
                                  .attr("class", "y label")
                                  .attr("text-anchor", "middle")
                                  .attr("x", -(margin.top/2 + (height - margin.top - margin.bottom)/4 + margin.middle/2 + height/2 - margin.bottom/2))
                                  .attr("y", margin.left)
                                  .attr("dy", "-2.25em")
                                  .attr("font-size", "12px")
                                  .attr("transform", "rotate(-90)")
                                  .style("fill", background_color)
                                  .text("Skipping strength");

  // Line to segment a single nucleotide
  var left_border = svg_zoom.append("line")
                            .attr("x1", zoom_x(0))
                            .attr("x2", zoom_x(0))
                            .attr("y1", zoom_yIncl(max_strength))
                            .attr("y2", zoom_ySkip(max_strength))
                            .attr("stroke", "black")
                            .attr("stroke-dasharray", [2,2])
                            .attr("opacity", 0);
  var right_border = svg_zoom.append("line")
                            .attr("x1", zoom_x(1))
                            .attr("x2", zoom_x(1))
                            .attr("y1", zoom_yIncl(max_strength))
                            .attr("y2", zoom_ySkip(max_strength))
                            .attr("stroke", "black")
                            .attr("stroke-dasharray", [2,2])
                            .attr("opacity", 0);

  // Show nucleotide zoom on hover
  svg_nucl.selectAll(".obj.free")
          .on("click", function(d) {
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
                        .slice(9,-4);
            d3.select(".obj.incl.free." + pos)
              .style("fill", inclusion_highlight_color)
              .classed("free", false);
            d3.select(".obj.skip.free." + pos)
              .style("fill", skipping_highlight_color)
              .classed("free", false);
            d3.select(".obj.nt." + pos)
              .style("font-weight", "bold")
              .classed("free", false);
            nucleotide_zoom(sequence, structs, svg_nucl, pos, margin, zoom_width, zoom_height, svg_zoom, zoom_x, zoom_xInclAxis, zoom_xSkipAxis, zoom_xNuAxis, zoom_gxIncl, zoom_gxSkip, zoom_gxNu, max_strength, zoom_yIncl, zoom_ySkip, zoom_gyIncl, zoom_gySkip, zoom_incl_ylabel, zoom_skip_ylabel, left_border, right_border);
          });
}

function nucleotide_zoom(sequence, structs, svg_nucl, pos, margin, width, height, svg_zoom, x, xInclAxis, xSkipAxis, xNuAxis, gxIncl, gxSkip, gxNu, old_max_strength, yIncl, ySkip, gyIncl, gySkip, incl_ylabel, skip_ylabel, left_border, right_border){
  var int_pos = parseInt(pos.slice(4,));

  // Add X axis
  xInclAxis.tickFormat(function (d) { 
              return Array.from(structs.slice(int_pos-5, int_pos+6))[d+5];
            });
  xSkipAxis.tickFormat(function (d) {
              return int_pos + d;
            });;
  xNuAxis.tickFormat(function (d) {
            return Array.from(sequence.slice(int_pos-5, int_pos+6))[d+5];
          });
  gxIncl.transition().duration(800).call(xInclAxis);
  gxSkip.transition().duration(800).call(xSkipAxis);
  gxNu.call(xNuAxis);
  gxNu.selectAll("path")
      .style("stroke-width", 0);
  gxNu.selectAll(".tick")
        .each(function(d, i) {
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
    .each(function(d) { incl_data = flatten_nested_json(d); });
  d3.selectAll(".obj.skip." + pos)
    .each(function(d) { skip_data = flatten_nested_json(d); });
  var max_incl = d3.max(d3.map(incl_data, function(d){ return d.strength; }).keys());
  var max_skip = d3.max(d3.map(skip_data, function(d){ return d.strength; }).keys());
  var max_strength = d3.max([max_incl, max_skip]);

  // Add Y axis
  yIncl.domain([0, max_strength]);
  ySkip.domain([0, max_strength]);
  incl_ylabel.transition().duration(800).style("fill", "black");
  skip_ylabel.transition().duration(800).style("fill", "black");
  gyIncl.transition().duration(800).call(d3.axisLeft(yIncl).ticks(5));
  gySkip.transition().duration(800).call(d3.axisLeft(ySkip).ticks(5));
  
  // Remove previous bars
  svg_zoom.selectAll(".incl.wide-bar")
          .transition()
            .duration(300) 
            .attr("y", yIncl(0))
            .attr("height", 0)
          .remove();
  svg_zoom.selectAll(".skip.wide-bar")
          .transition()
            .duration(300) 
            .attr("y", ySkip(0))
            .attr("height", 0)
          .remove();
  svg_zoom.selectAll(".annotate").remove();

  // Add new bars
  svg_zoom.selectAll("incl-feature-bar")
          .data(incl_data)
          .enter()
          .append("rect")
            .attr("class", function(d){ return "obj incl wide-bar " + d.name.split(" ").join("-"); })
            .attr("x", function(d) { 
              if(d.length <= 6){ 
                return x(1 - parseInt(d.name.slice(-1))); 
              } else { 
                return x(-5); 
            }})
            .attr("y", yIncl(0))
            .attr("width", function(d) { 
              if(d.length <= 6){ 
                return (x.bandwidth() * d.length);
              } else {
                return x.bandwidth() * 11;
            }})
            .attr("height", 0 )
            .attr("fill", inclusion_color)
            .attr("stroke", line_color)
            .attr("opacity", 0.5)
            .lower()
            .on("click", function(d){
              svg_zoom.selectAll(".incl.wide-bar")
                      .attr("fill", inclusion_color)
                      .attr("opacity", 0.5);
              svg_zoom.selectAll(".incl.annotate")
                      .attr("opacity", 0);
              var feature_class = d3.select(this).attr("class").split(" ")[3];
              if(!(d3.select(this).classed("focus"))){
                d3.select(this)
                  .classed("focus", true)
                  .raise()
                  .transition()
                    .duration(300)
                    .attr("fill", inclusion_highlight_color)
                    .attr("opacity", 1);
                d3.selectAll(".annotate.incl." + feature_class)
                  .raise()
                  .transition()
                    .duration(300)
                    .attr("opacity", 1);
                left_border.raise().transition().duration(300);
                right_border.raise().transition().duration(300);
              } else {
                d3.selectAll(".annotate.incl." + feature_class)
                  .lower()
                  .transition()
                    .duration(300)
                    .attr("opacity", 0);
                d3.select(this)
                  .classed("focus", false)
                  .lower()
                  .transition()
                    .duration(300)
                    .attr("fill", inclusion_color)
                    .attr("opacity", 0.5);
                left_border.raise().transition().duration(300);
                right_border.raise().transition().duration(300);
              }
            })
            .transition()
              .duration(800) 
              .attr("y", function(d) { return yIncl(d.strength); })
              .attr("height", function(d) { return (margin.top + (height - margin.top - margin.bottom)/2 - margin.middle) - yIncl(d.strength); })
              .delay(function(d,i){ return(i*10); });

  svg_zoom.selectAll("skip-feature-bar")
          .data(skip_data)
          .enter()
          .append("rect")
            .attr("class", function(d){ return "obj skip wide-bar " + d.name.split(" ").join("-"); })
            .attr("x", function(d) { 
              if(d.length <= 6){ 
                return x(1 - parseInt(d.name.slice(-1))); 
              } else { 
                return x(-5); 
            }})
            .attr("y", ySkip(0))
            .attr("width", function(d) { 
              if(d.length <= 6){ 
                return (x.bandwidth() * d.length);
              } else {
                return x.bandwidth() * 11;
            }})
            .attr("height", 0)
            .attr("fill", skipping_color)
            .attr("stroke", line_color)
            .attr("opacity", 0.5)
            .lower()
            .on("click", function(d){
              svg_zoom.selectAll(".skip.wide-bar")
                      .attr("fill", skipping_color)
                      .attr("opacity", 0.5);
              svg_zoom.selectAll(".skip.annotate")
                      .attr("opacity", 0);
              var feature_class = d3.select(this).attr("class").split(" ")[3];
              if(!(d3.select(this).classed("focus"))){
                d3.select(this)
                  .classed("focus", true)
                  .raise()
                  .transition()
                    .duration(300)
                    .attr("fill", skipping_highlight_color)
                    .attr("opacity", 1);
                d3.selectAll(".annotate.skip." + feature_class)
                  .raise()
                  .transition()
                    .duration(300)
                    .attr("opacity", 1)
                left_border.raise().transition().duration(300);
                right_border.raise().transition().duration(300);
              } else {
                d3.selectAll(".annotate.skip." + feature_class)
                  .lower()
                  .transition()
                    .duration(300)
                    .attr("opacity", 0);
                d3.select(this)
                  .classed("focus", false)
                  .lower()
                  .transition()
                    .duration(300)
                    .attr("fill", skipping_color)
                    .attr("opacity", 0.5);
                left_border.raise().transition().duration(300);
                right_border.raise().transition().duration(300);
              }
            })
            .transition()
              .duration(800) 
              .attr("y", (margin.top + (height - margin.top - margin.bottom)/2 + margin.middle))
              .attr("height", function(d) { return ySkip(d.strength) - (margin.top + (height - margin.top - margin.bottom)/2 + margin.middle); })
              .delay(function(d,i){ return(i*10); });

  svg_zoom.selectAll("incl-feature-text")
          .data(incl_data)
          .enter()
          .append("text")
            .text(function(d){ return(d.name.split(" ")[1]); })
            .attr("class", function(d){ return "annotate incl " + d.name.split(" ").join("-"); })
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("opacity", 0)
            .attr("x", function(d){
              if(d.length <= 6){
                return (x(1 - parseInt(d.name.slice(-1))) + x.bandwidth() * d.length/2);
              } else {
                return (x(-5) + x.bandwidth() * 11/2);
            }})
            .attr("y", function(d){ return (yIncl(d.strength) + yIncl(0))/2; })
            .lower()
            .transition()
              .duration(1000)
              .attr("opacity", 0);

  svg_zoom.selectAll("skip-feature-text")
          .data(skip_data)
          .enter()
          .append("text")
            .text(function(d){ return(d.name.split(" ")[1]); })
            .attr("class", function(d){ return "annotate skip " + d.name.split(" ").join("-"); })
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("opacity", 0)
            .attr("x", function(d){
              if(d.length <= 6){
                return (x(1 - parseInt(d.name.slice(-1))) + x.bandwidth() * d.length/2);
              } else {
                return (x(-5) + x.bandwidth() * 11/2);
            }})
            .attr("y", function(d){ return (ySkip(d.strength) + ySkip(0))/2; })
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

function flatten_nested_json(data){
  if(!("children" in data)){ return [data]; }
  var result = [];
  data.children.forEach(function(child) {
      var grandchildren = flatten_nested_json(child)
      grandchildren.forEach(function(grandchild){
        result.push({
          "name": data.name + " " + grandchild.name,
          "strength": grandchild.strength,
          "length": grandchild.length
        });
      })
    });
  return result;
}