/* Stylesheet by Yifeng Ai, 2019 */
//initialize function called when the script loads
(function() {
var attrArray = ["gdp_1980","gdp_1985","gdp_1990","gdp_1995","gdp_2000","gdp_2005","gdp_2008","gdp_2009","gdp_2010"];
var expressed = attrArray[8]; //initial attribute

window.onload = setMap()

function setMap() {
 //map frame dimensions
    var width = window.innerWidth * 0.5
        height = window.innerHeight * 0.9;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on Asia
    var projection = d3.geoAlbers()
        .center([3.64,36.33])
        .rotate([-91, 7.27, 0])
        .parallels([18.36,52])
        .scale(400)
        .translate([width / 2, height / 2]);
    var path = d3.geoPath()
        .projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [];
    promises.push(d3.csv("data/China_province_data.csv")); //load attributes from csv
    promises.push(d3.json("data/Asia_countries.topojson")); //load background spatial data
    promises.push(d3.json("data/China_provinces.topojson")); //load choropleth spatial data
    Promise.all(promises).then(callback);

    function callback(data) {
	    csvData = data[0];
	    asia = data[1];
        china = data[2];
        
        setGraticule(map,path)

        // get geographic paths from Asia_countries and China_provinces
        var asia_countries = topojson.feature(asia, asia.objects.Asia_countries),
            china_provinces = topojson.feature(china, china.objects.China_provinces).features

        // append the path from countries
        var countries = map.append("path")
            .datum(asia_countries)
            .attr("class", "countries")
            // data will be projected according to variable path
            .attr("d", path);
        
        china_provinces = joinData(china_provinces,csvData)

        var colorScale = makeColorScale(csvData)

        setEnumerationUnits(china_provinces,map,path,colorScale)

        setChart(csvData, colorScale)
        }
    }

/*function setChart(csvData, colorScale) {
    var chartWidth = window.innerWidth * 0.425
        chartHeight = window.innerHeight * 0.9

    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");
    
    //Example 2.1 line 17...create a second svg element to hold the bar chart

    //create a scale to size bars proportionally to frame
    var yScale = d3.scaleLinear()
        .range([0, chartHeight])
        .domain([0, 30000]);

    //Example 2.4 line 8...set bars for each province
    var bars = chart.selectAll(".bars")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a,b) {
            return a[expressed] - b[expressed]
        })
        .attr("class", function(d){
            return "bars " + d.Admin_division;
        })
        .attr("width", chartWidth / csvData.length - 1)
        .attr("x", function(d, i){
            return i * (chartWidth / csvData.length);
        })
        .attr("height", function(d){
            return yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d){
            return chartHeight - yScale(parseFloat(d[expressed]));
        })
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
    
    var numbers = chart.selectAll(".numbers")
        .data(csvData)
        .enter()
        .append("text")
        .sort(function(a, b){
            return a[expressed]-b[expressed]
        })
        .attr("class", function(d){
            return "numbers " + d.Admin_division
        })
        .attr("text-anchor", "middle")
        .attr("x", function(d, i){
            var fraction = chartWidth / csvData.length;
            return i * fraction + (fraction - 1) / 2;
        })
        .attr("y", function(d){
            return chartHeight - yScale(parseFloat(d[expressed])) + 15;
        })
        .text(function(d){
            return d[expressed];
        });
    var chartTitle = chart.append("text")
        .attr("x", 20)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("GDP of year 2010 in each region");
}*/

function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473,
        leftPadding = 35,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //create a scale to size bars proportionally to frame and for axis
    var yScale = d3.scaleLinear()
        .range([460, 0])
        .domain([0, 30000]);

    //set bars for each province
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.Admin_division;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });

    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("GDP of year 2010 in each province");

    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
};

function makeColorScale(data){
        var colorClasses = [
            "#D4B9DA",
            "#C994C7",
            "#DF65B0",
            "#DD1C77",
            "#980043"
        ];
    
        //create color scale generator
        var colorScale = d3.scaleQuantile()
            .range(colorClasses);

        //build array of all values of the expressed attribute
        var domainArray = [];
        for (var i=0; i<data.length; i++){
            var val = parseFloat(data[i][expressed]);
            domainArray.push(val);
        };

        //assign array of expressed values as scale domain
        colorScale.domain(domainArray);
    
        return colorScale;
    };

function setGraticule(map,path) {
    var graticule = d3.geoGraticule()
        .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

    //create graticule lines
    var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
        .data(graticule.lines()) //bind graticule lines to each element to be created
        .enter() //create an element for each datum
        .append("path") //append each element to the svg as a path element
        .attr("class", "gratLines") //assign class for styling
        .attr("d", path); //project graticule lines
}

function joinData(china_provinces,csvData) {
    //loop through csv to assign each set of csv attribute values to geojson region
    console.log(china_provinces)
    console.log(csvData)
    console.log(typeof(china_provinces) + typeof(csvData))
    newProvArr = []
    for (var i = 0; i < csvData.length; i++){
        var csvRegion = csvData[i]; //the current region
        console.log("CSV",csvRegion)
        var csvKey = csvRegion.Admin_division; //the CSV primary key
        var cKey_abbrev = csvKey.split(' ')[0]
    
        //loop through geojson regions to find correct region
        for (var a = 0; a < china_provinces.length; a++){
    
            var geojsonProps = china_provinces[a].properties; //the current region geojson properties
            var geojsonKey = geojsonProps.ADM1_EN; //the geojson primary key
            //console.log('geojsonKey',geojsonKey)
            var gKey_abbrev = (geojsonKey.split(' '))[0];  //the first letter that indicates province name can match with csv key
    
            //where primary keys match, transfer csv data to geojson properties object
            if (cKey_abbrev == gKey_abbrev){
                console.log(cKey_abbrev + gKey_abbrev)
                newProvArr.push(geojsonProps)

                //assign all attributes and values
                attrArray.forEach(function(attr){
                    console.log('CSVREGION',csvRegion)
                    var val = parseFloat(csvRegion[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                });
            };
        }
    }
    return china_provinces
}

function setEnumerationUnits(china_provinces,map,path,colorScale) {
    //add France regions to map
    console.log('COLOR',colorScale)

    var provinces = map.selectAll(".provinces")
        .data(china_provinces)
        .enter()
        .append("path")
        .attr("class", function(d) {
            console.log('PROV',d.properties)
            return "provinces " + d.properties.ADM1_EN;
        })
        // data will be projected accodingto variable path
        .attr("d", path)
        .style('fill', function(d) {
            return choropleth(d.properties,colorScale)
        })
    }

function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};

})()
