// let lineChart1
// let lineChart2
// let lineChart3
// let lineChart4
// let lineChart5
// let lineChart6
// let lineChart7
// let horTable1
// let horTable2
// let horTable3
// let barChart1
// let barChart2
// let barChart3


//! ----------------- Helper Functions -----------------
function updateInvested(inputs, invested, weights) {
    invested.length = 0;
    weights.length = 0;
    inputs.each(function () {
        const value = parseFloat(this.value) / 100;
        if (value > 0) {
            invested.push(this.id.split('_')[1]);
            weights.push(value);
        }
    });
}

function updateTotal(weights, span) {
    const total = weights.reduce((acc, weight) => acc + weight, 0) * 100;
    span.textContent = `(${total.toFixed(0)}%)`;
    span.style.color = total > 100 ? 'red' : 'black';
}


const stressEvent = document.getElementById('stressTestSelect').value;
const eventData = {
    1: {
        startdate: '2018-01-29',
        enddate: '2019-04-29',
        description: 'US/CHINA Trade War'
    },
    2: {
        startdate: '2020-02-13',
        enddate: '2020-08-24',
        description: 'COVID-19'
    }
};


const lookthrough = [
    { name: "Robeco US Equities", equity: "100%", fixedIncome: "0%" },
    { name: "Invesco Pan Europ Eq", equity: "100%", fixedIncome: "0%" },
    { name: "Classic Global Equity", equity: "90%", fixedIncome: "10%" },
    { name: "Blueby Global IG", equity: "0%", fixedIncome: "100%" },
    { name: "Invesco Euro Corporate", equity: "0%", fixedIncome: "100%" },
    { name: "UBAM Medium Term Corporate", equity: "0%", fixedIncome: "100%" }
];


// ! ----------------- Get Portfolio Info -----------------
const assetInputs = $('input[id^="weight_"]');
let investedAssets = [];
let assetWeights = [];
updateInvested(assetInputs, investedAssets, assetWeights);

// ! ----------------- Get BM Info -----------------
const bmInputs = $('input[id^="weightbm_"]');
let investedBMs = [];
let bmWeights = [];
updateInvested(bmInputs, investedBMs, bmWeights);

//! ----------------- Set Default Date Range -----------------
document.addEventListener('DOMContentLoaded', function () {
    const fromDate = document.getElementById('fromDate');
    const toDate = document.getElementById('toDate');


    const oneDayMs = 86400000;


    const lastYear = new Date().getFullYear() - 1;
    const defaultFromDate = formatDate(new Date(`${lastYear}-12-31`));
    const defaultToDate = formatDate(new Date(Date.now() - oneDayMs));


    if (fromDate) fromDate.value = defaultFromDate;
    if (toDate) toDate.value = defaultToDate;


    function formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${year}-${month}-${day}`;
    }
});



//! * ----------------- Initialization -----------------
document.addEventListener('DOMContentLoaded', function () {
    const combinedArray = investedAssets.map((stock, index) => {
        return {
            Stock: stock,
            Weight: parseFloat(assetWeights[index]) * 100
        };
    });

    // Calculate total equity and fixed income allocation
    const totals = combinedArray.reduce(
        (acc, item1) => {
            const match = lookthrough.find(item2 => item2.name === item1.Stock);
            if (match) {
                const weight = item1.Weight;
                const equityPercentage = parseFloat(match.equity) / 100; // Convert "100%" to 1.0
                const fixedIncomePercentage = parseFloat(match.fixedIncome) / 100; // Convert "100%" to 1.0

                acc.Equity += weight * equityPercentage;
                acc.FixedIncome += weight * fixedIncomePercentage;
            }
            return acc;
        },
        { Equity: 0, FixedIncome: 0 }
    );

    // Format the output as requested
    const assetAllocation = [
        { Asset: "Equity", Weight: totals.Equity },
        { Asset: "Fixed Income", Weight: totals.FixedIncome }
    ];


    barChart2 = new HorizontalBarChart(_parentElement = "#allocation-bar-area-1", _data = combinedArray, _xdata = "Weight", _xlabel = "", _ydata = "Stock", _ylabel = "", _cdata = null, _dimension = { width: 426, height: 330 }, _legend = { noCol: 1, widthCol: 65 });
    barChart3 = new HorizontalBarChart(_parentElement = "#allocation-bar-area-2", _data = assetAllocation, _xdata = "Weight", _xlabel = "", _ydata = "Asset", _ylabel = "", _cdata = null, _dimension = { width: 426, height: 330 }, _legend = { noCol: 1, widthCol: 65 });

});


axios.get(performance, {
    params: {
        assetTicker: investedAssets,
        assetWeights: JSON.stringify(assetWeights),
        bmTicker: investedBMs,
        bmWeights: JSON.stringify(bmWeights)
    }
}).then(response => {
    const data = response.data;
    const parseTime = d3.timeParse("%d.%m.%Y")
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

    const assetPerformanceSymbols = data.asset_performance.map(d => d.symbol);
    data.asset_rolling_return.sort((a, b) => {
        return assetPerformanceSymbols.indexOf(a.symbol) - assetPerformanceSymbols.indexOf(b.symbol);
    });
    data.asset_rolling_beta.sort((a, b) => {
        return assetPerformanceSymbols.indexOf(a.symbol) - assetPerformanceSymbols.indexOf(b.symbol);
    });


    lineChart1 = new LineChart(_parentElement = "#aggregated-performance", _data = data.portfolio_performance, _xdata = "date", _xlabel = "", _ydata = "close", _ylabel = "", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 65 }, _rebase = true, _slider = 1);
    lineChart2 = new LineChart(_parentElement = "#aggregated-performance-rolling", _data = data.portfolio_rolling_return, _xdata = "date", _xlabel = "", _ydata = "return", _ylabel = "1-Year Rolling Return [%]", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 65 }, _rebase = false, _slider = 2);
    lineChart3 = new LineChart(_parentElement = "#asset-performance", _data = data.asset_performance, _xdata = "date", _xlabel = "", _ydata = "close", _ylabel = "", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 2, widthCol: 125 }, _rebase = true, _slider = 3);
    lineChart4 = new LineChart(_parentElement = "#asset-performance-rolling", _data = data.asset_rolling_return, _xdata = "date", _xlabel = "", _ydata = "return", _ylabel = "1-Year Rolling Return [%]", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 2, widthCol: 125 }, _rebase = false, _slider = 4);
    lineChart5 = new LineChart(_parentElement = "#aggregated-performance-volatility", _data = data.portfolio_rolling_return, _xdata = "date", _xlabel = "", _ydata = "volatility", _ylabel = "1-Year Rolling Volatility [%]", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 65 }, _rebase = false, _slider = 5);
    lineChart6 = new LineChart(_parentElement = "#asset-performance-volatility", _data = data.asset_rolling_return, _xdata = "date", _xlabel = "", _ydata = "volatility", _ylabel = "1-Year Rolling Volatility [%]", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 2, widthCol: 125 }, _rebase = false, _slider = 6);
    lineChart7 = new LineChart(_parentElement = "#aggregated-performance-beta", _data = data.portfolio_rolling_beta, _xdata = "date", _xlabel = "", _ydata = "beta", _ylabel = "Beta", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 140 }, _rebase = false, _slider = 7);
    lineChart8 = new LineChart(_parentElement = "#asset-performance-beta", _data = data.asset_rolling_beta, _xdata = "date", _xlabel = "", _ydata = "beta", _ylabel = "Beta", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 2, widthCol: 125 }, _rebase = false, _slider = 8);
    lineChart9 = new LineChart(_parentElement = "#aggregated-performance-drawdown", _data = data.portfolio_drawdown, _xdata = "date", _xlabel = "", _ydata = "drawdown", _ylabel = "Drawdown [%]", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 85 }, _rebase = false, _slider = 9);

    const stressTestResults = {};
    for (const [eventKey, eventDetails] of Object.entries(eventData)) {
        stressTestResults[eventKey] = data.portfolio_performance.filter(d =>
            d.date >= new Date(eventDetails.startdate) && d.date <= new Date(eventDetails.enddate)
        );
    }
    dataStressTest = stressTestResults[stressEvent];
    lineChart10 = new LineChartAnimation(_parentElement = "#stress-test-performance", _data = dataStressTest, _xdata = "date", _xlabel = "", _ydata = "close", _ylabel = "", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 65 }, _rebase = true, _slider = 0);
    lineChart10.stressTestResults = stressTestResults;

    horTable1 = new HorizontalTable(_tableid = "table_top_drawdown", _data = data.portfolio_top_drawdowns);
    horTable2 = new HorizontalTable(_tableid = "table_top_drawdown2", _data = data.benchmark_top_drawdowns);
    horTable3 = new HorizontalTable(_tableid = "table_performance_metrics", _data = data.performance_metrics);

    barChart1 = new GroupedBarChart(_parentElement = "#upside-downside-bar1", _data = data.monthly_returns[0].returns, _xdata = "return_type", _xlabel = "", _ydata = "Percentage", _ylabel = "Percentage", _cdata = "Asset", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 85 });

}).catch(error => {
    console.error('Error fetching data:', error);
});



//! * ----------------- Update -----------------
// * ----------------- Update Cockpit -----------------
document.addEventListener('DOMContentLoaded', function () {
    const assetSpan = $('#update-asset-weight')[0];
    const bmSpan = $('#update-bm-weight')[0];


    assetInputs.on('input', () => {
        updateInvested(assetInputs, investedAssets, assetWeights);
        updateTotal(assetWeights, assetSpan);


        const combinedArray = investedAssets.map((stock, index) => {
            return {
                Stock: stock,
                Weight: parseFloat(assetWeights[index]) * 100
            };
        });

        barChart2.data = combinedArray

        // Calculate total equity and fixed income allocation
        const totals = combinedArray.reduce(
            (acc, item1) => {
                const match = lookthrough.find(item2 => item2.name === item1.Stock);
                if (match) {
                    const weight = item1.Weight;
                    const equityPercentage = parseFloat(match.equity) / 100; // Convert "100%" to 1.0
                    const fixedIncomePercentage = parseFloat(match.fixedIncome) / 100; // Convert "100%" to 1.0

                    acc.Equity += weight * equityPercentage;
                    acc.FixedIncome += weight * fixedIncomePercentage;
                }
                return acc;
            },
            { Equity: 0, FixedIncome: 0 }
        );

        // Format the output as requested
        const assetAllocation = [
            { Asset: "Equity", Weight: totals.Equity },
            { Asset: "Fixed Income", Weight: totals.FixedIncome }
        ];

        barChart3.data = assetAllocation

        const charts = [barChart2, barChart3];
        for (let chart of charts) {
            chart.manageData();
        }
    });

    bmInputs.on('input', () => {
        updateInvested(bmInputs, investedBMs, bmWeights);
        updateTotal(bmWeights, bmSpan);
    });
});

// * ----------------- Update Computation -----------------
const updatePfView = () => {
    axios.get(performance, {
        params: {
            assetTicker: investedAssets,
            assetWeights: JSON.stringify(assetWeights),
            bmTicker: investedBMs,
            bmWeights: JSON.stringify(bmWeights)
        }
    }).then(response => {
        const data = response.data;
        const parseTime = d3.timeParse("%d.%m.%Y")

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
        barChart1.data = data.monthly_returns[0].returns



        const stressTestResults = {};
        for (const [eventKey, eventDetails] of Object.entries(eventData)) {
            stressTestResults[eventKey] = data.portfolio_performance.filter(d =>
                d.date >= new Date(eventDetails.startdate) && d.date <= new Date(eventDetails.enddate)
            );
        }
        dataStressTest = stressTestResults[stressEvent];
        lineChart10.data = dataStressTest
        lineChart10.stressTestResults = stressTestResults;

        const charts = [lineChart1, lineChart2, lineChart3, lineChart4, lineChart5, lineChart6, lineChart7, lineChart8, lineChart9, barChart1, lineChart10];
        for (let chart of charts) {
            chart.manageData();
        }

        horTable1 = new HorizontalTable(_tableid = "table_top_drawdown", _data = data.portfolio_top_drawdowns);
        horTable2 = new HorizontalTable(_tableid = "table_top_drawdown2", _data = data.benchmark_top_drawdowns);
        horTable3 = new HorizontalTable(_tableid = "table_performance_metrics", _data = data.performance_metrics);

    }).catch(error => {
        console.error('Error fetching data:', error);
    });


}

const runStressTest = () => {
    const stressEvent = document.getElementById('stressTestSelect').value;
    console.log(lineChart10.data)
    console.log(lineChart10.stressTestResults[stressEvent])

    lineChart10.data = lineChart10.stressTestResults[stressEvent];
    lineChart10.manageData();
};



$('.btn-primary').on("click", updatePfView);
$('#play-button').on("click", runStressTest);

