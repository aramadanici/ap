/*
*    main.js
*    Mastering Data Visualization with D3.js
*    5.7 - D3 Transitions
*/

const MARGIN = { LEFT: 100, RIGHT: 10, TOP: 10, BOTTOM: 100 }
const WIDTH = 600 - MARGIN.LEFT - MARGIN.RIGHT
const HEIGHT = 400 - MARGIN.TOP - MARGIN.BOTTOM

let flag = true

const svg = d3.select("#chart-area").append("svg")
    .attr("width", WIDTH + MARGIN.LEFT + MARGIN.RIGHT)
    .attr("height", HEIGHT + MARGIN.TOP + MARGIN.BOTTOM)

const g = svg.append("g")
    .attr("transform", `translate(${MARGIN.LEFT}, ${MARGIN.TOP})`)

g.append("text")
    .attr("class", "x axis-label")
    .attr("x", WIDTH / 2)
    .attr("y", HEIGHT + 60)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .text("Month")

const yLabel = g.append("text")
    .attr("class", "y axis-label")
    .attr("x", - (HEIGHT / 2))
    .attr("y", -60)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")

const x = d3.scaleBand()
    .range([0, WIDTH])
    .paddingInner(0.3)
    .paddingOuter(0.2)

const y = d3.scaleLinear()
    .range([HEIGHT, 0])

const xAxisGroup = g.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0, ${HEIGHT})`)

const yAxisGroup = g.append("g")
    .attr("class", "y axis")

d3.csv(csvUrl).then(data => {
    data.forEach(d => {
        d.revenue = Number(d.revenue)
        d.profit = Number(d.profit)
    })

    d3.interval(() => {
        flag = !flag
        const newData = flag ? data : data.slice(1)
        update(newData)
    }, 1000)

    update(data)
})

function update(data) {
    const value = flag ? "profit" : "revenue"
    const t = d3.transition().duration(980)

    x.domain(data.map(d => d.month))
    y.domain([0, d3.max(data, d => d[value])])

    const xAxisCall = d3.axisBottom(x)
    xAxisGroup.transition(t).call(xAxisCall)
        .selectAll("text")
        .attr("y", "10")
        .attr("x", "-5")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-40)")

    const yAxisCall = d3.axisLeft(y)
        .ticks(5)
        .tickFormat(d => d / 100 + " m")
    yAxisGroup.transition(t).call(yAxisCall)


    const circles = g.selectAll("circle")
        .data(data, d => d.month) // We use a function that returns the month as the key. This way, d3 can keep track of the data points even if the order changes.

    // EXIT
    circles.exit()
        .attr("fill", "red")
        .transition(t)
        .attr("opacity", 0)
        .attr("cy", y(0))
        .remove()

    // ENTER
    rc = Math.floor(Math.random() * 16777215).toString(16);
    circles.enter().append("circle")
        .attr("fill", "#" + rc)
        .attr("opacity", 0)
        .attr("cy", y(0))
        .attr("r", 5)
        // UPDATE
        .merge(circles) // All methods that are called before the merge call are applied only to the entering elements. All methods that are called after the merge call are applied to both the entering and updating elements.
        .transition(t)
        .attr("fill", "#" + rc)
        .attr("opacity", 1)
        .attr("cy", d => y(d[value]))
        .attr("cx", (d) => x(d.month) + (x.bandwidth() / 2)) // We add half of the bandwidth to center the circles because the rectangles where positioned at the start of the band.

    const text = flag ? "Profit (USD)" : "Revenue (USD)"
    yLabel.transition()
        .duration(500)
        .style("opacity", 0)
        .on("end", () => {
            yLabel.text(text)
                .transition()
                .duration(150)
                .style("opacity", 1);
        });
}
