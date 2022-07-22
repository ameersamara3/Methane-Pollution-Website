let countries=[]
let colorrs=["rgb(165, 15, 21)","rgb(0, 0, 0)","rgb(0, 0, 255)","rgb(255, 127, 0)","rgb(145, 0, 255)","rgb(51, 102, 0)","rgb(204, 51, 153)"]
let gbdata
function filtering(data, year) {
  //for filtering data function
  let country = {},
    country_arr = [],
    count_obj = {},
    country_area = {};
  let total = 0;
  let country_line = {};
  data.forEach((d) => {
    d[year] = parseFloat(d[year]);
    if (
      d.Sector.localeCompare("Total including LUCF") != 0 &&
      d.Sector.localeCompare("Total excluding LUCF") != 0
    ) {
      if (count_obj[d.Country] == undefined) {
        count_obj[d.Country] = {};
        country_area[d.Country] = [d.Area_km_sq];
      }
      count_obj[d.Country][d.Sector] = d[year];
    }
  });
  Object.keys(count_obj).forEach((k) => {
    if (
      k.localeCompare("European Union") != 0 &&
      k.localeCompare("European Union (27)") != 0 &&
      k.localeCompare("World") != 0
    ) {
      Object.keys(count_obj[k]).forEach((d) => {
        total = total + count_obj[k][d];
      });
      country[k] =
        Math.round(
          (total / parseFloat(country_area[k] / 1000000) + Number.EPSILON) * 100
        ) / 100;
      country_arr.push({
        country: k,
        value:
          Math.round(
            (total / parseFloat(country_area[k] / 1000000) + Number.EPSILON) *
              100
          ) / 100,
      });
      total = 0;
    }
  });
  return { country: country, country_arr: country_arr, count_obj: count_obj };
}

function dashboard() {
  d3.csv("methane_hist_emissions.csv").then((data) => {
    //loading csv
    var countries=["Russia"];
    let result = filtering(data, "1990"); //for first time chart filtering data on the start year
    let years = [
      1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001,
      2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013,
      2014, 2015, 2016, 2017, 2018,
    ];
	document.getElementById("clr").addEventListener("click", clear);
    let years_result = [];
    years.forEach((d) => {
      let temp = filtering(data, d);
      years_result.push({ year: d, count: temp.country });
    });

    let country_line_obj = {},
      arr = [];

    Object.keys(years_result[0].count).forEach((b) => {
      years_result.forEach((d) => {
        arr.push({ year: d.year, value: d.count[b], name : b});
      }); 
      country_line_obj[b] = arr;
      arr = [];
    });

    d3.select("#years").on("change", (d, i) => {
      //this will call when the year dropdown value change
      let year = document.getElementById("years").value; //getting changed value
      result = filtering(data, year); //calling filter
      map(
        result.country,
        result.country_arr,
        result.count_obj,
        country_line_obj
      ); //calling drawing function
    });

    map(result.country, result.country_arr, result.count_obj, country_line_obj); //calling drawing function
    bar(result.count_obj["United States"], "United States");
  });
}

function map(data, data_arr, bar_obj, line_obj) {
  //drawing function
  d3.select("#world_chart svg").remove(); //remove previous drawn chart for filteration
  d3.select("#world_legend svg").remove();
  d3.select("#world_chart div").remove(); //remove previous drawn tooltip for filteration
  let width = 401,
    height = 285;

  let svg = d3 //adding svg container
    .select("#world_chart")
    .append("svg")
    .attr("width", width + 121 + 121)
    .attr("height", height + 71 + 71)
    .attr("transform", `translate(201,0)`)
    .append("g")
    .attr("transform", `translate(140,0)`);

  let world_tooltip = d3
    .select("#world_chart")
    .append("div") //adding tooltip div
    .attr("id", "tooltip")
    .style("opacity", 0);
  // Map and projection
  let projection = d3
    .geoMercator()
    .scale(Math.min(width, height) / (width > height ? 3.11 : 7)) //for increasing map size
    .translate([width / 2, height / 1, 0.5]); //for map positioning x and y axis

  let max = d3.max(data_arr, function (d) {
    //finding max value in the data arr
    return d.value;
  });
  let min = d3.min(data_arr, function (d) {
    //finding min value in the data arr
    return d.value;
  });

  data_arr = data_arr.sort(function (a, b) {
    return a.value - b.value;
  });

  let parts = Math.floor(data_arr.length / 4);
  let parts10 = Math.floor(data_arr.length / 10);


  let ranges = [];

  let part1 = 0;
  let part2 = data_arr[parts * 1].value;
  let part3 = data_arr[parts * 2].value;
  let part4 = data_arr[parts * 3].value;
  let part5 = data_arr[parts * 4-parts10].value;

  let part6 = max;

  ranges.push(part1, part2, part3, part4, part5);

  var path = d3.geoPath().projection(projection);
  let centered;
  let colorTheme = d3 //making color scheme
    .scaleQuantile()
    .range(["grey","#feceb1","#ffaf80", "#f77d54", "#f55b27", "#c23404"])
    .domain([0, 1, 2, 3, 4,5]);
  let worldMap;

  d3.json("globe.json").then((world) => {
    //loading world json file for making map
    worldMap = svg //drawing world map
      .append("g")
      .selectAll("path")
      .data(world.features)
      .enter()
      .append("path")
      .attr("d", d3.geoPath().projection(projection))
      .attr("fill", function (d) {
        //filling color on the basis of values
        if (
          parseFloat(data[d.properties.name]) > part1 &&
          parseFloat(data[d.properties.name]) <= part2
        ) {
          return colorTheme(1);
        } else if (
          parseFloat(data[d.properties.name]) > part2 &&
          parseFloat(data[d.properties.name]) <= part3
        ) {
          return colorTheme(2);
        } else if (
          parseFloat(data[d.properties.name]) > part3 &&
          parseFloat(data[d.properties.name]) <= part4
        ) {
          return colorTheme(3);
        } else if (
          parseFloat(data[d.properties.name]) > part4 &&
          parseFloat(data[d.properties.name]) <= part5
        ) {
          return colorTheme(4);
        }else if (
          parseFloat(data[d.properties.name]) > part5 &&
          parseFloat(data[d.properties.name]) <= part6
        ) {
          return colorTheme(5);
        } else {
          return colorTheme(0);
        }
      })
      .style("stroke", "transparent")
      .attr("class", function (d) {
        return "selected_country";
      })
      .style("opacity", 0.8);

    worldMap
      .on("mouseover", function (i, d) {
        //for tooltip effects
        d3.selectAll(".selected_country").style("opacity", 0.5);
        d3.select(this).style("opacity", 1).style("stroke", "black");

        d3.select(this).style("fill-opacity", 1);
        world_tooltip.transition().duration(300).style("opacity", 1);
        world_tooltip
          .html(
            `<span style="font-size:20px;font-weight:bold">Country: ${
              d.properties.name
            }<br></span><span style="font-size:20px;font-weight:bold">ME(G/km<sup>2</sup>): ${
              data[d.properties.name] || 0
            }`
          )
          .style("visibility", "visible") //adding values on tooltip
          .style("left", event.pageX + "px")
          .style("top", event.pageY - 30 + "px");
      })
      .on("mouseleave", function (d) {
        // for hiding tooltip effects
        d3.selectAll(".selected_country").style("opacity", 0.8);

        d3.select(this).style("stroke", "transparent");

        world_tooltip
          .style("visibility", "none")
          .transition()
          .duration(301)
          .style("opacity", 0);
      })
      .on("click", clicked);
  });

  function clicked(i, d) {
    //zoom function and bar call function
    selected_country = d.properties.name;
    let bar_arr = bar_obj[selected_country];
	
    if (line_obj[d.properties.name] != undefined)
      lineChart(line_obj, d.properties.name);
    if (bar_arr != undefined) bar(bar_arr, d.properties.name);
    var x, y, k;

    if (d && centered !== d) {
      //checking if clicked value valid and not already zoomed
      var centroid = path.centroid(d);
      x = centroid[0];
      y = centroid[1];
      k = 4;
      centered = d;
    } else {
      //if already zoomed and have to zoom out
      x = width / 2;
      y = height / 2;
      k = 1;
      centered = null;
    }

    worldMap.selectAll("path").classed(
      "active",
      centered &&
        function (d) {
          return d === centered;
        }
    );

    worldMap //zooming unzooming with animation/transition
      .transition()
      .duration(750)
      .attr(
        "transform",
        "translate(" +
          width / 2 +
          "," +
          height / 2 +
          ")scale(" +
          k +
          ")translate(" +
          -x +
          "," +
          -y +
          ")"
      )
      .style("stroke-width", 1.5 / k + "px");
  }

  //g container for legends
  let g = //svg
    d3
      .select("#world_legend")
      .append("svg")
      .attr("class", "legendScheme")
      .attr("width", 370)
      .attr("height", 301)
      .append("g")
      .attr("width", 370)
      .attr("height", 301)
      .attr("transform", `translate(51,51)`);
  // /.attr("transform", "translate(-55,25)");
  g.append("text")
    .attr("class", "caption")
    .attr("x", 0)
    .attr("y", -6)
    .text("Methane Emissions");

  //legend labels
  let labels = [
    "No Data",
    "Top 100%-75% Countries",
    "Top 75%-50% Countries",
    "Top 50%-25% Countries",
    "Top 25%-10% Countries",
    "Top 10% Countries",
  ];

  //legend  code
  let legend = d3
    .legendColor()
    .labels(function (d) {
      const margin = { top: 30, right: 30, bottom: 70, left: 60 },
        width = 460 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;
      return labels[d.i];
    })
    .shapePadding(4)
    .scale(colorTheme);
  g.call(legend);
}

function bar(data_obj, country) {
  d3.select("#bar svg").remove(); //remove drawn chart
  d3.select("#bar div").remove(); //remove drawn tooltip
  const margin = { top: 30, right: 30, bottom: 121, left: 60 },
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

  // adding svg
  const svg = d3
    .select("#bar")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 0 - margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "21px")
    .text(country);

  let bar_tooltip = d3
    .select("#bar")
    .append("div") //adding tooltip div
    .attr("id", "tooltip")
    .style("opacity", 0);

  //data formatting for chart
  let data = [];
  Object.keys(data_obj).forEach((d) => {
    data.push({ key: d, value: data_obj[d] });
  });

  //data sorting
  data.sort(function (b, a) {
    return a.value - b.value;
  });

  // X axis
  const x = d3
    .scaleBand()
    .range([0, width])
    .domain(data.map((d) => d.key))
    .padding(0.2);
  svg
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

  svg
    .append("text")
    .attr(
      "transform",
      "translate(" + width / 2 + " ," + (height + margin.bottom) + ")"
    )
    .style("text-anchor", "middle")
    .text("Sectors");

  // Add Y axis
  const y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(data, function (d) {
        return d.value;
      }),
    ])
    .range([height, 0]);
  svg.append("g").call(d3.axisLeft(y));

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - height / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Methane Emissions in Metric Tons (MTCO2e)");

  // Bars
  let bars = svg
    .selectAll("mybar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "selected_bars")
    .attr("x", (d) => x(d.key))
    .attr("y", (d) => y(d.value))
    .attr("width", x.bandwidth())
    .attr("height", (d) => height - y(d.value))
    .attr("fill", "rgb(165, 15, 21)")
    .style("opacity", 0.81);

  bars
    .on("mouseover", function (i, d) {
      //showing tooltip effects
      d3.selectAll(".selected_bars").style("opacity", 0.5);
      d3.select(this).style("opacity", 1).style("stroke", "black");

      d3.select(this).style("fill-opacity", 1);
      bar_tooltip.transition().duration(300).style("opacity", 1);
      bar_tooltip
        .html(
          `<span style="font-size:20px;font-weight:bold">Producer: ${d.key}<br></span><span style="font-size:20px;font-weight:bold">MTCO2e: ${d.value}`
        )
        .style("visibility", "visible") //adding values on tooltip
        .style("left", event.pageX + "px")
        .style("top", event.pageY - 30 + "px");
    })
    .on("mouseleave", function (d) {
      //hiding tooltip effects
      d3.selectAll(".selected_bars").style("opacity", 0.8);

      d3.select(this).style("stroke", "transparent");

      bar_tooltip
        .style("visibility", "none")
        .transition()
        .duration(301)
        .style("opacity", 0);
    });
}

function lineChart(data1, country) {
  if (countries.filter(function(e) { return e === country }).length > 0) {
    return;
  }
  if(countries.length==7){
     alert("You can't plot more than 7 lines on the lineChart, Please remove a line in order to add another , you can click on a line point to remove the line, or click the clear button");
     return;
  }
  gbdata = data1
  d3.select("#line svg").remove(); //remove drawn chart
  d3.select("#line_legend svg").remove(); //remove legend
  d3.select("#line div").remove(); //remove drawn tooltip
  if(country=="None" && countries.length==0){
   return;
  }
  
  
  
  let data = []
  if(country != "None")
  	countries.push(country);
  for (let i = 0; i < countries.length; i++) {
  	data.push(JSON.parse(JSON.stringify(data1[countries[i]])));
}
  
  
  const margin = { top: 30, right: 30, bottom: 121, left: 60 },
    width = 1060 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

  const svg = d3
    .select("#line")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  /*svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 0 - margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "21px")
    .text(countries[0]);
*/
  let line_tooltip = d3
    .select("#line")
    .append("div") //adding tooltip div
    .attr("id", "tooltip")
    .style("opacity", 0);

  let parseTime = d3.timeParse("%Y");
  for (let i = 0; i < data.length; i++) {
  	data[i].forEach((d) => {
    	d.year = parseTime(d.year);
  	});
  }

  var x = d3
    .scaleTime()
    .domain(
      d3.extent(data[0], function (d) {
        return d.year;
      })
    )
    .range([0, width]);
  svg
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  svg
    .append("text")
    .attr("transform", "translate(" + width / 2 + " ," + (height + 51) + ")")
    .style("text-anchor", "middle")
    .text("Years");

  // Add Y axis
  const y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(data, function (d) {
        return d3.max(d, function (d) {
        return d.value;
      });
      }),
    ])
    .range([height, 0]);

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - height / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Methane Emissions (Grams per KM^2)");

  svg.append("g").call(d3.axisLeft(y));
  // Add the line
  for (let i = 0; i < data.length; i++) {
     svg
    	.append("path")
    	.datum(data[i])
    	.attr("fill", "none")
    	.attr("stroke", colorrs[i])
    	.attr("stroke-width", 1.5)
    	.attr(
     	 "d",
     	 d3
      	  .line()
       	 .x((d) => x(d.year))
       	 .y((d) => y(d.value))
    	);
 
  // Add the points
  svg
    .append("g")
    .selectAll("dot")
    .data(data[i])
    .join("circle")
    .attr("cx", (d) => x(d.year))
    .attr("cy", (d) => y(d.value))
    .attr("r", 3)
    .attr("fill", colorrs[i])
    .on("mouseover", function (i, d) {
      d3.select(this).style("r", 9);
      line_tooltip.transition().duration(300).style("opacity", 1);
      line_tooltip
        .html(
          `<span style="font-size:20px;font-weight:bold">Country: ${d.name}<br></span><span style="font-size:20px;font-weight:bold">Year: ${d.year.getFullYear()}<br></span><span style="font-size:20px;font-weight:bold">ME(G/km<sup>2</sup>): ${d.value}</span>`
        )
        .style("visibility", "visible") //adding values on tooltip
        .style("left", event.pageX + "px")
        .style("top", event.pageY - 30 + "px");
    })
    .on("mouseleave", function (d) {
      d3.select(this).style("r", 3);
      line_tooltip.transition().duration(300).style("opacity", 0);
      line_tooltip
        .style("visibility", "none")
        .transition()
        .duration(301)
        .style("opacity", 0);
    }).on("click", removeLine);
    }
    let g = //svg
    d3
      .select("#line_legend")
      .append("svg")
      .attr("class", "legendScheme")
      .attr("width", 370)
      .attr("height", 301)
      .append("g")
      .attr("width", 370)
      .attr("height", 301)
      .attr("transform", `translate(51,51)`);
  // /.attr("transform", "translate(-55,25)");
  g.append("text")
    .attr("class", "caption")
    .attr("x", 0)
    .attr("y", -6)
    .text("Countries");
    
let colorTheme = d3 //making color scheme
    .scaleQuantile()
    .range(colorrs.slice(0,countries.length))
    .domain([0, 1, 2, 3, 4].slice(0,countries.length));
  //legend  code
  let legend = d3
    .legendColor()
    .labels(function (d) {
      const margin = { top: 30, right: 30, bottom: 121, left: 60 },
        width = 1060 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;
      return countries[d.i];
    })
    .shapePadding(4)
    .scale(colorTheme);
  g.call(legend);
}
function removeLine(i, d) {
   let ind = countries.indexOf(d.name);
   countries.splice(ind, 1);
   let temp= colorrs[ind];// save color for each country
   colorrs.splice(ind, 1);
   colorrs.push(temp);
   lineChart(gbdata,"None");

}
function clear() {
   countries = [];
   lineChart(gbdata,"None");

}