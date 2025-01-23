let lineChart1
let lineChart2
let lineChart3
let lineChart4
let lineChart5
let lineChart6
let lineChart7
let horTable1
let horTable2
let horTable3
let barChart1
let barChart2
let barChart3


//! ----------------- Helper Functions -----------------
function updateInvested(inputs, invested, weights) {
    invested.length = 0;
    weights.length = 0;
    inputs.each(function () {
        const value = parseFloat(this.value);
        if (value > 0) {
            invested.push(this.id.split('_')[1]);
            weights.push(value);
        }
        console.log(invested, weights);
    });
}

function updateTotal(weights, span) {
    const total = weights.reduce((acc, weight) => acc + weight, 0) * 100;
    span.textContent = `(${total.toFixed(0)}%)`;
    span.style.color = total > 100 ? 'red' : 'black';
}

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
            Weight: parseFloat(assetWeights[index])
        };
    });

    const dataTest = [
        {
            Stock: "NVDA",
            Multiple: "P/B",
            Value: 36.71
        },
        {
            Stock: "NVDA",
            Multiple: "EV/EBITDA",
            Value: 54.98
        },
        {
            Stock: "NVDA",
            Multiple: "P/E",
            Value: 65.33
        },
        {
            Stock: "NVDA",
            Multiple: "P/S",
            Value: 27.48
        },
        {
            Stock: "NVDA",
            Multiple: "D/E",
            Value: 0.29
        }
    ];

    barChart2 = new HorizontalBarChart(_parentElement = "#multiple-bar-area", _data = combinedArray, _xdata = "Weight", _xlabel = "", _ydata = "Stock", _ylabel = "", _cdata = null, _dimension = { width: 426, height: 330 }, _legend = { noCol: 1, widthCol: 65 });
    barChart3 = new HorizontalBarChart(_parentElement = "#multiple-bar-area2", _data = dataTest, _xdata = "Value", _xlabel = "", _ydata = "Multiple", _ylabel = "", _cdata = "Year", _dimension = { width: 426, height: 330 }, _legend = { noCol: 1, widthCol: 65 });
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


    lineChart1 = new LineChart(_parentElement = "#aggregated-performance", _data = data.portfolio_performance, _xdata = "date", _xlabel = "", _ydata = "close", _ylabel = "", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 65 }, _rebase = true, _slider = 1);
    lineChart2 = new LineChart(_parentElement = "#aggregated-performance-rolling", _data = data.portfolio_rolling_return, _xdata = "date", _xlabel = "", _ydata = "return", _ylabel = "1-Year Rolling Return [%]", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 65 }, _rebase = false, _slider = 2);
    lineChart3 = new LineChart(_parentElement = "#asset-performance", _data = data.asset_performance, _xdata = "date", _xlabel = "", _ydata = "close", _ylabel = "", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 65 }, _rebase = true, _slider = 3);
    lineChart4 = new LineChart(_parentElement = "#asset-performance-rolling", _data = data.asset_rolling_return, _xdata = "date", _xlabel = "", _ydata = "return", _ylabel = "1-Year Rolling Return [%]", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 65 }, _rebase = false, _slider = 4);
    lineChart5 = new LineChart(_parentElement = "#aggregated-performance-volatility", _data = data.portfolio_rolling_return, _xdata = "date", _xlabel = "", _ydata = "volatility", _ylabel = "1-Year Rolling Volatility [%]", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 65 }, _rebase = false, _slider = 5);
    lineChart6 = new LineChart(_parentElement = "#asset-performance-volatility", _data = data.asset_rolling_return, _xdata = "date", _xlabel = "", _ydata = "volatility", _ylabel = "1-Year Rolling Volatility [%]", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 65 }, _rebase = false, _slider = 6);
    lineChart7 = new LineChart(_parentElement = "#aggregated-performance-beta", _data = data.portfolio_rolling_beta, _xdata = "date", _xlabel = "", _ydata = "beta", _ylabel = "Beta", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 140 }, _rebase = false, _slider = 7);
    lineChart8 = new LineChart(_parentElement = "#asset-performance-beta", _data = data.asset_rolling_beta, _xdata = "date", _xlabel = "", _ydata = "beta", _ylabel = "Beta", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 2, widthCol: 110 }, _rebase = false, _slider = 8);
    lineChart9 = new LineChart(_parentElement = "#aggregated-performance-drawdown", _data = data.portfolio_drawdown, _xdata = "date", _xlabel = "", _ydata = "drawdown", _ylabel = "Drawdown [%]", _group = "symbol", _dimension = { width: 829, height: 500 }, _legend = { noCol: 1, widthCol: 85 }, _rebase = false, _slider = 9);

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
                Weight: parseFloat(assetWeights[index])
            };
        });

        barChart2.data = combinedArray

        const charts = [barChart2];
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
    console.log("Updated Weights:", assetWeights);
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

        const charts = [lineChart1, lineChart2, lineChart3, lineChart4, lineChart5, lineChart6, lineChart7, lineChart8, lineChart9];
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


$('.btn-primary').on("click", updatePfView);





