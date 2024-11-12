// Handles all the events and interactions for the visualization
let barChart
let lineChart

// Event listeners
$("#metric-select").on("change", updateCharts)

d3.csv(csvUrl).then(data => {

    cleanData = data
    for (const d of cleanData) {
        d.revenue = Number(d.revenue)
        d.profit = Number(d.profit)
    }

    filteredDataB = cleanData
    barChart = new BarChart("#barchart-area");
})


// time parsers/formatters
// const parseTime = d3.timeParse("%d/%m/%Y")
// add jQuery UI slider
// $("#date-slider2").slider({
//     range: true,
//     min: parseTime("13/5/2013").getTime(),
//     max: parseTime("11/05/2018").getTime(),
//     step: 86400000, // one day
//     values: [
//         parseTime("13/5/2013").getTime(),
//         parseTime("11/05/2018").getTime()
//     ],
//     slide: (event, ui) => {
//         $("#dateLabel3").text(formatTime(new Date(ui.values[0])))
//         $("#dateLabel4").text(formatTime(new Date(ui.values[1])))
//         lineChart.manageData()
//     }
// })


d3.dsv(";", indices).then(data => { // Read the data from a CSV file
    const parseTime = d3.timeParse("%d.%m.%Y") // Create a time parser
    // const formatTime = d3.timeFormat("%d/%m/%Y")

    for (const row of data) { // Iterate over the data rows
        row.Close = Number(row.Close) // Convert the Close value to a number
        row.Date = parseTime(row.Date) // Parse the Date value
    }

    lineChart = new LineChart(_parentElement = "#chart-area3", _data = data, _xdata = "Date", _xlabel = "", _ydata = "Close", _ylabel = "USD", _group = "Symbol", _dimension = { width: 928, height: 500 }, _legend = { noCol: 1, widthCol: 65 }, _rebase = true);

})

function updateCharts() {
    barChart.manageData()
}

function updateCharts2() {
    lineChart.manageData()
}





