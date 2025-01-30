from django import forms
from .models import AuctionListing

class CreateListingForm(forms.ModelForm) :
    class Meta :
        model = AuctionListing
        fields = [ 'title', 'description', 'start_bid', 'image_url', 'category']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control'}),
            'start_bid': forms.NumberInput(attrs={'class': 'form-control'}),
            'image_url': forms.URLInput(attrs={'class': 'form-control'}),
            'category': forms.Select(attrs={'class': 'form-control', 'placeholder': 'Optional'}),
        }
        label = {
            'image_url': 'Image URL',
            'start_bid': 'Starting Bid',
        }


class BidForm(forms.Form):
    amount = forms.DecimalField(
        max_digits=10,
        decimal_places=2,
        widget=forms.NumberInput(attrs={'class': 'form-control'}),
        label="Place your bid"
    )

class CommentForm(forms.Form):
    text = forms.CharField(
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        label="Add a comment"
    )
