from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass

class AuctionListing(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField()
    start_bid = models.DecimalField(max_digits=10, decimal_places=2)
    image_url = models.URLField(blank=True, null=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="listings")
    
