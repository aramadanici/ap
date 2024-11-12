class GroupedBarChart {
    constructor(_parentElement, _data, _xdata, _xlabel = "", _ydata, _ylabel = "", _cdata, _dimension = { width: 928, height: 500 }, _legend = { noCol: 1, widthCol: 65 }) {
        // Class constructor that takes in parameters for parent element, data, x-axis data, y-axis data, color data, and legend options
        this.parentElement = _parentElement;
        this.data = _data;
        this.xdata = _xdata;
        this.xlabel = _xlabel;
        this.ydata = _ydata;
        this.ylabel = _ylabel;
        this.cdata = _cdata;
        this.dimension = _dimension;
        this.legend = _legend;
        this.initVis(); // Call the initVis method to initialize the visualization
    }

    initVis() {
        const vis = this;
        vis.MARGIN = { TOP: 50, RIGHT: 5, BOTTOM: 50, LEFT: 80 }; // Define the margin object with top, right, bottom, and left values
        vis.WIDTH = vis.dimension.width - vis.MARGIN.LEFT - vis.MARGIN.RIGHT; // Calculate the width of the chart by subtracting the left and right margins from the total width
        vis.HEIGHT = vis.dimension.height - vis.MARGIN.TOP - vis.MARGIN.BOTTOM; // Calculate the height of the chart by subtracting the top and bottom margins from the total height

        vis.svg = d3.select(vis.parentElement).append("svg") // Select the parent element and append an SVG element
            .attr("viewBox", [0, 0, vis.WIDTH + vis.MARGIN.LEFT + vis.MARGIN.RIGHT, vis.HEIGHT + vis.MARGIN.TOP + vis.MARGIN.BOTTOM]) // Set the viewBox attribute to define the visible area of the SVG
            .attr("width", vis.WIDTH + vis.MARGIN.LEFT + vis.MARGIN.RIGHT) // Set the width of the SVG
            .attr("height", vis.HEIGHT + vis.MARGIN.TOP + vis.MARGIN.BOTTOM) // Set the height of the SVG
            .attr("style", "max-width: 100%; height: auto; height: intrinsic; font: 10px sans-serif;") // Set the style attributes of the SVG
            .style("-webkit-tap-highlight-color", "transparent") // Set the tap highlight color to transparent
            .style("overflow", "visible"); // Set the overflow property to visible

        vis.canvas = vis.svg.append("g") // Append a group element to the SVG
            .attr("class", "canvas") // Set the class attribute of the group element
            .attr("transform", `translate(${vis.MARGIN.LEFT}, ${vis.MARGIN.TOP})`); // Translate the group element to the appropriate position based on the margins

        vis.xLabel = vis.canvas.append("text") // Append a text element to the canvas group
            .attr("class", "x axis-label") // Set the class attribute of the text element
            .attr("x", vis.WIDTH / 2) // Set the x-coordinate of the text element
            .attr("y", vis.HEIGHT + 60) // Set the y-coordinate of the text element
            .attr("font-size", "1rem") // Set the font size of the text element
            .attr("text-anchor", "middle") // Set the text anchor property to middle
            .text(vis.xlabel); // Set the text content
        // The xLabel is used to display the label for the x-axis

        vis.yLabel = vis.canvas.append("text") // Append a text element to the canvas group
            .attr("class", "y axis-label") // Set the class attribute of the text element
            .attr("x", - (vis.HEIGHT / 2)) // Set the x-coordinate of the text element
            .attr("y", -60) // Set the y-coordinate of the text element
            .attr("font-size", "1rem") // Set the font size of the text element
            .attr("text-anchor", "middle") // Set the text anchor property to middle
            .attr("transform", "rotate(-90)") // Rotate the text element by -90 degrees
            .text(vis.ylabel); // Set the text content
        // The yLabel is used to display the label for the y-axis

        vis.fx = d3.scaleBand() // Create a scale for the x-axis
            .domain(vis.data.map(d => d[vis.xdata])) // Set the domain of the scale to the x-axis data
            .rangeRound([0, vis.WIDTH]) // Set the range of the scale to the width of the chart
            .paddingInner(0.1); // Set the inner padding of the scale

        vis.x = d3.scaleBand() // Create a scale for the x-axis within each group
            .rangeRound([0, vis.fx.bandwidth()]) // Set the range of the scale to the bandwidth of the x-axis scale
            .padding(0.05); // Set the padding of the scale

        vis.y = d3.scaleLinear() // Create a linear scale for the y-axis
            .rangeRound([vis.HEIGHT, 0]) // Set the range of the scale to the height of the chart
            .nice(); // Adjust the scale's domain to nice round values

        vis.fxAxisGroup = vis.canvas.append("g") // Append a group element to the canvas group for the x-axis
            .attr("class", "x axis"); // Set the class attribute of the group element

        vis.yAxisGroup = vis.canvas.append("g") // Append a group element to the canvas group for the y-axis
            .attr("class", "y axis") // Set the class attribute of the group element
            .call(d3.axisLeft(vis.y).ticks(null, "s")); // Call the axisLeft function to create the y-axis and set the tick format to "s"

        vis.maxDotsPerColumn = vis.legend["noCol"]; // Get the maximum number of dots per column from the legend options
        vis.columnWidth = vis.legend["widthCol"]; // Get the width of each column from the legend options

        vis.legendOffsetY = -vis.maxDotsPerColumn * (vis.maxDotsPerColumn + 1) * 5; // Calculate the y-offset for the legend dots
        vis.fontWeight = "bold"; // Set the font weight for the legend text
        vis.dotRadius = 5; // Set the radius of the legend dots
        vis.dotSpacing = 20; // Set the spacing between legend dots
        vis.textOffsetX = 10; // Set the x-offset for the legend text

        vis.manageData(); // Call the manageData method to manage the data for the visualization
    }

    manageData() {
        const vis = this;
        vis.updateVis(); // Call the updateVis method to update the visualization
    }

    updateVis() {
        const vis = this;
        const t = d3.transition().duration(750); // Create a transition object with a duration of 750 milliseconds

        vis.color = d3.scaleOrdinal() // Create an ordinal scale for the colors
            .range(['#0e2238', '#d8e5f0']); // Set the range of the scale to your custom color palette
        // .range(d3.schemeCategory10); // Set the range of the scale to the category10 color scheme

        vis.y.domain([Math.min(d3.min(vis.data, d => d[vis.ydata]), 0), d3.max(vis.data, d => d[vis.ydata])]); // Set the domain of the y-axis scale to the minimum and maximum values of the y-axis data
        vis.x.domain(vis.data.map(d => d[vis.cdata])); // Set the domain of the x-axis scale to the color data
        vis.fx.domain(vis.data.map(d => d[vis.xdata])); // Set the domain of the x-axis scale within each group to the x-axis data

        const rects = vis.canvas.selectAll("rect") // Select all existing rect elements in the canvas group
            .data(vis.data, d => d[vis.xdata] + d[vis.cdata]); // Bind the data to the rect elements using a key function

        rects.exit() // Select the exit selection (rect elements that are no longer needed)
            .transition(t) // Apply the transition
            .attr("height", 0) // Set the height of the rect elements to 0
            .attr("y", vis.y(0)) // Set the y-coordinate of the rect elements to the y-axis position of 0
            .remove(); // Remove the rect elements from the DOM

        vis.canvas.selectAll(".legend-circle").remove(); // Remove all existing legend circles from the canvas group
        vis.canvas.selectAll(".legend-text").remove(); // Remove all existing legend text elements from the canvas group

        vis.dataLabel = [...new Set(vis.data.map(item => item[vis.cdata]))]; // Get the unique values of the color data
        vis.legendOffsetX = (vis.WIDTH - (vis.dataLabel.length * vis.columnWidth)) / 2; // Calculate the x-offset for the legend elements

        let i = 0; // Initialize a counter variable
        for (const thisDataLabel of vis.dataLabel) { // Iterate over each unique color value
            const column = Math.floor(i / vis.maxDotsPerColumn); // Calculate the column index for the legend elements
            const dotX = vis.legendOffsetX + column * vis.columnWidth; // Calculate the x-coordinate for the legend dots
            const dotY = vis.legendOffsetY + (i % vis.maxDotsPerColumn) * vis.dotSpacing; // Calculate the y-coordinate for the legend dots

            const legendCircle = vis.canvas.append("circle") // Append a circle element to the canvas group for the legend dot
                .attr("class", "legend-circle") // Set the class attribute of the circle element
                .attr("cx", dotX) // Set the x-coordinate of the circle element
                .attr("cy", dotY) // Set the y-coordinate of the circle element
                .attr("r", vis.dotRadius) // Set the radius of the circle element
                .style('fill', vis.color(thisDataLabel)); // Set the fill color of the circle element based on the color value

            const legendText = vis.canvas.append("text") // Append a text element to the canvas group for the legend text
                .attr("class", "legend-text") // Set the class attribute of the text element
                .attr("x", dotX + vis.textOffsetX) // Set the x-coordinate of the text element
                .attr("y", dotY + 1) // Set the y-coordinate of the text element
                .text(thisDataLabel) // Set the text content of the text element to the color value
                .attr("text-anchor", "left") // Set the text anchor property to left
                .style("alignment-baseline", "middle") // Set the alignment baseline property to middle
                .style("font-weight", vis.fontWeight); // Set the font weight property of the text element

            i++; // Increment the counter variable
        }

        rects.enter().append("rect") // Append new rect elements for the enter selection
            .merge(rects) // Merge the enter and update selections
            .transition(t) // Apply the transition
            .attr("x", d => vis.fx(d[vis.xdata]) + vis.x(d[vis.cdata])) // Set the x-coordinate of the rect elements
            .attr("y", d => d[vis.ydata] >= 0 ? vis.y(d[vis.ydata]) : vis.y(0)) // Set the y-coordinate of the rect elements
            .attr("width", vis.x.bandwidth()) // Set the width of the rect elements
            .attr("height", d => Math.abs(vis.y(0) - vis.y(d[vis.ydata]))) // Set the height of the rect elements
            .attr("fill", d => vis.color(d[vis.cdata])); // Set the fill color of the rect elements based on the color value

        vis.yAxisCall = d3.axisLeft(vis.y); // Create the y-axis call
        vis.yAxisGroup.transition(t).call(vis.yAxisCall); // Apply the transition to the y-axis group and call the y-axis

        vis.fxAxisGroup.transition(t) // Apply the transition to the x-axis group
            .style("opacity", 0) // Set the opacity of the x-axis group to 0
            .remove(); // Remove the x-axis group from the DOM

        vis.fxAxisGroup = vis.canvas.append("g") // Append a new x-axis group to the canvas group
            .attr("class", "x axis") // Set the class attribute of the group element
            .style("opacity", 0); // Set the opacity of the group element to 0

        vis.fxAxisCall = d3.axisBottom(vis.fx); // Create the x-axis call
        vis.fxAxisGroup
            .attr("transform", `translate(0, ${vis.y(0)})`) // Translate the x-axis group to the y-axis position of 0
            .transition(t) // Apply the transition
            .style("opacity", 1) // Set the opacity of the x-axis group to 1
            .call(vis.fxAxisCall) // Call the x-axis
            .selectAll("text")
            .attr("y", "10") // Set the y-coordinate of the x-axis labels
            .attr("x", "-5") // Set the x-coordinate of the x-axis labels
            .attr("text-anchor", "end") // Set the text anchor property to end
            .attr("transform", "rotate(-40)"); // Rotate the x-axis labels by -40 degrees
    }
}
