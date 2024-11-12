class SankeyChart {
    constructor(_parentElement, _data, _dimension = { width: 928, height: 500 }) {
        this.parentElement = _parentElement;
        this.data = _data;
        this.dimension = _dimension;
        this.initVis();
    }

    initVis() {
        const vis = this;

        vis.WIDTH = vis.dimension.width; // Width of the canvas
        vis.HEIGHT = vis.dimension.height; // Height of the canvas

        vis.format = d3.format(",.0f");

        vis.svg = d3.select(vis.parentElement).append("svg")
            .attr("width", vis.WIDTH)
            .attr("height", vis.HEIGHT)
            .attr("viewBox", [0, 0, vis.WIDTH, vis.HEIGHT])
            .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

        vis.sankey = d3.sankey()
            .nodeId(d => d.name)
            .nodeAlign(d3.sankeyCenter)
            .nodeWidth(15)
            .nodePadding(10)
            .extent([[1, 5], [vis.WIDTH - 1, vis.HEIGHT - 5]]);

        const categoryColors = {
            "Cost": "#D22B2B",
            "Benefit": "#24618e",
            "Product": "#083959"
        };

        vis.color = d3.scaleOrdinal()
            .domain(Object.keys(categoryColors))
            .range(Object.values(categoryColors));

        vis.manageData(); // Manage the data for the chart
    }

    manageData(data = this.data) {
        // No data management needed for this visualization
        const vis = this;
        vis.data = data;

        vis.updateVis(); // Update the chart
    }






    updateVis() {
        // No updating needed for this visualization
        const vis = this;

        const { nodes, links } = vis.sankey({
            nodes: this.data.nodes.map(d => Object.assign({}, d)),
            links: this.data.links.map(d => Object.assign({}, d))
        });

        // Clear previous elements with transition
        vis.svg.selectAll("*").remove();

        vis.rect = vis.svg.append("g")
            .attr("stroke", "#000")
            .selectAll()
            .data(nodes)
            .join("rect")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("height", d => d.y1 - d.y0)
            .attr("width", d => d.x1 - d.x0)
            .attr("fill", d => vis.color(d.category))
            .append("title")
            .text(d => `${d.name}\n${vis.format(d.value)} M USD`);


        vis.link = vis.svg.append("g")
            .attr("fill", "none")
            .attr("stroke-opacity", 0.5)
            .selectAll()
            .data(links)
            .join("g")
            .style("mix-blend-mode", "multiply");

        vis.gradient = vis.link.append("linearGradient")
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("id", (d, i) => `gradient-${i}`)
            .attr("x1", d => d.source.x1)
            .attr("y1", d => (d.source.y0 + d.source.y1) / 2)
            .attr("x2", d => d.target.x0)
            .attr("y2", d => (d.target.y0 + d.target.y1) / 2);

        vis.gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", d => vis.color(d.source.category));

        vis.gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", d => vis.color(d.target.category));

        vis.link.append("path")
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("stroke", (d, i) => `url(#gradient-${i})`)
            .attr("stroke-width", d => Math.max(1, d.width))
            .append("title")
            .text(d => `${d.source.name} → ${d.target.name}\n${vis.format(d.value)} M USD`)

        vis.svg.append("g")
            .selectAll()
            .data(nodes)
            .join("text")
            .attr("x", d => d.x0 < vis.WIDTH / 2 ? d.x1 + 6 : d.x0 - 6)
            .attr("y", d => (d.y1 + d.y0) / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", d => d.x0 < vis.WIDTH / 2 ? "start" : "end")
            .text(d => d.name)
    }






}
