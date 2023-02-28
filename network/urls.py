
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"), 
    path("following/<int:user_id>", views.following_view, name="following"), 
    path("saved/<int:user_id>", views.saved_view, name="saved"), 
    path("make_new_post", views.make_new_post, name="make_new_post"), 
    path("profile/<int:profile_owner_id>", views.profile_view, name="profile"), 
    path("edit_profile", views.edit_profile, name="edit_profile"), 
    path("update_follow_status/<str:user_has_followed>", views.update_follow_status, name="update_follow_status"), 

    # API
    path("load_comments/<int:post_id>", views.load_comments, name="load_comments"), 
    path("save_change_to_post/<int:post_id>", views.save_change_to_post, name="save_change_to_post"), 
    path("save_change_to_comment/<int:comment_id>", views.save_change_to_comment, name="save_change_to_comment"), 
    path("delete_post/<int:post_id>", views.delete_post, name="delete_post"), 
    path("update_like_status/<int:post_id>", views.update_like_status, name="update_like_status"), 
    path("update_save_status/<int:post_id>", views.update_save_status, name="update_save_status"), 
    path("make_comment/<int:post_id>", views.make_comment, name="make_comment"), 
    path("delete_comment/<int:comment_id>", views.delete_comment, name="delete_comment")
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
