from django.contrib import admin

from .models import *

# Register your models here.
admin.site.register(Customer)
admin.site.register(Order)
admin.site.register(Product)
admin.site.register(Tag)
admin.site.register(Identification)
admin.site.register(Sector)
admin.site.register(Qualdata)
