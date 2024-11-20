// Handles all the events and interactions for the visualization
let lineChart
let lineChart2
const inputs = document.querySelectorAll('input[id^="weight"]');

// ! ----------------- Get Default Weights -----------------
let weights = [];
console.log("weights before", weights)
inputs.forEach(input => { // Iterate over each input element
    const weight = parseFloat(input.value) || 0;
    if (weight > 0) { // Only add non-zero weights
        weights.push(weight); // Add the weight to the weights array
    }
});
console.log("weights after", weights)

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

//! ----------------- Aggregated Portfolio Performance -----------------

axios.get(aggregatedPerformance, {
    params: {
        ticker: investedAssets, // Additional data like ticker
        weights: JSON.stringify(weights)
    }
}).then(response => {
    const data = response.data;
    const parseTime = d3.timeParse("%d.%m.%Y") // Create a time parser

    for (const row of data) { // Iterate over the data rows
        row.close = Number(row.close) // Convert the Close value to a number
        row.date = parseTime(row.date) // Parse the Date value
    }

    lineChart = new LineChart(_parentElement = "#aggregated-performance", _data = data, _xdata = "date", _xlabel = "", _ydata = "close", _ylabel = "", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 65 }, _rebase = true, _slider = 1);

}).catch(error => {
    console.error('Error fetching data:', error);
});

//! ----------------- Asset Performance -----------------

axios.get(assetPerformance, {
    params: {
        ticker: investedAssets, // Additional data like ticker
    }
}).then(response => {
    const data = response.data;
    const parseTime = d3.timeParse("%d.%m.%Y") // Create a time parser

    for (const row of data) { // Iterate over the data rows
        row.close = Number(row.close) // Convert the Close value to a number
        row.date = parseTime(row.date) // Parse the Date value
    }

    lineChart2 = new LineChart(_parentElement = "#asset-performance", _data = data, _xdata = "date", _xlabel = "", _ydata = "close", _ylabel = "", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 65 }, _rebase = true, _slider = 2);

}).catch(error => {
    console.error('Error fetching data:', error);
});


// * ----------------- Update -----------------


const updatePfView = () => {
    axios.get(aggregatedPerformance, {
        params: {
            ticker: investedAssets, // Additional data like ticker
            weights: JSON.stringify(weights)
        }
    }).then(response => {// Read the data from a CSV file
        const data = response.data;
        const parseTime = d3.timeParse("%d.%m.%Y") // Create a time parser

        for (const row of data) { // Iterate over the data rows
            row.close = Number(row.close) // Convert the Close value to a number
            row.date = parseTime(row.date) // Parse the Date value
        }

        lineChart.data = data
        lineChart.manageData()
    })

    axios.get(assetPerformance, {
        params: {
            ticker: investedAssets, // Additional data like ticker
        }
    }).then(response => {// Read the data from a CSV file
        const data = response.data;
        const parseTime = d3.timeParse("%d.%m.%Y") // Create a time parser

        for (const row of data) { // Iterate over the data rows
            row.close = Number(row.close) // Convert the Close value to a number
            row.date = parseTime(row.date) // Parse the Date value
        }

        lineChart2.data = data
        lineChart2.manageData()
    })

}


$('input[id^="weight"]').on("change", updatePfView); // Add an event listener to call updatePfView on input change for elements with id starting with "weight"
