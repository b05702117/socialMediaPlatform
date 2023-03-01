import json
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.core.paginator import Paginator
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect

from .models import User, Profile, Post, Comment
from .forms import profileForm


POST_PER_PAGE = 10

def get_paginated_results(request, object_list, per_page):
    """utility function to returns the paginated results"""
    
    paginator = Paginator(object_list, per_page)
    page_number = request.GET.get('page') # Get the current page number from the request

    return paginator.get_page(page_number)

def add_attributes_to_post(request, posts_list):
    """
    utility function to add attributes to each post
    since list is mutable object, the function won't create a new object
    """

    for post in posts_list:
        # add the number of like to this post
        post.like_count = post.likes.count()
        # add the number of comments to this post
        post.comment_count = post.comments.count()

        # variable to indicate whether current user has liked this post 
        if request.user.is_authenticated:
            post.user_has_liked = request.user in post.likes.all()
            post.user_has_saved = request.user in post.saved_by.all()
        else:
            post.user_has_liked = False
            post.user_has_saved = False
    
    return 

def index(request):
    """default page that display all posts in the database"""

    posts_list = Post.objects.all()
    # add attributes to each post object, which can be accessed in the HTML template
    add_attributes_to_post(request, posts_list)

    # pagination
    page_obj = get_paginated_results(request, posts_list, POST_PER_PAGE)

    return render(request, "network/index.html", {
        "all_posts": posts_list, 
        "page_obj": page_obj
    })

def profile_view(request, profile_owner_id):
    """function to render a user's profile and all of his/her posts"""

    current_user = request.user
    current_user_profile = current_user.profile
    profile_owner = User.objects.get(id=profile_owner_id)
    profile_owner_profile = profile_owner.profile
    posts_list = profile_owner.posts.all()

    # add attributes to each post object, which can be accessed in my HTML template
    add_attributes_to_post(request, posts_list)

    # following_list and followers_list of the profile_owner
    following_list = profile_owner_profile.following.all()
    followers_list = profile_owner_profile.followed_by.all()

    # pagination
    page_obj = get_paginated_results(request, posts_list, POST_PER_PAGE)

    # check whether current user has followed profile owner
    user_has_followed = False
    # exception handler if current user does not logged in
    try:
        if current_user_profile in followers_list:
            user_has_followed = True
    except:
        pass

    return render(request, "network/profile.html", {
        "profile_owner": profile_owner, 
        "profile": profile_owner_profile, 
        "page_obj": page_obj, 
        "followers_cnt": len(followers_list), 
        "following_cnt": len(following_list), 
        "post_cnt": len(posts_list), 
        "user_has_followed": user_has_followed
    })

def edit_profile(request):
    if request.method == "POST":
        user = request.user
        user_profile = user.profile

        # Update user name for the profile
        user_name = request.POST.get('user-name')
        if user_name:
            user_profile.user_name = user_name

        # Update background image
        banner_img = request.FILES.get('banner-img')
        if banner_img:
            if user_profile.banner_image:
                user_profile.banner_image.delete()
            user_profile.banner_image = banner_img

        # Update avatar
        avatar = request.FILES.get('avatar')
        if avatar:
            if user_profile.avatar:
                user_profile.avatar.delete()
            user_profile.avatar = avatar

        user_profile.save()

        return HttpResponseRedirect(reverse('profile', args=[user.id]))

    return HttpResponseRedirect(reverse('profile', args=[user.id]))

def following_view(request, user_id):
    """render all the posts posted by user that the current user is following"""
    current_user = request.user
    current_user_profile = current_user.profile

    # filter all posts posted by user that the current user is following
    following_users_profiles = current_user_profile.following.all()
    following_users = following_users_profiles.values_list('user', flat=True)
    following_post_list = Post.objects.filter(poster__in=following_users)
    # 是不是關於user的都直接改為profile了

    # add attributes to each post object, which can be accessed in my HTML template
    add_attributes_to_post(request, following_post_list)

    # pagination
    page_obj = get_paginated_results(request, following_post_list, POST_PER_PAGE)

    return render(request, "network/following.html", {
        "page_obj": page_obj
    })

def saved_view(request, user_id):
    """render all saved posts"""
    current_user = request.user
    current_user_profile = current_user.profile

    saved_post_list = current_user.has_saved.all()

    # add attributes to each post object, which can be accessed in my HTML template
    add_attributes_to_post(request, saved_post_list)

    # pagination
    page_obj = get_paginated_results(request, saved_post_list, POST_PER_PAGE)

    return render(request, "network/saved.html", {
        "page_obj": page_obj
    })

def make_new_post(request):
    """function that allow user to make new post"""

    if request.method == "POST":
        post_content = request.POST["post_content"].strip()

        # prevent empty post 
        if not post_content:
            # 還沒想到怎麼redirect to index view
            posts_list = Post.objects.all()
            add_attributes_to_post(request, posts_list)
            page_obj = get_paginated_results(request, posts_list, POST_PER_PAGE)

            return render(request, "network/index.html", {
                "all_posts": posts_list, 
                "page_obj": page_obj, 
                "error_message": "Post content cannot be empty."
            })
        
        newPost = Post(
            poster = request.user, 
            content = post_content
        )
        newPost.save()

        return HttpResponseRedirect(reverse(index)) 

def update_follow_status(request, user_has_followed):
    """allow current user to follow/unfollow the profile owner"""

    if request.method == "POST":
        current_user = request.user
        current_user_profile = current_user.profile
        profile_owner = User.objects.get(id=request.POST["profile_owner_id"])
        profile_owner_profile = profile_owner.profile

        user_has_followed = user_has_followed == "True"
        # unfollow if current user has already followed the profile owner
        if user_has_followed:
            current_user_profile.following.remove(profile_owner_profile)
        # follow if current user hasn't followed the profile owner
        else:
            current_user_profile.following.add(profile_owner_profile)

        current_user_profile.save()

        return HttpResponseRedirect(reverse(profile_view, kwargs={"profile_owner_id": profile_owner.id}))

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
def save_change_to_post(request, post_id):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)
    
    data = json.loads(request.body)
    post = Post.objects.get(id=post_id)
    post.content = data["content"]
    post.save()

    return JsonResponse({"success": True, "newContent": data["content"]})

@login_required
def delete_post(request, post_id):
    """API that allows user to delete their post"""
    if request.method == "DELETE":
        post = Post.objects.get(id=post_id)

        if request.user != post.poster:
            return(redirect(index))

        post.delete()

        return HttpResponseRedirect(reverse(index))
    
    return JsonResponse({"error": "DELETE request required."}, status=400)

@login_required
def update_like_status(request, post_id):
    """API that allows user to like/unlike the post"""

    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    post = Post.objects.get(id=post_id)
    data = json.loads(request.body)
    user_has_liked = data["userHasLiked"]

    if user_has_liked:
        post.likes.remove(request.user)
        user_has_liked = False
    else:
        post.likes.add(request.user)
        user_has_liked = True
    
    return JsonResponse({"success": True, "likeCount": post.likes.count(), "userHasLiked": user_has_liked})

@login_required
def update_save_status(request, post_id):
    """API that allows user to save the post"""

    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)
    
    post = Post.objects.get(id=post_id)
    data = json.loads(request.body)
    user_has_saved = data["userHasSaved"]

    if user_has_saved:
        post.saved_by.remove(request.user)
        user_has_saved = False
    else:
        post.saved_by.add(request.user)
        user_has_saved = True
    
    return JsonResponse({"success": True, "saveCount": post.saved_by.count(), "userHasSaved": user_has_saved})

def user_serializer(user):
    """convert Djangal User object into dict format that can be parsed into JSON format"""
    return {"id": user.id, "username": user.username, "profile_name": user.profile.user_name, "email": user.email}

def profile_serializer(user):
    profile = user.profile
    avatar_url = profile.avatar.url if profile.avatar else None
    return {"avatar_url": avatar_url}

def load_comments(request, post_id):
    if request.method != "GET":
        return JsonResponse({"error": "Invalid request method"})

    post = Post.objects.get(id=post_id)
    comments = post.comments.all()
    comment_list = [
        {
            "id": comment.id, 
            "author": user_serializer(comment.author), 
            "author_profile": profile_serializer(comment.author), 
            "content": comment.content, 
            "created_at": comment.created_at
        }
        for comment in comments
    ]

    return JsonResponse({"comments": comment_list})

@login_required
def make_comment(request, post_id):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    post = Post.objects.get(id=post_id)
    data = json.loads(request.body)
    new_comment = Comment(
        author = request.user, 
        content = data['comment'], 
        post = post
    )
    new_comment.save()

    return JsonResponse({
        "success": True, 
        "author": user_serializer(request.user), 
        "content": new_comment.content, 
        "created_at": new_comment.created_at, 
        "comment_count": post.comments.count()
    })

@login_required
def save_change_to_comment(request, comment_id):
    """API that allows user to save their change to the comment"""
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    data = json.loads(request.body)
    comment = Comment.objects.get(id=comment_id)
    comment.content = data["content"]
    comment.save()

    return JsonResponse({"message": "Comment updated", "newContent": data["content"]})   

@login_required
def delete_comment(request, comment_id):
    """API that allows user to delete their comment"""
    if request.method == "DELETE":
        comment = Comment.objects.get(id=comment_id)
        comment.delete()

        return JsonResponse({'success': True})
    
    return JsonResponse({"error": "DELETE request required."}, status=400)