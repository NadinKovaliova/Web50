
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("create_post", views.create_post, name="create_post"),
    path("profile/<str:username>", views.profile, name="profile"),
    path("toggle_follow/<str:username>", views.toggle_follow, name="toggle_follow"),
    path("following", views.following, name="following"),
    path("posts/<int:post_id>/edit", views.edit_post, name="edit_post"),
    path("posts/<int:post_id>/toggle_like", views.toggle_like, name="toggle_like")
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
