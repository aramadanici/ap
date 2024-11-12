// Handles all the events and interactions for the visualization
let barChart
let barChart2
let lineChart
let horTable
let sankeyChart


// ----------------- Initialization -----------------


// Sankey Chart
d3.json(sankeyStocks).then(data => { // Fetches data from the specified JSON file
    let ticker = $('.form-select').val()
    sankeyChart = new SankeyChart(_parentElement = "#sankey-chart-area", _data = data[ticker], _dimension = { width: 900, height: 350 });
})

// Qualitative Table
axios.get(output1, {
    params: {
        ticker: $('.form-select').val() // Additional data like ticker
    }
}).then(response => {
    const data = response.data;
    horTable = new HorizontalTable(_tableid = "miau1", _data = data);
}).catch(error => {
    console.error('Error fetching data:', error);
});

// Qualitative Table
axios.get(output2, {
    params: {
        ticker: $('.form-select').val() // Additional data like ticker
    }
}).then(response => {
    const data = response.data;
    horTable = new HorizontalTable(_tableid = "miau2", _data = data);
}).catch(error => {
    console.error('Error fetching data:', error);
});


d3.dsv(";", techstockTS).then(data => { // Read the data from a CSV file
    const parseTime = d3.timeParse("%d.%m.%Y") // Create a time parser

    for (const row of data) { // Iterate over the data rows
        row.Close = Number(row.Close) // Convert the Close value to a number
        row.Date = parseTime(row.Date) // Parse the Date value
    }

    let formSelectValue = $('.form-select').val();
    let tickers = Array.isArray(formSelectValue) ? formSelectValue : [formSelectValue];
    tickers.push("NVDA");  // Adding "NVDA" to the tickers array
    let data0 = Object.values(data).filter(item => tickers.includes(item.Symbol));

    lineChart = new LineChart(_parentElement = "#performance-line-area", _data = data0, _xdata = "Date", _xlabel = "", _ydata = "Close", _ylabel = "", _group = "Symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 65 }, _rebase = true);

})

d3.json(groupedbar).then(data => {
    let formSelectValue = $('.form-select').val();
    let tickers = Array.isArray(formSelectValue) ? formSelectValue : [formSelectValue];
    tickers.push("NVDA");  // Adding "NVDA" to the tickers array

    const data0 = data.filter(d => tickers.includes(d.Stock));


    barChart = new GroupedBarChart(_parentElement = "#performance-bar-area", _data = data0, _xdata = "Year", _xlabel = "", _ydata = "Percentage", _ylabel = "Percentage", _cdata = "Stock", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 65 });
})


d3.json(groupedbar2).then(data => {
    let formSelectValue = $('.form-select').val();

    dataGrouped = d3.group(data, d => d['Stock']);
    data0 = dataGrouped.get(formSelectValue);

    barChart2 = new GroupedBarChart(_parentElement = "#multiple-bar-area", _data = data0, _xdata = "Multiple", _xlabel = "", _ydata = "Value", _ylabel = "", _cdata = "Year", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 65 });
})



// ----------------- Update -----------------


const updateSingleStockView = () => {
    // Description
    axios.get(output1, {
        params: {
            ticker: $('.form-select').val() // Additional data like ticker
        }
    }).then(response => {
        const data = response.data;
        horTable = new HorizontalTable(_tableid = "miau1", _data = data);
    }).catch(error => {
        console.error('Error fetching data:', error);
    });

    // Qualitative Table
    axios.get(output2, {
        params: {
            ticker: $('.form-select').val() // Additional data like ticker
        }
    }).then(response => {
        const data = response.data;
        horTable = new HorizontalTable(_tableid = "miau2", _data = data);
    }).catch(error => {
        console.error('Error fetching data:', error);
    });

    // Sankey Update
    d3.json(sankeyStocks).then(data => { // Fetches data from the specified JSON file
        let ticker = $('.form-select').val()
        sankeyChart.manageData(data[ticker])
    })

    // Line Chart Update
    d3.dsv(";", techstockTS).then(data => { // Read the data from a CSV file
        const parseTime = d3.timeParse("%d.%m.%Y") // Create a time parser
        // const formatTime = d3.timeFormat("%d/%m/%Y")

        for (const row of data) { // Iterate over the data rows
            row.Close = Number(row.Close) // Convert the Close value to a number
            row.Date = parseTime(row.Date) // Parse the Date value
        }

        let formSelectValue = $('.form-select').val();
        let tickers = Array.isArray(formSelectValue) ? formSelectValue : [formSelectValue];
        tickers.push("NVDA");  // Adding "NVDA" to the tickers array
        let data1 = Object.values(data).filter(item => tickers.includes(item.Symbol));

        lineChart.data = data1
        lineChart.manageData()
    })


    d3.json(groupedbar).then(data => {
        let formSelectValue = $('.form-select').val();
        let tickers = Array.isArray(formSelectValue) ? formSelectValue : [formSelectValue];
        tickers.push("NVDA");  // Adding "NVDA" to the tickers array

        const data1 = data.filter(d => tickers.includes(d.Stock));
        barChart.data = data1
        barChart.manageData()
    })


    d3.json(groupedbar2).then(data => {
        let formSelectValue = $('.form-select').val();

        dataGrouped = d3.group(data, d => d['Stock']);
        data1 = dataGrouped.get(formSelectValue);
        barChart2.data = data1
        barChart2.manageData()
    })


}

// Event listeners
$('.form-select').on("change", updateSingleStockView)

