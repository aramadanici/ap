import numpy as np
import pandas as pd


def calculate_portfolio_performance(weights, asset_timeseries):
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
                "symbol": "Portfolio",
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
