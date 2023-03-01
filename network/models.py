from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

class User(AbstractUser):
    pass

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    user_name = models.CharField(max_length=50, blank=True, default="")
    following = models.ManyToManyField("self", symmetrical=False, related_name="followed_by")
    banner_image = models.ImageField(null=True, blank=True, upload_to="images/")
    avatar = models.ImageField(null=True, blank=True, upload_to="images/")

    def __str__(self):
        return self.user_name

    def save(self, *args, **kwargs):
        """override the empty user_name with User.username"""
        if not self.user_name:
            self.user_name = self.user.username
        super(Profile, self).save(*args, **kwargs)
    
@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

class Post(models.Model):
    id = models.AutoField(primary_key=True)
    poster = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    content = models.CharField(max_length=200, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    likes = models.ManyToManyField(User, related_name="has_liked") # a post can be liked by multiple users, and a user has multiple liked posts
    saved_by = models.ManyToManyField(User, related_name="has_saved") 

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.content

class Comment(models.Model):
    id = models.AutoField(primary_key=True)
    content = models.CharField(max_length=500, default='')
    author = models.ForeignKey(User, blank=True, on_delete=models.CASCADE, related_name="comments")
    post = models.ForeignKey(Post, blank=True, on_delete=models.CASCADE, related_name="comments")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.content