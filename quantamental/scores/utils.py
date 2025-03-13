from datetime import datetime

import numpy as np
import pandas as pd


def filter_performance(performance_ts, from_date, to_date):
    return [
        asset
        for asset in performance_ts
        if from_date <= datetime.strptime(asset["date"], "%d.%m.%Y") <= to_date
    ]


def calculate_portfolio_performance(weights, asset_timeseries, symbol):
    """
    Calculate portfolio performance with rebalancing at the last business day of March, June, September, and December.
    The asset timeseries and the resulting portfolio performance are indexed at 100.

    Parameters:
    weights (np.ndarray): Array of weights. Shape (n_assets,)
    asset_timeseries (list of dict): List of dictionaries with asset timeseries data.

    Returns:
    str: Portfolio performance timeseries indexed at 100 in JSON format.
    """
    # Convert the list of dictionaries to a DataFrame
    weights = np.array(weights)

    df = pd.DataFrame(asset_timeseries)
    df["date"] = pd.to_datetime(df["date"], format="%d.%m.%Y")
    df["close"] = df["close"].astype(float)

    # Pivot the DataFrame to get the timeseries for each asset
    asset_timeseries_df = df.pivot(
        index="date", columns="symbol", values="close"
    ).sort_index()

    # Extract the dates from the DataFrame
    dates = asset_timeseries_df.index

    # Ensure the dates are sorted
    asset_timeseries_df = asset_timeseries_df.reindex(dates).fillna(method="ffill")

    # Convert the DataFrame to a numpy array
    asset_timeseries = asset_timeseries_df.values

    n_assets = weights.shape[0]
    n_periods = asset_timeseries.shape[0]

    # Ensure the number of periods matches the number of dates
    assert n_periods == len(dates), "Number of periods must match the number of dates"

    # Calculate simple returns from the asset timeseries
    simple_returns = asset_timeseries[1:] / asset_timeseries[:-1] - 1

    # Find the last business day of March, June, September, and December
    rebalancing_dates = pd.date_range(start=dates.min(), end=dates.max(), freq="Q")
    rebalancing_dates = rebalancing_dates + pd.offsets.BMonthEnd(0)

    # Create a weights matrix for all rebalancings
    n_quarters = len(rebalancing_dates)
    weights_matrix = np.tile(weights, (n_quarters, 1))

    portfolio_performance = np.zeros(n_periods)
    current_weights = weights

    # Initialize the portfolio performance at 100
    portfolio_performance[0] = 100

    for i in range(1, n_periods):
        if dates[i] in rebalancing_dates:
            quarter_index = rebalancing_dates.get_loc(dates[i])
            current_weights = weights_matrix[quarter_index]
        portfolio_performance[i] = portfolio_performance[i - 1] * (
            1 + np.dot(simple_returns[i - 1], current_weights)
        )

    # Create the output in the specified format
    output = []
    for i, date in enumerate(dates):
        output.append(
            {
                "id": i + 1,
                "symbol": symbol,
                "date": date.strftime("%d.%m.%Y"),
                "close": f"{portfolio_performance[i]:.2f}",
            }
        )

    return output


def calculate_rolling_return(asset_timeseries):
    """
    Calculate the 1-year rolling volatility and 1-year rolling return for every timeseries in asset_timeseries.

    Parameters:
    asset_timeseries (list of dict): List of dictionaries with asset timeseries data.

    Returns:
    str: Rolling volatility and return timeseries in JSON format.
    """
    # Convert the list of dictionaries to a DataFrame
    df = pd.DataFrame(asset_timeseries)
    df["date"] = pd.to_datetime(df["date"], format="%d.%m.%Y")
    df["close"] = df["close"].astype(float)

    # Pivot the DataFrame to get the timeseries for each asset
    asset_timeseries_df = df.pivot(
        index="date", columns="symbol", values="close"
    ).sort_index()

    # Calculate daily returns
    daily_returns = asset_timeseries_df.pct_change()

    # Calculate rolling volatility (annualized, using 252 trading days)
    rolling_volatility = daily_returns.rolling(window=252).std() * np.sqrt(252)

    # Calculate rolling return
    rolling_return = (daily_returns + 1).rolling(window=252).apply(
        np.prod, raw=True
    ) - 1

    # Reshape the DataFrames to long format
    rolling_volatility = rolling_volatility.reset_index().melt(
        id_vars="date", var_name="symbol", value_name="volatility"
    )
    rolling_return = rolling_return.reset_index().melt(
        id_vars="date", var_name="symbol", value_name="return"
    )

    # Merge the volatility and return DataFrames
    merged_df = pd.merge(rolling_volatility, rolling_return, on=["date", "symbol"])

    # Drop rows with NaN values (before 1-year rolling window is complete)
    merged_df = merged_df.dropna()

    # Create the output in the specified format
    output = []
    for i, row in merged_df.iterrows():
        output.append(
            {
                "id": i + 1,
                "symbol": row["symbol"],
                "date": row["date"].strftime("%d.%m.%Y"),
                "volatility": f"{row['volatility']:.6f}",
                "return": f"{row['return']:.6f}",
            }
        )

    return output


def calculate_drawdown(asset_timeseries):
    """
    Calculate the drawdown timeseries for every timeseries in asset_timeseries.

    Parameters:
    asset_timeseries (list of dict): List of dictionaries with asset timeseries data.

    Returns:
    str: Drawdown timeseries in JSON format.
    """
    # Convert the list of dictionaries to a DataFrame
    df = pd.DataFrame(asset_timeseries)
    df["date"] = pd.to_datetime(df["date"], format="%d.%m.%Y")
    df["close"] = df["close"].astype(float)

    # Pivot the DataFrame to get the timeseries for each asset
    asset_timeseries_df = df.pivot(
        index="date", columns="symbol", values="close"
    ).sort_index()

    # Calculate the cumulative returns
    cumulative_returns = asset_timeseries_df / asset_timeseries_df.iloc[0]

    # Calculate the rolling maximum
    rolling_max = cumulative_returns.cummax()

    # Calculate the drawdown
    drawdown = (cumulative_returns - rolling_max) / rolling_max

    # Reshape the DataFrame to long format
    drawdown = drawdown.reset_index().melt(
        id_vars="date", var_name="symbol", value_name="drawdown"
    )

    # Create the output in the specified format
    output = []
    for i, row in drawdown.iterrows():
        output.append(
            {
                "id": i + 1,
                "symbol": row["symbol"],
                "date": row["date"].strftime("%d.%m.%Y"),
                "drawdown": f"{row['drawdown']:.6f}",
            }
        )

    return output


def calculate_top_drawdowns(asset_timeseries):
    """
    Calculate the top 5 drawdowns for every timeseries in asset_timeseries.

    Parameters:
    asset_timeseries (list of dict): List of dictionaries with asset timeseries data.

    Returns:
    str: Top 5 drawdowns in JSON format.
    """
    # Convert the list of dictionaries to a DataFrame
    df = pd.DataFrame(asset_timeseries)
    df["date"] = pd.to_datetime(df["date"], format="%d.%m.%Y")
    df["close"] = df["close"].astype(float)

    # Pivot the DataFrame to get the timeseries for each asset
    asset_timeseries_df = df.pivot(
        index="date", columns="symbol", values="close"
    ).sort_index()

    output = []

    for symbol in asset_timeseries_df.columns:
        series = asset_timeseries_df[symbol]
        cumulative_returns = series / series.iloc[0]
        rolling_max = cumulative_returns.cummax()
        drawdown = (cumulative_returns - rolling_max) / rolling_max

        # Find drawdown periods
        drawdown_periods = []
        in_drawdown = False
        start_date = None
        trough_date = None
        end_date = None
        max_drawdown = 0

        for date, dd in drawdown.items():
            if dd < 0:
                if not in_drawdown:
                    in_drawdown = True
                    start_date = date
                    trough_date = date
                    max_drawdown = dd
                elif dd < max_drawdown:
                    trough_date = date
                    max_drawdown = dd
            elif in_drawdown:
                in_drawdown = False
                end_date = date
                drawdown_periods.append(
                    (start_date, trough_date, end_date, max_drawdown)
                )
                start_date = None
                trough_date = None
                end_date = None
                max_drawdown = 0

        # Sort drawdowns by magnitude
        drawdown_periods = sorted(drawdown_periods, key=lambda x: x[3])

        # Take the top 5 drawdowns
        top_drawdowns = drawdown_periods[:5]

        for i, (start, trough, end, max_dd) in enumerate(top_drawdowns):
            output.append(
                {
                    "symbol": symbol,
                    "Start Date": start.strftime("%d.%m.%Y"),
                    "Trough Date": trough.strftime("%d.%m.%Y"),
                    "End Date": end.strftime("%d.%m.%Y"),
                    "Days to Trough": (trough - start).days,
                    "Days To Recovery": (end - trough).days,
                    "Max Drawdown [%]": f"{max_dd * 100:.2f}",
                }
            )

    return output


def calculate_rolling_beta(asset_timeseries, benchmark_timeseries):
    """
    Calculate the 1-year rolling beta based on weekly returns and a 2-year lookback period.
    Apply the Blume adjustment to the beta.

    Parameters:
    asset_timeseries (list of dict): List of dictionaries with asset timeseries data.
    benchmark_timeseries (list of dict): List of dictionaries with benchmark timeseries data.

    Returns:
    list of dict: Rolling beta timeseries in JSON format.
    """
    # Convert input data to DataFrames
    asset_df = pd.DataFrame(asset_timeseries)
    benchmark_df = pd.DataFrame(benchmark_timeseries)

    # Convert date columns to datetime and ensure correct types
    asset_df["date"] = pd.to_datetime(asset_df["date"], format="%d.%m.%Y")
    benchmark_df["date"] = pd.to_datetime(benchmark_df["date"], format="%d.%m.%Y")
    asset_df["close"] = asset_df["close"].astype(float)
    benchmark_df["close"] = benchmark_df["close"].astype(float)

    # Pivot data to have symbols as columns
    asset_df = asset_df.pivot(
        index="date", columns="symbol", values="close"
    ).sort_index()
    benchmark_df = benchmark_df.pivot(
        index="date", columns="symbol", values="close"
    ).sort_index()

    # Resample to weekly frequency and calculate weekly returns
    asset_weekly_returns = asset_df.resample("W-FRI").last().pct_change()
    benchmark_weekly_returns = benchmark_df.resample("W-FRI").last().pct_change()

    # Initialize storage for results
    results = []

    # Iterate over all asset and benchmark combinations
    for asset_symbol in asset_weekly_returns.columns:
        for benchmark_symbol in benchmark_weekly_returns.columns:
            # Align asset and benchmark returns
            aligned_data = pd.concat(
                [
                    asset_weekly_returns[asset_symbol],
                    benchmark_weekly_returns[benchmark_symbol],
                ],
                axis=1,
                keys=["asset", "benchmark"],
            ).dropna()

            # Calculate rolling beta (2-year lookback, 104 weeks)
            rolling_beta = (
                aligned_data["asset"]
                .rolling(window=104, min_periods=104)
                .apply(
                    lambda x: np.cov(x, aligned_data.loc[x.index, "benchmark"])[0, 1]
                    / np.var(aligned_data.loc[x.index, "benchmark"]),
                    raw=False,
                )
            )

            # Apply Blume adjustment
            adjusted_beta = 0.67 * rolling_beta + 0.33

            # Add results to the output list
            for date, beta in adjusted_beta.dropna().items():
                results.append(
                    {
                        "date": date.strftime("%d.%m.%Y"),
                        "symbol": asset_symbol,
                        "beta": beta,
                    }
                )

    return results


def calculate_performance_metrics(asset_timeseries, benchmark_timeseries):
    """
    Calculate performance metrics for the asset timeseries.

    Parameters:
    asset_timeseries (list of dict): List of dictionaries with asset timeseries data.
    benchmark_timeseries (list of dict): List of dictionaries with benchmark timeseries data.

    Returns:
    dict: Performance metrics including cumulative return, return per annum, YTD return, annualized volatility, sharpe ratio, calmar ratio, and sortino ratio.
    """
    # Convert the list of dictionaries to a DataFrame
    df = pd.DataFrame(asset_timeseries)
    df["date"] = pd.to_datetime(df["date"], format="%d.%m.%Y")
    df["close"] = df["close"].astype(float)

    # Pivot the DataFrame to get the timeseries for each asset
    asset_timeseries_df = df.pivot(
        index="date", columns="symbol", values="close"
    ).sort_index()

    # Calculate daily returns
    daily_returns = asset_timeseries_df.pct_change().dropna()

    # Calculate cumulative return
    cumulative_return = (asset_timeseries_df.iloc[-1] / asset_timeseries_df.iloc[0]) - 1

    # Calculate return per annum (annualized return)
    n_years = (
        asset_timeseries_df.index[-1] - asset_timeseries_df.index[0]
    ).days / 365.25
    return_per_annum = (1 + cumulative_return) ** (1 / n_years) - 1

    # Calculate YTD return
    start_of_year = asset_timeseries_df[
        asset_timeseries_df.index.year == asset_timeseries_df.index[-1].year
    ].iloc[0]
    ytd_return = (asset_timeseries_df.iloc[-1] / start_of_year) - 1

    # Calculate annualized volatility
    annualized_volatility = daily_returns.std() * np.sqrt(252)

    # Calculate Sharpe ratio (assuming risk-free rate is 0)
    sharpe_ratio = return_per_annum / annualized_volatility

    # Calculate maximum drawdown for Calmar ratio
    cumulative_returns = asset_timeseries_df / asset_timeseries_df.iloc[0]
    rolling_max = cumulative_returns.cummax()
    drawdown = (cumulative_returns - rolling_max) / rolling_max
    max_drawdown = drawdown.min()

    # Calculate Calmar ratio
    calmar_ratio = return_per_annum / abs(max_drawdown)

    # Calculate Sortino ratio (assuming risk-free rate is 0)
    downside_returns = daily_returns[daily_returns < 0]
    downside_volatility = downside_returns.std() * np.sqrt(252)
    sortino_ratio = return_per_annum / downside_volatility

    # Create the output dictionary
    output = [
        {
            "symbol": symbol,
            "Cumulative Return [%]": f"{cumulative_return[symbol] * 100:.2f}",
            "YTD Return [%]": f"{ytd_return[symbol] * 100:.2f}",
            "Return p.a. [%]": f"{return_per_annum[symbol] * 100:.2f}",
            "Annualized Volatility [%]": f"{annualized_volatility[symbol] * 100:.2f}",
            "Sharpe Ratio": f"{sharpe_ratio[symbol]:.2f}",
            "Calmar Ratio": f"{calmar_ratio[symbol]:.2f}",
            "Sortino Ratio": f"{sortino_ratio[symbol]:.2f}",
        }
        for symbol in sorted(
            asset_timeseries_df.columns, key=lambda x: (x != "Portfolio", x)
        )
    ]

    return output


import pandas as pd


def calculate_monthly_returns(asset_timeseries, benchmark_timeseries):
    """
    Calculate the monthly returns of both portfolio and benchmark, and then calculate the average returns
    for all the months when the benchmark performance is negative and all the months when the benchmark return is positive.

    Parameters:
    asset_timeseries (list of dict): List of dictionaries with asset timeseries data.
    benchmark_timeseries (list of dict): List of dictionaries with benchmark timeseries data.

    Returns:
    list of dict: Average returns for positive and negative benchmark months for both portfolio and benchmark.
    """
    # Convert the list of dictionaries to DataFrames
    asset_df = pd.DataFrame(asset_timeseries)
    benchmark_df = pd.DataFrame(benchmark_timeseries)

    # Convert date columns to datetime and ensure correct types
    asset_df["date"] = pd.to_datetime(asset_df["date"], format="%d.%m.%Y")
    benchmark_df["date"] = pd.to_datetime(benchmark_df["date"], format="%d.%m.%Y")
    asset_df["close"] = asset_df["close"].astype(float)
    benchmark_df["close"] = benchmark_df["close"].astype(float)

    # Pivot data to have symbols as columns
    asset_df = asset_df.pivot(
        index="date", columns="symbol", values="close"
    ).sort_index()
    benchmark_df = benchmark_df.pivot(
        index="date", columns="symbol", values="close"
    ).sort_index()

    # Resample to monthly frequency and calculate monthly returns
    benchmark_monthly_returns = benchmark_df.resample("M").ffill().pct_change().dropna()
    asset_monthly_returns = asset_df.resample("M").ffill().pct_change().dropna()
    results = []
    for benchmark_symbol in benchmark_monthly_returns.columns:
        benchmark_returns = benchmark_monthly_returns[benchmark_symbol]

        # Calculate average returns for positive and negative benchmark months
        positive_benchmark_months = benchmark_returns[benchmark_returns > 0]
        negative_benchmark_months = benchmark_returns[benchmark_returns <= 0]

        avg_positive_benchmark_return = positive_benchmark_months.mean() * 100
        avg_negative_benchmark_return = negative_benchmark_months.mean() * 100

        avg_positive_asset_return = (
            asset_monthly_returns.loc[positive_benchmark_months.index].mean() * 100
        ).item()  # Convert to scalar
        avg_negative_asset_return = (
            asset_monthly_returns.loc[negative_benchmark_months.index].mean() * 100
        ).item()  # Convert to scalar

        results.append(
            {
                "asset": benchmark_symbol,
                "returns": [
                    {
                        "return_type": "Average Monthly Positive Return",
                        "Asset": "Portfolio",
                        "Percentage": avg_positive_asset_return,
                    },
                    {
                        "return_type": "Average Monthly Negative Return",
                        "Asset": "Portfolio",
                        "Percentage": avg_negative_asset_return,
                    },
                    {
                        "return_type": "Average Monthly Positive Return",
                        "Asset": benchmark_symbol,
                        "Percentage": avg_positive_benchmark_return,
                    },
                    {
                        "return_type": "Average Monthly Negative Return",
                        "Asset": benchmark_symbol,
                        "Percentage": avg_negative_benchmark_return,
                    },
                ],
            }
        )

    return results
