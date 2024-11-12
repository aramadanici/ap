from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User

from . import models


class UserRegisterForm(UserCreationForm):
    email = forms.EmailField(widget=forms.EmailInput(attrs={"class": "form-control"}))

    class Meta:
        model = User
        fields = ("username", "password1", "password2", "email")

    def __init__(self, *args, **kwargs):
        super(UserRegisterForm, self).__init__(*args, **kwargs)

        self.fields["username"].widget.attrs["class"] = "form-control"
        self.fields["password1"].widget.attrs["class"] = "form-control"
        self.fields["password2"].widget.attrs["class"] = "form-control"
        self.fields["email"].widget.attrs["class"] = "form-control"
