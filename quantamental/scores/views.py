import json

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
        "dividendYield"
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
