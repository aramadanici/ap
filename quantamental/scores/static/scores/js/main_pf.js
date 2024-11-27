// Handles all the events and interactions for the visualization
let lineChart1
let lineChart2
let lineChart3
let lineChart4
let lineChart5
let lineChart6
let lineChart7
let horTable1
const inputs = document.querySelectorAll('input[id^="weight"]');

// ! ----------------- Get Default Weights -----------------
let weights = [];
inputs.forEach(input => { // Iterate over each input element
    const weight = parseFloat(input.value) || 0;
    if (weight > 0) { // Only add non-zero weights
        weights.push(weight); // Add the weight to the weights array
    }
});

// ! ----------------- Get Default Assets -----------------
let investedAssets = []; // Declare investedAssets variable globally
investedAssets = Array.from(inputs)
    .filter(input => parseFloat(input.value) > 0)
    .map(input => input.id.replace('weight_', '')); // Remove "weight_" from the input id


//!  ----------------- Calculate and Display Total Weight from Input Fields and Prepare Data for POST Request -----------------
document.addEventListener('DOMContentLoaded', function () { // Wait for the DOM to be fully loaded
    const inputs = document.querySelectorAll('input[id^="weight"]'); // Select all input elements with id starting with "weightAsset"
    const totalSpan = document.getElementById('update-weight'); // Select the element with id "update-weight"

    inputs.forEach(input => { // Iterate over each input element
        input.addEventListener('input', updateTotal); // Add an event listener to call updateTotal on input change
    });

    inputs.forEach(input => { // Iterate over each input element
        input.addEventListener('input', checkWeightsAndPrepareData); // Add an event listener to call updateTotal on input change
    });

    function updateTotal() { // Function to update the total weight
        let total = 0; // Initialize total to 0
        weights = []; // Reset weights array
        inputs.forEach(input => { // Iterate over each input element
            const weight = parseFloat(input.value) || 0;
            if (weight > 0) { // Only add non-zero weights
                total += weight; // Add the input value to total
                weights.push(weight); // Add the weight to the weights array
            }
        });
        totalSpan.textContent = total.toFixed(2); // Update the text content of totalSpan with the total, formatted to 2 decimal places
        totalSpan.style.color = total > 1 ? 'red' : 'black'; // Change color based on total value
    }

    function checkWeightsAndPrepareData() {
        // Prepare data for the POST request
        const data = new FormData();
        weights.forEach(weight => data.append("weights", weight));
    }

});

//! ----------------- Set Default Date Range -----------------

document.addEventListener('DOMContentLoaded', function () {
    const fromDate = document.getElementById('fromDate');
    const toDate = document.getElementById('toDate');

    // Constants
    const oneDayMs = 86400000;

    // Default date calculations
    const lastYear = new Date().getFullYear() - 1;
    const defaultFromDate = formatDate(new Date(`${lastYear}-12-31`));
    const defaultToDate = formatDate(new Date(Date.now() - oneDayMs));

    // Check elements exist before setting values
    if (fromDate) fromDate.value = defaultFromDate;
    if (toDate) toDate.value = defaultToDate;

    // Function to format date as yyyy-MM-dd
    function formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${year}-${month}-${day}`;
    }
});


//! ----------------- Dynamically update list of invested assets -----------------

document.addEventListener('DOMContentLoaded', function () { // Wait for the DOM to be fully loaded
    const inputs = document.querySelectorAll('input[id^="weight"]'); // Select all input elements with id starting with "weightAsset"

    inputs.forEach(input => { // Iterate over each input element
        input.addEventListener('input', updateInvestedAssets); // Add an event listener to update investedAssets on input change
    });

    function updateInvestedAssets() {
        investedAssets = Array.from(inputs)
            .filter(input => parseFloat(input.value) > 0)
            .map(input => input.id.replace('weight_', '')); // Remove "weight_" from the input id
    }
});

// * ----------------- Initialization -----------------

axios.get(performance, {
    params: {
        ticker: investedAssets, // Additional data like ticker
        weights: JSON.stringify(weights)
    }
}).then(response => {
    const data = response.data;
    const parseTime = d3.timeParse("%d.%m.%Y") // Create a time parser

    const dataKeys = {
        portfolio_performance: ['close'],
        portfolio_rolling_return: ['volatility', 'return'],
        asset_performance: ['close'],
        asset_rolling_return: ['volatility', 'return'],
        portfolio_drawdown: ['drawdown'],
        portfolio_rolling_beta: ['beta'],
        asset_rolling_beta: ['beta']
    };

    for (const [key, fields] of Object.entries(dataKeys)) {
        for (const row of data[key]) {
            fields.forEach(field => row[field] = Number(row[field]) * (field === 'close' || field === 'beta' ? 1 : 100));
            row.date = parseTime(row.date);
        }
    }


    lineChart1 = new LineChart(_parentElement = "#aggregated-performance", _data = data.portfolio_performance, _xdata = "date", _xlabel = "", _ydata = "close", _ylabel = "", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 65 }, _rebase = true, _slider = 1);
    lineChart2 = new LineChart(_parentElement = "#aggregated-performance-rolling", _data = data.portfolio_rolling_return, _xdata = "date", _xlabel = "", _ydata = "return", _ylabel = "1-Year Rolling Return [%]", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 65 }, _rebase = false, _slider = 2);
    lineChart3 = new LineChart(_parentElement = "#asset-performance", _data = data.asset_performance, _xdata = "date", _xlabel = "", _ydata = "close", _ylabel = "", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 65 }, _rebase = true, _slider = 3);
    lineChart4 = new LineChart(_parentElement = "#asset-performance-rolling", _data = data.asset_rolling_return, _xdata = "date", _xlabel = "", _ydata = "return", _ylabel = "1-Year Rolling Return [%]", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 65 }, _rebase = false, _slider = 4);
    lineChart5 = new LineChart(_parentElement = "#aggregated-performance-volatility", _data = data.portfolio_rolling_return, _xdata = "date", _xlabel = "", _ydata = "volatility", _ylabel = "1-Year Rolling Volatility [%]", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 65 }, _rebase = false, _slider = 5);
    lineChart6 = new LineChart(_parentElement = "#asset-performance-volatility", _data = data.asset_rolling_return, _xdata = "date", _xlabel = "", _ydata = "volatility", _ylabel = "1-Year Rolling Volatility [%]", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 65 }, _rebase = false, _slider = 6);
    lineChart7 = new LineChart(_parentElement = "#aggregated-performance-beta", _data = data.portfolio_rolling_beta, _xdata = "date", _xlabel = "", _ydata = "beta", _ylabel = "Beta", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 140 }, _rebase = false, _slider = 7);
    lineChart8 = new LineChart(_parentElement = "#asset-performance-beta", _data = data.asset_rolling_beta, _xdata = "date", _xlabel = "", _ydata = "beta", _ylabel = "Beta", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 2, widthCol: 100 }, _rebase = false, _slider = 8);
    lineChart9 = new LineChart(_parentElement = "#aggregated-performance-drawdown", _data = data.portfolio_drawdown, _xdata = "date", _xlabel = "", _ydata = "drawdown", _ylabel = "Drawdown [%]", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 85 }, _rebase = false, _slider = 9);

    horTable1 = new HorizontalTable(_tableid = "table_top_drawdown", _data = data.portfolio_top_drawdowns);

}).catch(error => {
    console.error('Error fetching data:', error);
});

// * ----------------- Update -----------------

const updatePfView = () => {
    axios.get(performance, {
        params: {
            ticker: investedAssets, // Additional data like ticker
            weights: JSON.stringify(weights)
        }
    }).then(response => {// Read the data from a CSV file
        const data = response.data;
        const parseTime = d3.timeParse("%d.%m.%Y") // Create a time parser

        const dataKeys = {
            portfolio_performance: ['close'],
            portfolio_rolling_return: ['volatility', 'return'],
            asset_performance: ['close'],
            asset_rolling_return: ['volatility', 'return'],
            portfolio_drawdown: ['drawdown'],
            portfolio_rolling_beta: ['beta'],
            asset_rolling_beta: ['beta']
        };

        for (const [key, fields] of Object.entries(dataKeys)) {
            for (const row of data[key]) {
                fields.forEach(field => row[field] = Number(row[field]) * (field === 'close' || field === 'beta' ? 1 : 100));
                row.date = parseTime(row.date);
            }
        }


        lineChart1.data = data.portfolio_performance
        lineChart2.data = data.portfolio_rolling_return
        lineChart3.data = data.asset_performance
        lineChart4.data = data.asset_rolling_return
        lineChart5.data = data.portfolio_rolling_return
        lineChart6.data = data.asset_rolling_return
        lineChart7.data = data.portfolio_rolling_beta
        lineChart8.data = data.asset_rolling_beta
        lineChart9.data = data.portfolio_drawdown

        const charts = [lineChart1, lineChart2, lineChart3, lineChart4, lineChart5, lineChart6, lineChart7, lineChart8, lineChart9];
        for (let chart of charts) {
            chart.manageData();
        }

        horTable1 = new HorizontalTable(_tableid = "table_top_drawdown", _data = data.portfolio_top_drawdowns);

    }).catch(error => {
        console.error('Error fetching data:', error);
    });
}


$('input[id^="weight"]').on("change", updatePfView); // Add an event listener to call updatePfView on input change for elements with id starting with "weight"
