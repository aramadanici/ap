class BarChart {

    // Constructor to initialize the object
    constructor(_parentElement) {
        this.parentElement = _parentElement;

        // Call the initVis method
        this.initVis();
    }

    initVis() {
        const vis = this;

        // Include all the static elements (i.e., non-changing elements) into this function
        vis.MARGIN = { TOP: 50, RIGHT: 100, BOTTOM: 75, LEFT: 100 }
        vis.WIDTH = 928 - vis.MARGIN.LEFT - vis.MARGIN.RIGHT
        vis.HEIGHT = 500 - vis.MARGIN.TOP - vis.MARGIN.BOTTOM

        vis.svg = d3.select(vis.parentElement).append("svg")
            .attr("width", vis.WIDTH + vis.MARGIN.LEFT + vis.MARGIN.RIGHT)
            .attr("height", vis.HEIGHT + vis.MARGIN.TOP + vis.MARGIN.BOTTOM)

        vis.g = vis.svg.append("g")
            .attr("transform", `translate(${vis.MARGIN.LEFT}, ${vis.MARGIN.TOP})`)

        // X and Y axis labels
        vis.xLabel = vis.g.append("text")
            .attr("class", "x axis-label")
            .attr("x", vis.WIDTH / 2)
            .attr("y", vis.HEIGHT + 60)
            .attr("font-size", "20px")
            .attr("text-anchor", "middle")
            .text("Month")
        vis.yLabel = vis.g.append("text")
            .attr("class", "y axis-label")
            .attr("x", - (vis.HEIGHT / 2))
            .attr("y", -60)
            .attr("font-size", "20px")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")

        // Scales    
        vis.x = d3.scaleBand()
            .range([0, vis.WIDTH])
            .paddingInner(0.3)
            .paddingOuter(0.2)
        vis.y = d3.scaleLinear()
            .range([vis.HEIGHT, 0])

        // Axis generators
        vis.xAxisCall = d3.axisBottom()
        vis.yAxisCall = d3.axisLeft()
            .ticks(5)
            .tickFormat(d => d / 100 + " m")

        // Axis groups
        vis.xAxisGroup = vis.g.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0, ${vis.HEIGHT})`)
        vis.yAxisGroup = vis.g.append("g")
            .attr("class", "y axis")

        vis.manageData()
    }

    manageData() {
        const vis = this

        vis.yValue = $("#metric-select").val()
        // filteredDataB = cleanData
        vis.updateVis() //! how do you pass the data to the updateVis method?
    }


    updateVis() {
        const vis = this
        const t = d3.transition().duration(980)

        vis.x.domain(filteredDataB.map(d => d.month))
        vis.y.domain([0, d3.max(filteredDataB, d => d[vis.yValue])])

        vis.xAxisCall = d3.axisBottom(vis.x)
        vis.xAxisGroup.transition(t).call(vis.xAxisCall)
            .selectAll("text")
            .attr("y", "10")
            .attr("x", "-5")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-40)")


        vis.yAxisCall = d3.axisLeft(vis.y)
            .tickFormat(d => d / 100 + " m")
        vis.yAxisGroup.transition(t).call(vis.yAxisCall)


        const rects = vis.g.selectAll("rect")
            .data(filteredDataB, d => d.month) // We use a function that returns the month as the key. This way, d3 can keep track of the data points even if the order changes.


        rects.exit()
            .attr("fill", "red")
            .transition(t)
            .attr("height", 0)
            .attr("y", vis.y(0))
            .remove()


        rects.enter().append("rect")
            .attr("fill", "#083959")
            .attr("y", vis.y(0))
            .attr("height", 0)

            .merge(rects) // All methods that are called before the merge call are applied only to the entering elements. All methods that are called after the merge call are applied to both the entering and updating elements.
            .transition(t)
            .attr("x", (filteredDataB) => vis.x(filteredDataB.month))
            .attr("width", vis.x.bandwidth)
            .attr("y", filteredDataB => vis.y(filteredDataB[vis.yValue]))
            .attr("height", filteredDataB => vis.HEIGHT - vis.y(filteredDataB[vis.yValue]))

        const text = vis.yValue
        const capitalizedText = text.charAt(0).toUpperCase() + text.slice(1);
        vis.yLabel.transition()
            .duration(500)
            .style("opacity", 0)
            .on("end", () => {
                vis.yLabel.text(capitalizedText)
                    .transition()
                    .duration(150)
                    .style("opacity", 1);
            });
    }
}