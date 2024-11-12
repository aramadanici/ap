

const maxPoint = 100

const data = {
    Size: 63.27052068754917,
    Safety: 11.90564660769214,
    Growth: 92.3821474257371,
    Momentum: 75.81961738766091,
    Valuation: 41.20184614828303,
    Quality: 61.137214948079475
};

const features = Object.keys(data);

const width = 500, height = 500;

const svg = d3.select("#spider-area").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    // .attr("transform", `rotate(-90)`)
    .attr("font-family", "sans-serif")

let radialScale = d3.scaleLinear()
    .domain([0, maxPoint])
    .range([0, (width - 100) / 2]);

let ticks = [25, 50, 75, 100];

ticks.forEach(t =>
    svg.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("fill", "none")
        .attr("stroke", "#e8e8e8")
        .attr("stroke-width", "2")
        .attr("r", radialScale(t))
);

ticks.forEach(t =>
    svg.append("text")
        .attr("x", -15)
        .attr("y", - radialScale(t) - 5)
        .attr("fill", "#bbbbbb")
        .attr("font-size", "10px")
        .text(t.toString())
);

function angleToCoordinate(angle, value) {
    let x = Math.cos(angle) * radialScale(value);
    let y = Math.sin(angle) * radialScale(value);
    return { "x": x, "y": y };
}

for (var i = 0; i < features.length; i++) {
    let angle = (Math.PI / 2) + (2 * Math.PI * i / features.length);
    let line_coordinate = angleToCoordinate(angle, 100);
    let label_coordinate = angleToCoordinate(angle, 120);

    //draw axis label
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "central")
        .attr("x", label_coordinate.x)
        .attr("y", label_coordinate.y)
        .attr("font-size", "11px")
        .attr("fill", "#083959")
        .text(features[i]);

    //draw axis line
    svg.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", line_coordinate.x)
        .attr("y2", line_coordinate.y)
        .attr("stroke", "#e8e8e8")
        .attr("stroke-width", "2");
}

function getPathCoordinates(data_point) {
    let coordinates = [];
    for (var i = 0; i < features.length; i++) {
        let ft_name = features[i];
        let angle = (Math.PI / 2) + (2 * Math.PI * i / features.length);
        coordinates.push(angleToCoordinate(angle, data_point[ft_name]));
    }
    return coordinates;
}

const coords = getPathCoordinates(data);

coords.forEach(d => {
    svg.append("circle")
        .attr("r", 4)
        .attr("fill", "#083959")
        .attr("cx", d.x)
        .attr("cy", d.y);
});

//make defs and add the linear gradient
var lg = svg.append("defs").append("linearGradient")
    .attr("id", "mygrad")//id of the gradient
    .attr("x1", "0%")
    .attr("x2", "0%")
    .attr("y1", "0%")
    .attr("y2", "100%");

lg.append("stop")
    .attr("offset", "0%")
    .style("stop-color", "#083959")
    .style("stop-opacity", 0);

lg.append("stop")
    .attr("offset", "100%")
    .style("stop-color", "#083959")
    .style("stop-opacity", 0.5);

svg.append("path")
    .datum([...coords])
    .attr("d", d3.line()
        .curve(d3.curveCatmullRomClosed)
        .x(d => d.x)
        .y(d => d.y)
    )
    .attr("stroke-width", 4)
    .attr("stroke", "#083959")
    .attr("fill", "url(#mygrad)")
    .attr("stroke-opacity", 1)
    .attr("opacity", 0.5);