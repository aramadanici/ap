class HorizontalBarChart {
    constructor(_parentElement, _data, _xdata, _xlabel = "", _ydata, _ylabel = "", _cdata = null, _dimension = { width: 928, height: 500 }, _legend = { noCol: 1, widthCol: 65 }) {
        this.parentElement = _parentElement;
        this.data = _data.sort((a, b) => b[_xdata] - a[_xdata])
        this.xdata = _xdata;
        this.xlabel = _xlabel;
        this.ydata = _ydata;
        this.ylabel = _ylabel;
        this.cdata = _cdata;
        this.dimension = _dimension;
        this.legend = _legend;
        this.initVis();
    }

    initVis() {
        const vis = this;
        vis.MARGIN = { TOP: 50, RIGHT: 5, BOTTOM: 50, LEFT: 80 };
        vis.WIDTH = vis.dimension.width - vis.MARGIN.LEFT - vis.MARGIN.RIGHT;
        vis.HEIGHT = vis.dimension.height - vis.MARGIN.TOP - vis.MARGIN.BOTTOM;

        vis.svg = d3.select(vis.parentElement).append("svg")
            .attr("viewBox", [0, 0, vis.WIDTH + vis.MARGIN.LEFT + vis.MARGIN.RIGHT, vis.HEIGHT + vis.MARGIN.TOP + vis.MARGIN.BOTTOM])
            .attr("width", vis.WIDTH + vis.MARGIN.LEFT + vis.MARGIN.RIGHT)
            .attr("height", vis.HEIGHT + vis.MARGIN.TOP + vis.MARGIN.BOTTOM)
            .attr("style", "max-width: 100%; height: auto; height: intrinsic; font: 10px sans-serif;")
            .style("-webkit-tap-highlight-color", "transparent")
            .style("overflow", "visible");

        vis.canvas = vis.svg.append("g")
            .attr("class", "canvas")
            .attr("transform", `translate(${vis.MARGIN.LEFT}, ${vis.MARGIN.TOP})`);

        vis.xLabel = vis.canvas.append("text")
            .attr("class", "x axis-label")
            .attr("x", vis.WIDTH / 2)
            .attr("y", vis.HEIGHT + 40)
            .attr("font-size", "1rem")
            .attr("text-anchor", "middle")
            .text(vis.xlabel);

        vis.yLabel = vis.canvas.append("text")
            .attr("class", "y axis-label")
            .attr("x", - (vis.HEIGHT / 2))
            .attr("y", -60)
            .attr("font-size", "1rem")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .text(vis.ylabel);

        vis.y = d3.scaleBand()
            .domain(vis.data.map(d => d[vis.ydata]))
            .rangeRound([0, vis.HEIGHT])
            .paddingInner(0.1);

        vis.x = d3.scaleLinear()
            .rangeRound([0, vis.WIDTH])
            .nice();

        vis.y1 = d3.scaleBand()
            .rangeRound([0, vis.y.bandwidth()])
            .padding(0.05);

        vis.xAxisGroup = vis.canvas.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0, ${vis.HEIGHT})`);

        vis.yAxisGroup = vis.canvas.append("g")
            .attr("class", "y axis");

        vis.manageData();
    }

    manageData() {
        const vis = this;
        vis.updateVis();
    }

    updateVis() {
        const vis = this;
        const t = d3.transition().duration(750);

        vis.data = vis.data.sort((a, b) => b[vis.xdata] - a[vis.xdata]);

        vis.color = d3.scaleOrdinal()
            .range(['#4472CA', '#77933C', '#C0504D', '#ED7D31', '#81a3e6', '#aac474']); // Alp

        vis.x.domain([0, d3.max(vis.data, d => d[vis.xdata])]);
        vis.y1.domain(vis.data.map(d => d[vis.cdata]));
        vis.y.domain(vis.data.map(d => d[vis.ydata]));

        const uniqueYData = [...new Set(vis.data.map(d => d[vis.ydata]))];
        const barHeight = (vis.HEIGHT / uniqueYData.length) * 0.8; // Reduce the height of the bars

        const bars = vis.canvas.selectAll("rect")
            .data(vis.data, d => d[vis.ydata] + d[vis.cdata]);

        bars.exit()
            .transition(t)
            .attr("width", 0)
            .attr("x", vis.x(0))
            .remove();

        bars.enter().append("rect")
            .merge(bars)
            .transition(t)
            .attr("y", d => vis.y(d[vis.ydata]) + (vis.y.bandwidth() - barHeight) / 2) // Center the bars
            .attr("x", vis.x(0))
            .attr("height", barHeight)
            .attr("width", d => vis.x(d[vis.xdata]))
            .attr("fill", d => vis.color(d[vis.cdata]));

        const labels = vis.canvas.selectAll(".label")
            .data(vis.data, d => d[vis.ydata] + d[vis.cdata]);

        labels.exit().remove();

        labels.enter().append("text")
            .attr("class", "label")
            .merge(labels)
            .transition(t)
            .attr("x", d => vis.x(d[vis.xdata]) + 5)
            .attr("y", d => vis.y(d[vis.ydata]) + vis.y.bandwidth() / 2)
            .attr("dy", ".35em")
            .attr("text-anchor", "start")
            .attr("fill", "#d6d6d6")
            .text(d => Math.round(d[vis.xdata]) + "%");

        vis.xAxisCall = d3.axisBottom(vis.x);
        vis.xAxisGroup.transition(t).call(vis.xAxisCall);

        vis.yAxisCall = d3.axisLeft(vis.y);
        vis.yAxisGroup.transition(t).call(vis.yAxisCall);
    }
}
