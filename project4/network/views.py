from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render, get_object_or_404
from django.urls import reverse
from django.views.decorators.http import require_http_methods, require_POST
from django.core.paginator import Paginator

from .models import User, Post


def index(request):
    posts = Post.objects.all().order_by('-timestamp')
    paginator = Paginator(posts, 10)  # Show 10 posts per page
    
    page_number = request.GET.get('page', 1)
    posts = paginator.get_page(page_number)

    return render(request, "network/index.html", {
        "posts": posts,
        "page_type": "index"
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
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


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
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
    
@login_required
@require_http_methods(["POST"])
def create_post(request):
    content = request.POST.get("content", "").strip()
    image = request.FILES.get("image")

    if not content:
        return JsonResponse({"error": "Post content is required."}, status=400)
    
    try:
        post = Post.objects.create(
            user=request.user,
            content=content,
            image=image
        )
            
     # If it's an AJAX request, return JSON response
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                "success": True,
                "post": {
                    "id": post.id,
                    "content": post.content,
                    "image_url": post.image.url if post.image else None,
                    "timestamp": post.timestamp.strftime("%b %d %Y, %I:%M %p"),
                    "user": post.user.username
                }
            })
        
        # If it's a regular form submission, redirect to index
        return HttpResponseRedirect(reverse("index"))
        
    except Exception as e:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({"error": str(e)}, status=400)
        return HttpResponseRedirect(reverse("index"))

def profile(request, username):
    profile_user = get_object_or_404(User, username=username)

    posts = Post.objects.filter(user=profile_user).order_by('-timestamp')
    paginator = Paginator(posts, 10)
    
    page_number = request.GET.get('page', 1)
    posts = paginator.get_page(page_number)

    followers_count = profile_user.followers.count()
    following_count = profile_user.following.count()

    is_following = False
    if request.user.is_authenticated:
        is_following = profile_user.followers.filter(id=request.user.id).exists()

    return render(request, "network/profile.html", {
        "profile_user": profile_user,
        "posts": posts,
        "followers_count": followers_count,
        "following_count": following_count,
        "is_following": is_following,
    })

@login_required
@require_POST
def toggle_follow(request, username):       
    profile_user = get_object_or_404(User, username=username)
    
    # Users can't follow themselves
    if request.user == profile_user:
        return JsonResponse({"error": "Cannot follow yourself"}, status=400)
        
    if profile_user.followers.filter(id=request.user.id).exists():
        # Unfollow
        profile_user.followers.remove(request.user)
        is_following = False
    else:
        # Follow
        profile_user.followers.add(request.user)
        is_following = True
        
    return JsonResponse({
        "is_following": is_following,
        "followers_count": profile_user.followers.count()
    })


@login_required
def following(request):
    following_users= request.user.following.all()
    posts = Post.objects.filter(user__in=following_users).order_by('-timestamp')
    paginator = Paginator(posts, 10)
    
    page_number = request.GET.get('page', 1)
    posts = paginator.get_page(page_number)

    return render(request, "network/index.html", {
        "posts": posts,
        "page_type": "following"
    })


@login_required
@require_http_methods(["POST"])
def edit_post(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    
    # Ensure the user can only edit their own posts
    if post.user != request.user:
        return JsonResponse({"error": "Cannot edit other users' posts"}, status=403)
    
    data = request.POST.get("content", "").strip()
    if not data:
        return JsonResponse({"error": "Post content is required"}, status=400)
        
    post.content = data
    post.save()
    
    return JsonResponse({
        "success": True,
        "content": post.content,
        "timestamp": post.timestamp.strftime("%b %d %Y, %I:%M %p")
    })


@login_required
@require_POST
def toggle_like(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    
    if request.user in post.likes.all():
        post.likes.remove(request.user)
        liked = False
    else:
        post.likes.add(request.user)
        liked = True
        
    return JsonResponse({
        "liked": liked,
        "likes_count": post.likes.count()
    })