// Handles all the events and interactions for the visualization
let barChart
let lineChart

document.addEventListener('DOMContentLoaded', function () { // Wait for the DOM to be fully loaded
    const inputs = document.querySelectorAll('input[id^="weightAsset"]'); // Select all input elements with id starting with "weightAsset"
    const totalSpan = document.getElementById('update-weight'); // Select the element with id "update-weight"

    inputs.forEach(input => { // Iterate over each input element
        input.addEventListener('input', updateTotal); // Add an event listener to call updateTotal on input change
    });

    function updateTotal() { // Function to update the total weight
        let total = 0; // Initialize total to 0
        inputs.forEach(input => { // Iterate over each input element
            total += parseFloat(input.value) || 0; // Add the input value to total, or 0 if the value is not a number
        });
        totalSpan.textContent = total.toFixed(2); // Update the text content of totalSpan with the total, formatted to 2 decimal places
    }
});





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
        console.log(`${year}-${month}-${day}`)
        return `${year}-${month}-${day}`;
    }
});







// ----------------- Initialization -----------------


d3.dsv(";", techstockTS).then(data => { // Read the data from a CSV file

    const parseTime = d3.timeParse("%d.%m.%Y") // Create a time parser

    for (const row of data) { // Iterate over the data rows
        row.Close = Number(row.Close) // Convert the Close value to a number
        row.Date = parseTime(row.Date) // Parse the Date value
    }

    // ! CHANGE THIS BACK TO THE FORM SELECT VALUE
    // let formSelectValue = $('.form-select').val();
    let formSelectValue = "AAPL";
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



// ----------------- Update -----------------


const updatePfView = () => {




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


    // d3.json(groupedbar2).then(data => {
    //     let formSelectValue = $('.form-select').val();

    //     dataGrouped = d3.group(data, d => d['Stock']);
    //     data1 = dataGrouped.get(formSelectValue);
    //     barChart2.data = data1
    //     barChart2.manageData()
    // })


}

// Event listeners
$('.form-select').on("change", updatePfView)

