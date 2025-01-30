from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.contrib import messages

from .models import User, AuctionListing, Bid, Comment
from .forms import CreateListingForm, BidForm, CommentForm

def index(request):
    active_listings= AuctionListing.objects.filter(is_active=True)

    return render(request, "auctions/index.html", {
        "listings": active_listings,
        
    })


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "auctions/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "auctions/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "auctions/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "auctions/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "auctions/register.html")

@login_required
def create_listing(request):
    if request.method =="POST":
        form = CreateListingForm(request.POST)
        if form.is_valid():
            listing = form.save(commit=False)
            listing.owner = request.user
            listing.save()
            return redirect('index')
    else:
        form = CreateListingForm()
    return render(request, "auctions/create_listing.html", {
        "form": form
    })

def listing(request, listing_id):
    listing = get_object_or_404(AuctionListing, id=listing_id)
    comments = listing.comments.all()
    current_user = request.user
    is_in_watchlist = current_user.is_authenticated and listing in current_user.watchlist.all()


    if request.method == "POST":
       if "place_bid" in request.POST:
        bid_form = BidForm(request.POST)
        if bid_form.is_valid():
            amount = bid_form.cleaned_data['amount']
            if amount < listing.current_price():
                messages.error(request, "Your bid must be higher than the current price.")
            else:
                Bid.objects.create(listing=listing, bidder=current_user, amount=amount)
                messages.success(request, "Bid placed successfully!")
                return redirect("listing", listing_id=listing.id)
        elif "add_comment" in request.POST:
            comment_form = CommentForm(request.POST)
            if comment_form.is_valid():
                text = comment_form.cleaned_data['text']
                Comment.objects.create(listing=listing, commenter=current_user, text=text)
                messages.success(request, "Comment added successfully!")
                return redirect("listing", listing_id=listing.id)
        elif "watchlist_action" in request.POST:
            if is_in_watchlist:
                current_user.watchlist.remove(listing)
                messages.success(request, "Removed from watchlist.")
            else:
                current_user.watchlist.add(listing)
                messages.success(request, "Added to watchlist.")
            return redirect("listing", listing_id=listing.id)
        elif "close_auction" in request.POST:
            if listing.owner == current_user:
                listing.is_active = False
                listing.save()
                messages.success(request, "Auction closed!")
                return redirect("listing", listing_id=listing.id)
            

    bid_form = BidForm()
    comment_form = CommentForm()
    return render(request, "auctions/listing.html", {
        "listing": listing,
        "comments": comments,
        "bid_form": bid_form,
        "comment_form": comment_form,
        "is_in_watchlist": is_in_watchlist
    })

