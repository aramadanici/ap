from django.urls import path

from . import views

app_name = "scores"

urlpatterns = [
    path(route="signup/", view=views.SignUpView.as_view(), name="signup_view"),
    path(route="scores/", view=views.scores_view, name="scores_view"),
    path(route="stock/", view=views.single_stock_view, name="single_stock_view"),
    path(
        route="stockdata1/",
        view=views.single_stock_view_data_1,
        name="single_stock_view_data_1",
    ),
    path(
        route="stockdata2/",
        view=views.single_stock_view_data_2,
        name="single_stock_view_data_2",
    ),
    path(route="table/", view=views.table_view, name="table_view"),
    path(route="data/", view=views.table_view_data, name="table_data"),
    path(route="data2/", view=views.table_view_data_2, name="table_data2"),
    path(route="pf/", view=views.pf_view, name="pf_view"),
]
