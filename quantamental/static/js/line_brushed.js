
function createChart() {
    // Declare the chart dimensions and margins.

    const MARGIN = { TOP: 50, RIGHT: 100, BOTTOM: 50, LEFT: 100 }
    const WIDTH = 928 - MARGIN.LEFT - MARGIN.RIGHT
    const HEIGHT = 500 - MARGIN.TOP - MARGIN.BOTTOM

    // Select the SVG container.
    const svg = d3.select("#chart-area1").append("svg")
        .attr("viewBox", [0, 0, WIDTH + MARGIN.LEFT + MARGIN.RIGHT, HEIGHT + MARGIN.TOP + MARGIN.BOTTOM])
        .attr("width", WIDTH + MARGIN.LEFT + MARGIN.RIGHT)
        .attr("height", HEIGHT + MARGIN.TOP + MARGIN.BOTTOM)
        .attr("style", "max-width: 100%; height: auto; height: intrinsic; font: 10px sans-serif;")
        .style("-webkit-tap-highlight-color", "transparent")
        .style("overflow", "visible")
    // .attr("style", "border: 3px solid pink") // Add a border to the chart

    const canvas = svg.append("g") // Add the g to the svg – this is the canvas where the chart will be drawn
        .attr("class", "canvas") // Add a class to the canvas
        .attr("transform", `translate(${MARGIN.LEFT}, ${MARGIN.TOP})`)  // Translate the canvas to the right and down to make room for the axes

    // time parsers/formatters
    const parseTime = d3.timeParse("%d/%m/%Y")
    const formatTime = d3.timeFormat("%d/%m/%Y")

    // Add a line path but data will be added in the update function therefore not visible
    canvas.append("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", "3px")

    // Add X-Label
    const xLabel = canvas.append("text")
        .attr("class", "x axisLabel") // Add a class to the text element
        .attr("y", HEIGHT + 50) // Place the text element 50 pixels below the canvas
        .attr("text-anchor", "middle") // Set the anchor at the middle of the text
        .attr("x", WIDTH / 2) // Center the text element in the middle of the canvas
        .attr("font-size", "20px") // Set the font size
        .text("Time") // Set the text

    // Add Y-Label
    const yLabel = canvas.append("text")
        .attr("class", "y axisLabel") // Add a class to the text element
        .attr("transform", "rotate(-90)") // Rotate the text element
        .attr("text-anchor", "middle") // et the anchor at the middle of the text
        .attr("y", -60) // Place the text element 60 pixels to the left of the canvas
        .attr("x", -HEIGHT / 2) // Center the text element in the middle of the canvas
        .attr("font-size", "20px") // Set the font size
        .text("Price (USD)") // Set the text element

    // scales
    const x = d3.scaleUtc().range([0, WIDTH])  // Declare the x (horizontal position) scale.
    const y = d3.scaleLinear().range([HEIGHT, 0])

    // Axis generators
    const xAxisCall = d3.axisBottom() // To update the x-axis, we need to create a new x-axis generator
    const yAxisCall = d3.axisLeft() // To update the y-axis, we need to create a new y-axis generator
        .ticks(6)
        .tickFormat(d => `${parseInt(d / 1000)}k`)

    // We create groups for the x and y axes that are attached to the canvas to update them later
    const xAxis = canvas.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0, ${HEIGHT})`) // Translate the group element to the bottom of the chart

    const yAxis = canvas.append("g")
        .attr("class", "y axis")

    // Event listeners
    $("#coin-select").on("change", update) // Add an event listener to the coin-select element that calls the update function
    $("#var-select").on("change", update) // Add an event listener to the var-select element that calls the update function

    // add jQuery UI slider
    $("#date-slider").slider({
        range: true,
        max: parseTime("31/10/2017").getTime(),
        min: parseTime("12/5/2013").getTime(),
        step: 86400000, // one day
        values: [
            parseTime("12/5/2013").getTime(),
            parseTime("31/10/2017").getTime()
        ],
        slide: (event, ui) => {
            $("#dateLabel1").text(formatTime(new Date(ui.values[0])))
            $("#dateLabel2").text(formatTime(new Date(ui.values[1])))
            update()
        }
    })

    d3.json(jsonUrl2).then(data => {
        filteredData = {}
        for (const coin of Object.keys(data)) {
            filteredData[coin] = data[coin]
                .filter(d => {
                    return !(d["price_usd"] == null)
                }).map(d => {
                    d["price_usd"] = Number(d["price_usd"])
                    d["24h_vol"] = Number(d["24h_vol"])
                    d["market_cap"] = Number(d["market_cap"])
                    d["date"] = parseTime(d["date"])
                    return d
                })
        }

        update()

    })

    function update() {
        const t = d3.transition().duration(1000)

        // Filter data based on selections
        const coin = $("#coin-select").val() // Get the value of the coin-select element
        const yValue = $("#var-select").val() // Get the value of the var-select element
        const sliderValues = $("#date-slider").slider("values") // Get the values of the date-slider element
        const dataTimeFiltered = filteredData[coin].filter(d => {
            return ((d.date >= sliderValues[0]) && (d.date <= sliderValues[1]))
        }) // Filter the data based on the coin, yValue, and sliderValues

        // We add the domain to the scales that corresponds to the filtered data
        x.domain(d3.extent(dataTimeFiltered, d => d.date)) // Extent returns the minimum and maximum value in the array. d is here the dataTimeFiltered.
        y.domain([
            d3.min(dataTimeFiltered, d => d[yValue]) / 1.005,
            d3.max(dataTimeFiltered, d => d[yValue]) * 1.005
        ]) // Set the y-axis domain to a bit more than the maximum and a bit less than the minimum value of the dataTimeFiltered

        // Format values
        const formatSi = d3.format(".2s")
        function formatAbbreviation(x) {
            const s = formatSi(x)
            switch (s[s.length - 1]) {
                case "G": return s.slice(0, -1) + "B" // billions
                case "k": return s.slice(0, -1) + "K" // thousands
            }
            return s
        }

        // update axes
        xAxisCall.scale(x) // Update the x-axis with the new x-scale
        xAxis.transition(t).call(xAxisCall) // Transition and call the x-axis
        yAxisCall.scale(y) // Update the y-axis with the new y-scale
        yAxis.transition(t).call(yAxisCall.tickFormat(formatAbbreviation)) // Transition and call the  y-axis with the new format

        // Path generator
        line = d3.line()
            .x(d => x(d.date))
            .y(d => y(d[yValue]))

        // Update our line path
        canvas.select(".line")
            .transition(t)
            .attr("d", line(dataTimeFiltered))

        // Update y-axis label
        const newText = (yValue === "price_usd") ? "Price (USD)"
            : (yValue === "market_cap") ? "Market Capitalization (USD)"
                : "24 Hour Trading Volume (USD)"
        yLabel.text(newText)


    }

}
createChart();
