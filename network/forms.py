from django import forms
from django.forms import ModelForm, FileInput

from .models import Profile

class profileForm(ModelForm):
    class Meta:
        model = Profile
        fields = ["banner_image"]
        widgets = {
            "banner_image": FileInput(attrs={
                "class": "form-control"
            })
        }