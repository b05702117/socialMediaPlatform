# Django-based Social Media Platform 

This is a Twitter-like social media platform built with Django, JavaScript, and Bootstrap. It allows users to create posts, comment on posts, follow other users, upload avatar/banner image, and etc.

![Alt Text](./demo/overview.gif)

## Key features

- **Post Creation:** Users can create new posts by typing a message and clicking the "Post" button. Posts are displayed in chronological order on the home page. 
![Alt Text](./demo/post%20creation.gif)
- **Commenting:** Users can access the comments section by clicking on the "Comment" button located below each post. This will open up a comment modal that displays all the comments made to that post in chronological order. Users can participate in the conversation by adding their own comments at the bottom of the comment modal 
![Alt Text](./demo/commenting.gif)
- **Following:** Users can follow other users by clicking the "Follow" button on a user's profile page. Posts from followed users are displayed on the home page.
![Alt Text](./demo/following.gif)
- **Image Uploads:** Users can upload images to customize their avatar and the banner of their profile page.
![Alt Text](./demo/edit_profile.gif)

## Usage

1. Clone the project repository to your local directory using the following command:
```bash
git clone https://github.com/yupaotu/socialMediaPlatform.git
```

2. In your terminal, `cd` into the directory where you clone the project.

3. Run `python manage.py makemigrations network` to make migrations for the `network` app.

4. Run `python manage.py migrate` to apply migrations to your database.

5. (Optional) Create a superuser account to access the admin interface:
```bash
python manage.py createsuperuser
```

6. Start the development server:
```bash
python manage.py runserver
``` 
7. Open your web browser and visit http://localhost:8000 to access the application.


<!-- ## Technologies used

- **Framework:** Utilized Django 
- **Responsive:**
- **User Interface:** -->
