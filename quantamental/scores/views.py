import json
import pprint
from datetime import datetime

from django import forms
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.shortcuts import render
from django.urls import reverse_lazy
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import (
    CreateView,
    DeleteView,
    DetailView,
    ListView,
    UpdateView,
)

from . import models
from .forms import UserRegisterForm
from .utils import (
    calculate_drawdown,
    calculate_monthly_returns,
    calculate_performance_metrics,
    calculate_portfolio_performance,
    calculate_rolling_beta,
    calculate_rolling_return,
    calculate_top_drawdowns,
    filter_performance,
)


@login_required
def table_view(request):
    context = {"view_name": "table"}
    return render(
        request=request,
        template_name="scores/table_view.html",
        context=context,
    )


@login_required
def table_view_data(request):
    default_columns = [
        "code__code",
        "code__isin",
        "code__name",
        "sector",
        "industry",
        "gicSector",
        "gicGroup",
        "gicIndustry",
        "gicSubIndustry",
    ]
    data = list(models.Sector.objects.values(*default_columns))
    return JsonResponse(data, safe=False)


@login_required
def table_view_data_2(request):
    default_columns = ["code", "isin", "name"]
    data = list(models.Identification.objects.values(*default_columns))
    return JsonResponse(data, safe=False)


@login_required
def pf_view(request):
    return render(request=request, template_name="scores/pf_view.html")


@login_required
def scores_view(request):
    context = {"user": request.user}
    print(context)
    return render(
        request=request, template_name="scores/scores_view.html", context=context
    )


@login_required
def single_stock_view(request):
    context = {"view_name": "single_stock"}
    return render(
        request=request,
        template_name="scores/single_stock_view.html",
        context=context,
    )


@login_required
def single_stock_view_data_1(request):
    default_columns = [
        "description",
    ]
    ticker = request.GET.get("ticker")
    print(ticker)
    data = list(models.Qualdata.objects.filter(ticker=ticker).values(*default_columns))
    return JsonResponse(data, safe=False)


@login_required
def single_stock_view_data_2(request):
    default_columns = [
        "name",
        "ticker",
        "exchange",
        "sector",
        "beta",
        "mcap",
        "dividendYield",
    ]
    ticker = request.GET.get("ticker")
    data = list(models.Qualdata.objects.filter(ticker=ticker).values(*default_columns))
    return JsonResponse(data, safe=False)


@login_required
def vis_view(request):
    context = {
        "products": models.Product.objects.all(),
        "headers": ["Product", "Category", "Price"],
        "headersl": ["product", "category", "price"],
    }
    return render(
        request=request,
        template_name="scores/vis_view.html",
        context=context,
    )


# FORMS:
class SignUpView(CreateView):
    form_class = UserRegisterForm
    success_url = reverse_lazy("login")
    template_name = "registration/signup.html"


# ! PORTFOLIO PART


@login_required
def performance(request):
    data = list(models.Performance.objects.values())
    return JsonResponse(data, safe=False)


@login_required
def pf_view_aggregated_performance(request):
    symbol = request.GET.getlist("ticker[]", [])
    weights = json.loads(request.GET.get("weights", "[]"))  # Parse weights

    asset_performance = list(
        models.Performance.objects.filter(symbol__in=symbol).values()
    )

    portfolio_performance = calculate_portfolio_performance(weights, asset_performance)

    return JsonResponse(portfolio_performance, safe=False)


@login_required
def pf_view_asset_performance(request):
    symbol = request.GET.getlist("ticker[]", [])

    asset_performance = list(
        models.Performance.objects.filter(symbol__in=symbol).values()
    )

    return JsonResponse(asset_performance, safe=False)


@login_required
def pf_view_performance(request):

    #    ! GET DATA --------------------------------------------------------------------------
    portfolio_performance = None  # Initialize portfolio performance to None
    asset_symbol = request.GET.getlist(
        "assetTicker[]", []
    )  # Get asset tickers from the request

    from_date = request.GET.get("fromDate")
    to_date = request.GET.get("toDate")

    print(from_date, to_date)

    asset_performance = list(
        models.Performance.objects.filter(symbol__in=asset_symbol).values()
    )  # Retrieve performance data for the specified asset tickers

    # Convert the from_date and to_date to datetime objects
    from_date = datetime.strptime(from_date.strip('"'), "%Y-%m-%d")
    to_date = datetime.strptime(to_date.strip('"'), "%Y-%m-%d")

    asset_performance = filter_performance(asset_performance, from_date, to_date)
    pp = pprint.PrettyPrinter(indent=4)
    pp.pprint(asset_performance)

    asset_weights_param = request.GET.get(
        "assetWeights"
    )  # Get asset weights from the request
    if asset_weights_param:
        try:
            asset_weights = json.loads(
                asset_weights_param
            )  # Parse asset weights from JSON
            portfolio_performance = calculate_portfolio_performance(
                asset_weights, asset_performance, "Portfolio"
            )  # Calculate portfolio performance based on asset weights and performance data
        except (json.JSONDecodeError, ValueError) as e:
            return JsonResponse(
                {"error": "Invalid weights format"}, status=400
            )  # Return error if weights format is invalid

    bm_performance = None  # Initialize benchmark performance to None
    bm_symbol = request.GET.getlist(
        "bmTicker[]", []
    )  # Get benchmark tickers from the request
    bm_performance = list(
        models.Performance.objects.filter(symbol__in=bm_symbol).values()
    )  # Retrieve performance data for the specified benchmark tickers

    bm_performance = filter_performance(bm_performance, from_date, to_date)

    # Ensure that bm_performance has the same "date" as portfolio_performance
    if portfolio_performance and bm_performance:
        portfolio_dates = {entry["date"] for entry in portfolio_performance}
        bm_performance = [
            entry for entry in bm_performance if entry["date"] in portfolio_dates
        ]

    bm_weights_param = request.GET.get(
        "bmWeights"
    )  # Get benchmark weights from the request
    if bm_weights_param:
        try:
            bm_weights = json.loads(
                bm_weights_param
            )  # Parse benchmark weights from JSON
            bm_performance = calculate_portfolio_performance(
                bm_weights, bm_performance, "Benchmark"
            )  # Calculate benchmark performance based on weights and performance data
        except (json.JSONDecodeError, ValueError) as e:
            return JsonResponse(
                {"error": "Invalid weights format"}, status=400
            )  # Return error if weights format is invalid

    pf_bm_performance = portfolio_performance + bm_performance

    #    ! Run Computation --------------------------------------------------------------------------

    pf_bm_rolling_return = calculate_rolling_return(pf_bm_performance)

    portfolio_rolling_return = calculate_rolling_return(portfolio_performance)
    asset_rolling_return = calculate_rolling_return(asset_performance)

    portfolio_drawdown = calculate_drawdown(portfolio_performance)
    benchmark_drawdown = calculate_drawdown(bm_performance)
    combined_drawdown = portfolio_drawdown + benchmark_drawdown

    portfolio_top_drawdowns = calculate_top_drawdowns(portfolio_performance)
    benchmark_top_drawdowns = calculate_top_drawdowns(bm_performance)

    portfolio_rolling_beta = calculate_rolling_beta(
        portfolio_performance, bm_performance
    )

    asset_rolling_beta = calculate_rolling_beta(asset_performance, bm_performance)

    combined_performance = portfolio_performance + asset_performance
    performance_metrics = calculate_performance_metrics(
        combined_performance, bm_performance
    )

    monthly_returns = calculate_monthly_returns(portfolio_performance, bm_performance)

    # Combine both results in a single response
    response_data = {
        "asset_performance": asset_performance,
        "portfolio_performance": pf_bm_performance,  # This will be None if no weights are provided
        "pf_bm_rolling_return": pf_bm_rolling_return,
        "asset_rolling_return": asset_rolling_return,
        "portfolio_drawdown": combined_drawdown,
        "portfolio_top_drawdowns": portfolio_top_drawdowns,
        "benchmark_top_drawdowns": benchmark_top_drawdowns,
        "portfolio_rolling_beta": portfolio_rolling_beta,
        "asset_rolling_beta": asset_rolling_beta,
        "performance_metrics": performance_metrics,
        "monthly_returns": monthly_returns,
    }
    return JsonResponse(response_data, safe=False)
