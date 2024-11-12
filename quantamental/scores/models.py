# Create your models here.
import csv

from django.contrib.auth.models import User
from django.db import models


class Identification(models.Model):
    code = models.CharField(max_length=200, null=True)
    name = models.CharField(max_length=200, null=True)
    isin = models.CharField(max_length=200, null=True)

    def __str__(self):
        return self.code


class Sector(models.Model):
    code = models.ForeignKey(Identification, null=True, on_delete=models.CASCADE)
    sector = models.CharField(max_length=200, null=True)
    industry = models.CharField(max_length=200, null=True)
    gicSector = models.CharField(max_length=200, null=True)
    gicGroup = models.CharField(max_length=200, null=True)
    gicIndustry = models.CharField(max_length=200, null=True)
    gicSubIndustry = models.CharField(max_length=200, null=True)

    def __str__(self):
        return self.code.code


class Qualdata(models.Model):
    ticker = models.CharField(max_length=200, null=True)
    name = models.CharField(max_length=200, null=True)
    description = models.CharField(max_length=500, null=True)
    exchange = models.CharField(max_length=200, null=True)
    sector = models.CharField(max_length=200, null=True)
    beta = models.FloatField(null=True)
    mcap = models.FloatField(null=True)
    dividendYield = models.FloatField(null=True)

    def __str__(self):
        return self.ticker


class Customer(models.Model):
    user = models.OneToOneField(User, null=True, blank=True, on_delete=models.CASCADE)
    profile_pic = models.ImageField(default="default.jpg")
    name = models.CharField(
        max_length=200, null=True
    )  # null=True means that the field can be empty
    phone = models.CharField(max_length=200, null=True)
    email = models.CharField(max_length=200, null=True)
    date_created = models.DateTimeField(
        auto_now_add=True, null=True
    )  # auto_now_add=True means that the date will be added automatically when the object is created

    def __str__(self):
        return self.name


class Tag(models.Model):
    name = models.CharField(max_length=200, null=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    CATEGORY = (("Indoor", "Indoor"), ("Outdoor", "Outdoor"))
    category = models.CharField(max_length=200, null=True, choices=CATEGORY)
    name = models.CharField(max_length=200, null=True)
    price = models.FloatField(null=True)
    description = models.CharField(max_length=200, null=True)
    date_created = models.DateTimeField(auto_now_add=True, null=True)
    tags = models.ManyToManyField(Tag)

    def __str__(self):
        return self.name


class Order(models.Model):
    STATUS = (
        ("Pending", "Pending"),
        ("Out for delivery", "Out for delivery"),
        ("Delivered", "Delivered"),
    )
    status = models.CharField(max_length=200, null=True, choices=STATUS)
    customer = models.ForeignKey(Customer, null=True, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, null=True, on_delete=models.CASCADE)
    date_created = models.DateTimeField(auto_now_add=True, null=True)
    note = models.CharField(max_length=100, null=True)

    def __str__(self):
        return f"From: [{self.customer.name}] Product: [{self.product.name}]"
