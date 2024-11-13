class LineChart {
    constructor(_parentElement, _data, _xdata, _xlabel = "", _ydata, _ylabel = "", _group, _dimension = { width: 928, height: 500 }, _legend = { noCol: 1, widthCol: 65 }, _rebase = true) {
        this.parentElement = _parentElement; // Parent element where the chart will be appended
        this.data = _data; // Data for the chart
        this.xdata = _xdata; // X-axis data
        this.ydata = _ydata; // Y-axis data
        this.group = _group; // Grouping variable
        this.dimension = _dimension; // Dimension of the chart
        this.xlabel = _xlabel; // X-axis label
        this.ylabel = _ylabel; // Y-axis label
        this.legend = _legend; // Legend configuration
        this.rebase = _rebase; // Rebase the data to a common starting point
        this.initVis(); // Initialize the chart
    }

    toggleOpacity(element) {
        const opacity = element.style("opacity") === "0.1" ? 1 : 0.1; // Toggle the opacity of an element
        element.style("opacity", opacity);
    };



    initVis() {
        const vis = this;
        vis.MARGIN = { TOP: 50, RIGHT: 5, BOTTOM: 50, LEFT: 80 }; // Margin where the axes, labels, and legend will be placed
        vis.WIDTH = vis.dimension.width - vis.MARGIN.LEFT - vis.MARGIN.RIGHT; // Width of the canvas
        vis.HEIGHT = vis.dimension.height - vis.MARGIN.TOP - vis.MARGIN.BOTTOM; // Height of the canvas

        vis.dataGrouped = d3.group(vis.data, d => d[vis.group]); // Group the data based on the grouping variable

        vis.earliestDate = new Date(Math.min(...vis.data.map(entry => entry.Date)));
        vis.latestDate = new Date(Math.max(...vis.data.map(entry => entry.Date)));

        // Calculate the dates for the "10y", "5y", and "3y" ranges based on the latest date
        vis.latestYear = vis.latestDate.getFullYear();
        vis.tenYearsAgo = new Date(vis.latestYear - 10, vis.latestDate.getMonth(), vis.latestDate.getDate());
        vis.fiveYearsAgo = new Date(vis.latestYear - 5, vis.latestDate.getMonth(), vis.latestDate.getDate());
        vis.threeYearsAgo = new Date(vis.latestYear - 3, vis.latestDate.getMonth(), vis.latestDate.getDate());

        // Determine the date for the "YTD" range
        vis.lastYearEnd = new Date(vis.latestYear - 1, 11, 31); // 11 represents December
        vis.ytdStart = new Date(vis.latestDate.getFullYear(), 0, 1); // 0 represents January
        vis.ytdStart.setDate(vis.ytdStart.getDate() - 1);

        vis.__All = [vis.earliestDate, vis.latestDate]
        vis.__10Y = [vis.tenYearsAgo, vis.latestDate]
        vis.__5Y = [vis.fiveYearsAgo, vis.latestDate]
        vis.__3Y = [vis.threeYearsAgo, vis.latestDate]
        vis.__YTD = [vis.ytdStart, vis.latestDate]

        vis.formatTime = d3.timeFormat("%d/%m/%Y")
        $("#date-slider1").slider({
            range: true,
            min: vis.earliestDate.getTime(),
            max: vis.latestDate.getTime(),
            step: 86400000, // one day
            values: [
                vis.earliestDate.getTime(),
                vis.latestDate.getTime()
            ],
            slide: (event, ui) => {
                let filterEvent = "slide";
                $("#dateLabel1").text(vis.formatTime(new Date(ui.values[0])))
                $("#dateLabel2").text(vis.formatTime(new Date(ui.values[1])))
                dateRange = $("#date-slider1").slider("values"); // Get the values of the date slider

                lineChart.manageData(dateRange, filterEvent)
            }
        })

        vis.svg = d3.select(vis.parentElement).append("svg") // Append an SVG element to the parent element
            .attr("viewBox", [0, 0, vis.WIDTH + vis.MARGIN.LEFT + vis.MARGIN.RIGHT, vis.HEIGHT + vis.MARGIN.TOP + vis.MARGIN.BOTTOM]) // Set the viewBox attribute
            .attr("width", vis.WIDTH + vis.MARGIN.LEFT + vis.MARGIN.RIGHT) // Set the width attribute
            .attr("height", vis.HEIGHT + vis.MARGIN.TOP + vis.MARGIN.BOTTOM) // Set the height attribute
            .attr("style", "max-width: 100%; height: auto; height: intrinsic; font: 10px sans-serif;") // Set the style attribute
            .style("-webkit-tap-highlight-color", "transparent") // Set the tap highlight color
            .style("overflow", "visible"); // Set the overflow style

        vis.canvas = vis.svg.append("g") // Append a group element to the SVG element
            .attr("class", "canvas") // Set the class attribute
            .attr("transform", `translate(${vis.MARGIN.LEFT}, ${vis.MARGIN.TOP})`); // Set the transform attribute

        vis.xLabel = vis.canvas.append("text") // Append a text element to the canvas
            .attr("class", "x-axisLabel") // Set the class attribute
            .attr("x", vis.WIDTH / 2) // Set the x attribute
            .attr("y", vis.HEIGHT + 60) // Set the y attribute
            .attr("text-anchor", "middle") // Set the text-anchor attribute
            .attr("font-size", "1rem") // Set the font-size attribute
            .text(vis.xlabel); // Set the text content

        vis.yLabel = vis.canvas.append("text") // Append a text element to the canvas
            .attr("class", "y-axisLabel") // Set the class attribute
            .attr("x", -vis.HEIGHT / 2) // Set the x attribute
            .attr("transform", "rotate(-90)") // Set the transform attribute
            .attr("text-anchor", "middle") // Set the text-anchor attribute
            .attr("y", -50) // Set the y attribute
            .attr("font-size", "1rem") // Set the font-size attribute
            .text(vis.ylabel); // Set the text content

        vis.x = d3.scaleUtc() // Create a time scale for the x-axis
            .range([0, vis.WIDTH]) // Set the range of the scale
            .domain(d3.extent(vis.data, d => d[vis.xdata])); // Set the domain of the scale based on the x-axis data

        vis.y = d3.scaleLinear() // Create a linear scale for the y-axis
            .range([vis.HEIGHT, 0]) // Set the range of the scale
            .domain([0, d3.max(vis.data, d => d[vis.ydata])]); // Set the domain of the scale based on the y-axis data

        vis.xAxisCall = d3.axisBottom(vis.x) // Create the x-axis
            .scale(vis.x); // Set the scale for the axis

        vis.formatter = (x) => {
            const formatAbbreviation = (x) => {
                if (x >= 1000000000) {
                    return (x / 1000000000).toFixed(1) + "B";
                } else if (x >= 1000000) {
                    return (x / 1000000).toFixed(1) + "M";
                } else if (x >= 1000) {
                    return (x / 1000).toFixed(1) + "K";
                }
                return x;
            };
            return formatAbbreviation(x);
        };

        vis.yAxisCall = d3.axisLeft(vis.y) // Create the y-axis
            .ticks(8) // Set the number of ticks
            .tickFormat(d => vis.formatter(d)) // Set the tick format
            .scale(vis.y); // Set the scale for the axis

        vis.xAxisGroup = vis.canvas.append("g") // Append a group element for the x-axis
            .attr("class", "x axis") // Set the class attribute
            .attr("transform", `translate(0, ${vis.HEIGHT})`) // Set the transform attribute
            .call(vis.xAxisCall); // Call the x-axis

        vis.yAxisGroup = vis.canvas.append("g") // Append a group element for the y-axis
            .attr("class", "y axis") // Set the class attribute
            .call(vis.yAxisCall); // Call the y-axis

        vis.line = d3.line() // Create a line generator
            .curve(d3.curveNatural) // Set the curve type
            .x(d => vis.x(d.Date)) // Set the x-coordinate of the line
            .y(d => vis.y(d.Close)); // Set the y-coordinate of the line

        vis.maxDotsPerColumn = vis.legend["noCol"]; // Maximum number of dots per column in the legend
        vis.columnWidth = vis.legend["widthCol"]; // Width of each column in the legend

        vis.legendOffsetY = -vis.maxDotsPerColumn * (vis.maxDotsPerColumn + 1) * 5; // Offset for the legend in the y-direction
        vis.fontWeight = "bold"; // Font weight for the legend text
        vis.dotRadius = 5; // Radius of the legend dots
        vis.dotSpacing = 20; // Spacing between legend dots
        vis.textOffsetX = 10; // Offset for the legend text in the x-direction

        const buttonFilterText = ["All", "10Y", "5Y", "3Y", "YTD"];

        const filterText = vis.canvas.selectAll(".filter-text")
            .data(buttonFilterText)
            .enter()
            .append("text")
            .attr("class", "filter-text")
            .attr("x", (d, i) => vis.WIDTH - 7 - (i * 30))
            .attr("y", vis.legendOffsetY)
            .text(d => d)
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")
            .style("font-weight", vis.fontWeight)
            .style("cursor", "pointer")
            .style("fill", "#cecece")
            .on("click", function () { // Add a click event listener
                // d3.select(this).style("fill", d3.select(this).style("fill") === "rgb(0, 0, 0)" ? "rgb(8, 57, 89)" : "rgb(0, 0, 0)");
                let filterEvent = "click";
                let selectedRange = "__" + d3.select(this).text();
                dateRange = vis[selectedRange];
                vis.manageData(dateRange, filterEvent);
            })
            .on("mouseover", function () { // Add mouseover event listener
                d3.select(this)
                    .style("fill", "#083959")
                    .style("text-decoration", "underline")
                    .style("text-decoration-color", "#083959");
            })
            .on("mouseout", function () { // Add mouseout event listener
                d3.select(this)
                    .style("fill", "#cecece") // Revert to default fill color
                    .style("text-decoration", null) // Revert to default text-decoration
                    .style("text-decoration-color", null); // Revert to default text-decoration-color
            });

        let dateRange = $("#date-slider1").slider("values"); // Get the values of the date slider

        vis.manageData(dateRange); // Manage the data for the chart
    }

    manageData(dateRange = [new Date("2009-12-31"), new Date("2024-03-07")], filterEvent) {
        const vis = this;
        // Filter the data based on the date range or the selected range
        vis.dataFiltered = vis.data.filter(d => {
            if (filterEvent === "click") {
                $("#dateLabel1").text(vis.formatTime(dateRange[0]))
                $("#dateLabel2").text(vis.formatTime(dateRange[1]))
                $("#date-slider1").slider("values", [dateRange[0], dateRange[1]]);
            }
            return ((d.Date >= dateRange[0]) && (d.Date <= dateRange[1]))
        })

        // Group the filtered data
        vis.dataGrouped = d3.group(vis.dataFiltered, d => d.Symbol); // Group the filtered data based on the symbol

        // Rebase the grouped data
        if (vis.rebase) {
            for (const [key, value] of vis.dataGrouped) { // Iterate over the grouped data
                const closingPrices = value; // Get the closing prices
                const adjustmentFactor = 100 / closingPrices[0].Close; // Calculate the adjustment factor
                const adjustedPrices = closingPrices.map(entry => ({ ...entry, Close: entry.Close * adjustmentFactor })); // Adjust the closing prices
                vis.dataGrouped.set(key, adjustedPrices); // Update the grouped data
            }

        }

        vis.updateVis(); // Update the chart
    }

    updateVis() {
        const vis = this;

        vis.t = d3.transition().duration(1000); // Transition duration

        vis.x.domain(d3.extent(vis.dataFiltered, d => d.Date)); // Update the x-domain based on the filtered data
        let yDomainMin = Infinity; // Initialize the minimum y-domain value
        let yDomainMax = -Infinity; // Initialize the maximum y-domain value
        vis.dataGrouped.forEach((value) => { // Iterate over the grouped data
            const closingPrices = value; // Get the closing prices
            const minValue = d3.min(closingPrices, d => d.Close); // Calculate the minimum value
            const maxValue = d3.max(closingPrices, d => d.Close); // Calculate the maximum value
            yDomainMin = Math.min(yDomainMin, minValue); // Update the minimum y-domain value
            yDomainMax = Math.max(yDomainMax, maxValue); // Update the maximum y-domain value
        });
        const buffer = Math.abs(yDomainMax - yDomainMin) * 0.05; // Calculate the buffer for the y-domain
        vis.y.domain([yDomainMin - buffer, yDomainMax + buffer]); // Update the y-domain

        vis.xAxisCall = d3.axisBottom(vis.x); // Create the x-axis
        vis.xAxisGroup.transition(vis.t).call(vis.xAxisCall) // Transition the x-axis
            .selectAll("text") // Select all text elements
            .attr("y", "10") // Set the y attribute
            .attr("x", "-5") // Set the x attribute
            .attr("text-anchor", "end") // Set the text-anchor attribute
            .attr("transform", "rotate(-40)"); // Set the rotation transform

        // vis.tickCount = Math.max(5, Math.ceil((vis.y.domain()[1] - vis.y.domain()[0]) / 150)); // Calculate the number of ticks for the y-axis
        vis.yAxisCall = d3.axisLeft(vis.y) // Create the y-axis
            .ticks(8) // Set the number of ticks
            .tickFormat(d => vis.formatter(d)) // Set the tick format
            .scale(vis.y); // Set the scale for the axis
        vis.yAxisGroup.transition(vis.t).call(vis.yAxisCall); // Transition the y-axis

        // Remove all existing lines
        vis.canvas.selectAll(".line").remove();
        vis.canvas.selectAll(".legend-circle").remove();
        vis.canvas.selectAll(".legend-text").remove();

        vis.line = d3.line() // Create a line generator
            .curve(d3.curveNatural) // Set the curve type
            .x(d => vis.x(d.Date)) // Set the x-coordinate of the line
            .y(d => vis.y(d.Close)); // Set the y-coordinate of the line

        vis.dataLabel = Array.from(vis.dataGrouped.keys()); // Get the unique labels from the grouped data
        vis.legendOffsetX = (vis.WIDTH - (vis.dataLabel.length * vis.columnWidth)) / 2; // Offset for the legend in the x-direction
        // vis.colors = new Map(vis.dataLabel.map((label, i) => [label, d3.schemeCategory10[i]])); // Create a map of colors for each label
        vis.colors = new Map(vis.dataLabel.map((label, i) => [label, ['#0e2238', '#d8e5f0'][i % 2]])); // Create a map of colors for each label

        let i = 0; // Counter variable
        for (const [thisDataLabel, thisData] of vis.dataGrouped) { // Iterate over the grouped data
            const linePath = vis.canvas.append("path") // Append a path element for the line
                .datum(thisData) // Set the data for the line
                .attr('d', vis.line) // Set the path data
                .attr('class', 'line') // Set the class attribute
                .style('stroke', vis.colors.get(thisDataLabel)) // Set the stroke color
                .style('stroke-width', 2) // Set the stroke width
                .style("cursor", "pointer") // Set the cursor style
                .style("fill", "none") // Set the fill style
                .on("click", function () { // Add a click event listener
                    vis.toggleOpacity(linePath); // Toggle the opacity of the line
                    vis.toggleOpacity(legendCircle); // Toggle the opacity of the legend circle
                    vis.toggleOpacity(legendText); // Toggle the opacity of the legend text
                });

            const column = Math.floor(i / vis.maxDotsPerColumn); // Calculate the column index
            const dotX = vis.legendOffsetX + column * vis.columnWidth; // Calculate the x-coordinate of the legend dot
            const dotY = vis.legendOffsetY + (i % vis.maxDotsPerColumn) * vis.dotSpacing; // Calculate the y-coordinate of the legend dot

            const legendCircle = vis.canvas.append("circle") // Append a circle element for the legend dot
                .attr("class", "legend-circle")
                .attr("cx", dotX) // Set the cx attribute
                .attr("cy", dotY) // Set the cy attribute
                .attr("r", vis.dotRadius) // Set the r attribute
                .style("fill", vis.colors.get(thisDataLabel)) // Set the fill color
                .style("cursor", "pointer") // Set the cursor style
                .on("click", function () { // Add a click event listener
                    vis.toggleOpacity(linePath); // Toggle the opacity of the line
                    vis.toggleOpacity(legendCircle); // Toggle the opacity of the legend circle
                    vis.toggleOpacity(legendText); // Toggle the opacity of the legend text
                });

            const legendText = vis.canvas.append("text") // Append a text element for the legend text
                .attr("class", "legend-text")
                .attr("x", dotX + vis.textOffsetX) // Set the x attribute
                .attr("y", dotY + 1) // Set the y attribute
                .text(thisDataLabel) // Set the text content
                .attr("text-anchor", "left") // Set the text-anchor attribute
                .style("alignment-baseline", "middle") // Set the alignment-baseline style
                .style("font-weight", vis.fontWeight) // Set the font-weight style
                .style("cursor", "pointer") // Set the cursor style
                .on("click", function () { // Add a click event listener
                    vis.toggleOpacity(linePath); // Toggle the opacity of the line
                    vis.toggleOpacity(legendCircle); // Toggle the opacity of the legend circle
                    vis.toggleOpacity(legendText); // Toggle the opacity of the legend text
                });

            i++; // Increment the counter
        }

        for (const [key, value] of vis.dataGrouped) {
            const linePath = vis.canvas.select(".line-" + key); // Select the line path
            linePath.datum(value) // Set the data for the line
                .attr('d', vis.line); // Set the path data
        }
    }
}
