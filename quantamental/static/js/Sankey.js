
d3.json(sankeyData).then(data => { // Fetches data from the specified JSON file
    const width = 928; // Sets the width of the SVG container
    const height = 400; // Sets the height of the SVG container
    const format = d3.format(",.0f"); // Defines a number formatting function

    const svg = d3.select("#sankey-chart-area").append("svg") // Selects the element with id "sankey-chart-area" and appends an SVG element to it
        .attr("width", width) // Sets the width attribute of the SVG element
        .attr("height", height) // Sets the height attribute of the SVG element
        .attr("viewBox", [0, 0, width, height]) // Sets the viewBox attribute of the SVG element
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;"); // Sets the style attribute of the SVG element

    const sankey = d3.sankey() // Creates a new Sankey layout generator
        .nodeId(d => d.name) // Sets the function used to determine the unique identifier for each node
        .nodeAlign(d3["sankeyCenter"]) // Sets the alignment of the nodes within each column
        .nodeWidth(15) // Sets the width of the nodes
        .nodePadding(10) // Sets the vertical padding between nodes
        .extent([[1, 5], [width - 1, height - 5]]); // Sets the extent of the Sankey diagram

    const { nodes, links } = sankey({ // Generates the nodes and links for the Sankey diagram
        nodes: data.nodes.map(d => Object.assign({}, d)), // Creates a copy of each node object
        links: data.links.map(d => Object.assign({}, d)) // Creates a copy of each link object
    });

    const categoryColors = { // Defines the colors for different categories
        "Cost": "red",
        "Benefit": "green",
        "Product": "#083959"
    };

    const color = d3.scaleOrdinal() // Creates an ordinal scale for assigning colors to categories
        .domain(Object.keys(categoryColors)) // Sets the domain of the scale to the category names
        .range(Object.values(categoryColors)); // Sets the range of the scale to the category colors

    const rect = svg.append("g") // Appends a group element to the SVG for the nodes
        .attr("stroke", "#000") // Sets the stroke color for the nodes
        .selectAll()
        .data(nodes)
        .join("rect") // Appends a rectangle for each node
        .attr("x", d => d.x0) // Sets the x-coordinate of the rectangle
        .attr("y", d => d.y0) // Sets the y-coordinate of the rectangle
        .attr("height", d => d.y1 - d.y0) // Sets the height of the rectangle
        .attr("width", d => d.x1 - d.x0) // Sets the width of the rectangle
        .attr("fill", d => color(d.category)); // Sets the fill color of the rectangle based on the category

    rect.append("title") // Appends a title element to each rectangle
        .text(d => `${d.name}\n${format(d.value)} M USD`); // Sets the text content of the title element

    const link = svg.append("g") // Appends a group element to the SVG for the links
        .attr("fill", "none") // Sets the fill color for the links
        .attr("stroke-opacity", 0.5) // Sets the opacity of the links
        .selectAll()
        .data(links)
        .join("g") // Appends a group element for each link
        .style("mix-blend-mode", "multiply"); // Sets the blend mode for the links

    const gradient = link.append("linearGradient") // Appends a linear gradient element to each link
        .attr("gradientUnits", "userSpaceOnUse") // Sets the gradient units
        .attr("id", (d, i) => `gradient-${i}`) // Sets the id of the gradient
        .attr("x1", d => d.source.x1) // Sets the x-coordinate of the start point of the gradient
        .attr("y1", d => (d.source.y0 + d.source.y1) / 2) // Sets the y-coordinate of the start point of the gradient
        .attr("x2", d => d.target.x0) // Sets the x-coordinate of the end point of the gradient
        .attr("y2", d => (d.target.y0 + d.target.y1) / 2); // Sets the y-coordinate of the end point of the gradient

    gradient.append("stop") // Appends a stop element to the gradient for the start color
        .attr("offset", "0%") // Sets the offset of the stop
        .attr("stop-color", d => color(d.source.category)); // Sets the color of the stop based on the source category

    gradient.append("stop") // Appends a stop element to the gradient for the end color
        .attr("offset", "100%") // Sets the offset of the stop
        .attr("stop-color", d => color(d.target.category)); // Sets the color of the stop based on the target category

    link.append("path") // Appends a path element to each link
        .attr("d", d3.sankeyLinkHorizontal()) // Sets the path data for the link
        .attr("stroke", (d, i) => `url(#gradient-${i})`) // Sets the stroke color for the link using the gradient
        .attr("stroke-width", d => Math.max(1, d.width)); // Sets the stroke width for the link

    link.append("title") // Appends a title element to each link
        .text(d => `${d.source.name} → ${d.target.name}\n${format(d.value)} M USD`); // Sets the text content of the title element

    svg.append("g") // Appends a group element to the SVG for the node labels
        .selectAll()
        .data(nodes)
        .join("text") // Appends a text element for each node
        .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6) // Sets the x-coordinate of the text
        .attr("y", d => (d.y1 + d.y0) / 2) // Sets the y-coordinate of the text
        .attr("dy", "0.35em") // Sets the vertical alignment of the text
        .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end") // Sets the horizontal alignment of the text
        .text(d => d.name); // Sets the text content of the text element
});
