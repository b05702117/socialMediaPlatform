document.addEventListener('DOMContentLoaded', function() {
    // get the current user
    if (currentUserId) {
        console.log(`current user id: ${currentUserId}`);
    }

    // handle user's comment for each post
    const commentForm = document.querySelector('#comment-form');
    commentForm.addEventListener('submit', function(event) {
        // prevent the default behavior of reloading the page when form is submitted
        event.preventDefault();
        makeComment(commentForm);
    });

    const posts = document.querySelectorAll('.post-item');
    posts.forEach(post =>{
        const postId = post.dataset.postId;
        // console.log(postId);

        const editButton = post.querySelector(`#post-edit-button-${postId}`);
        // handler to deal with the case when post does not have editButton
        if (editButton) {
            editButton.addEventListener('click', function() {
                editPostView(post);
            })
        }

        const deleteButton = post.querySelector(`#post-delete-button-${postId}`);
        if (deleteButton) {
            deleteButton.addEventListener('click', function() {
                deletePost(postId);
            })
        }

        const likeUnlikeButton = post.querySelector(`#like-unlike-button-${postId}`);
        likeUnlikeButton.addEventListener('click', function() {
            updateLikeStatus(post);
        })

        const saveUnsaveButton = post.querySelector(`#save-unsave-button-${postId}`);
        saveUnsaveButton.addEventListener('click', function() {
            updateSaveStatus(post);
        })

        const commentButton = post.querySelector(`#post-comment-button-${postId}`);
        commentButton.addEventListener('click', function() {
            // Update the data-post-id attribute of the comment form
            const commentForm = document.querySelector('#comment-form');
            commentForm.setAttribute('data-post-id', postId);
            
            displayComments(postId);
        })

        const commentCountButton = post.querySelector(`#post-comment-count-${postId}`);
        commentCountButton.addEventListener('click', function() {
            // Update the data-post-id attribute of the comment form
            const commentForm = document.querySelector('#comment-form');
            commentForm.setAttribute('data-post-id', postId);
            
            displayComments(postId);
        })
    })
})

function getCookie(name) {
    // Reference: https://stackoverflow.com/questions/10730362/get-cookie-by-name
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function deletePost(postId) {
    console.log(`delete button of post id: ${postId} has been clicked!`);

    const deleteModal = document.querySelector('#delete-modal');
    const deleteButtonInModal = deleteModal.querySelector('#delete-button-modal');

    deleteButtonInModal.addEventListener('click', function() {
        console.log('delete button in modal clicked!');
        console.log(deleteButtonInModal);

        // Use fetch to send a DELETE request to the back-end
        fetch(`/delete_post/${postId}`, {
            method: 'DELETE', 
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => {
            if (response.ok) {
                // If the response is successful, reload the page
                window.location.reload(true);
            } else {
                console.error('An error occurred while trying to delete the post');
            }
        })
        .catch(error => console.error(error));
    })
}

function editPostView(post) {
    const postId = post.dataset.postId;
    const contentContainer = post.querySelector('.post-content-container');

    console.log(`edit button of post id: ${postId} has been clicked!`);

    // replace the post content with a textarea that allow user to edit their post
    const postContent = post.querySelector('#post-content-' + postId);
    postContent.classList.add('hidden');
    
    const textArea = document.createElement('textarea');
    textArea.classList.add('form-control');
    textArea.value = postContent.innerHTML;
    contentContainer.appendChild(textArea);

    // replace the edit button with a save button
    const editButton = post.querySelector('#post-edit-button-' + postId);
    const deleteButton = post.querySelector('#post-delete-button-' + postId);
    editButton.classList.add('hidden');
    deleteButton.classList.add('hidden');

    const saveButton = document.createElement('button');
    saveButton.innerHTML = 'Save';
    saveButton.classList.add('btn', 'btn-link', 'btn-sm');
    post.querySelector('.button-wrap').appendChild(saveButton);

    saveButton.addEventListener('click', function() {
        saveChangeToPost(postId, postContent, textArea);
        saveButton.remove();
        editButton.classList.remove("hidden");
        deleteButton.classList.remove("hidden");
    })
}

function saveChangeToPost(postId, postContent, textArea) {
    fetch(`/save_change_to_post/${postId}`, {
        method: "POST", 
        headers: {
            'Content-Type': 'application/json', 
            'X-CSRFToken': getCookie('csrftoken')
        }, 
        body: JSON.stringify({
            content: textArea.value
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        textArea.remove();
        postContent.innerHTML = data['newContent'];
        postContent.classList.remove('hidden')
    })
    .catch(error => console.error(error));
}

function updateSaveStatus(post) {
    const postId = post.dataset.postId;
    const button = post.querySelector(`#save-unsave-button-${postId}`);
    const buttonIcon = button.querySelector('i');
    const buttonText = button.querySelector('span');

    console.log(`update save status of post: ${postId}`);

    fetch(`/update_save_status/${postId}`, {
        method: "POST", 
        headers: {
            'Content-Type': 'application/json', 
            'X-CSRFToken': getCookie('csrftoken')
        }, 
        body: JSON.stringify({
            userHasSaved: post.dataset.userHasSaved === "True"
        })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Failed to update save status');
        }
    })
    .then(data => {
        // Update the button to indicate whether user has saved that post
        if (data['userHasSaved']) {
            buttonIcon.classList.replace('bi-bookmark', 'bi-bookmark-fill');
            buttonText.textContent = 'Unsaved';
        } else {
            buttonIcon.classList.replace('bi-bookmark-fill', 'bi-bookmark');
            buttonText.textContent = 'Save';
        }
        if (data['userHasSaved']) {
            post.dataset.userHasSaved = 'True';
        } else {
            post.dataset.userHasSaved = 'False';
        }
    })
    .catch(error => {
        console.error('update like status error', error);
    })
}

function updateLikeStatus(post) {
    const postId = post.dataset.postId;
    const button = post.querySelector(`#like-unlike-button-${postId}`);
    const buttonIcon = button.querySelector('i');
    const buttonText = button.querySelector('span');

    fetch(`/update_like_status/${postId}`, {
        method: "POST", 
        headers: {
            'Content-Type': 'application/json', 
            'X-CSRFToken': getCookie('csrftoken')
        }, 
        body: JSON.stringify({
            userHasLiked: post.dataset.userHasLiked === "True"
        })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Failed to update like status');
        }
    })
    .then(data => {
        // console.log(data);
        // Update the number of likes that displays on that post
        post.querySelector(`#post-like-count-${postId}`).innerHTML = `${data['likeCount']}`;

        // Update the button to indicate whether user has liked that post
        if (data['userHasLiked']) {
            buttonIcon.classList.replace('bi-heart', 'bi-heart-fill');
            buttonText.textContent = 'Unlike';
        } else {
            buttonIcon.classList.replace('bi-heart-fill', 'bi-heart');
            buttonText.textContent = 'Like';
        }

        // Update the 'userHasLiked' data attribute to that post
        // The values stored in the dataset object are automatically converted to strings
        // since the string representation of Python boolean values are "True" and "False", 
        // while in JavaScript, boolean values are "true" and "false"
        // therefore, we have to convert JavaScript representation into Python representation to maintain the consistency
        // and avoid updateLikeStatus userHasLiked miss understanding
        if (data['userHasLiked']) {
            post.dataset.userHasLiked = 'True';
        } else {
            post.dataset.userHasLiked = 'False';
        }
    })
    .catch(error => {
        console.error('update like status error', error);
    })
}

function displayComments(postId) {
    console.log(`display comments of post: ${postId}`);
    const commentModal = document.querySelector('#comment-modal');

    fetch(`/load_comments/${postId}`, {
        method: 'GET', 
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.status === 200) {
            return response.json();
        } else {
            throw new Error(`Error loading comments: ${response.status} ${response.statusText}`);
        }
    })
    .then(data => {
        const commentsContainer = commentModal.querySelector('.comments-list');
        commentsContainer.innerHTML = "";

        if (data['comments'].length > 0) {
            data['comments'].forEach(comment => {
                // clone the template for each comment and insert the value
                const CommentTemplate = commentModal.querySelector('#comment-template');
                const commentItem = CommentTemplate.content.querySelector('.comment-item').cloneNode(true);
                commentItem.dataset.commentId = comment.id;
                commentItem.dataset.postId = postId;

                const commentAuthor = commentItem.querySelector('#comment-author');
                const commentDate = commentItem.querySelector('#comment-date');
                const commentContent = commentItem.querySelector('#comment-content');
                const avatar = commentItem.querySelector('.avatar');

                // fill in the value in template
                commentAuthor.textContent = comment.author.username;
                commentAuthor.href = `/profile/${comment.author.id}`;
                commentDate.textContent = new Date(comment.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true
                });
                commentContent.textContent = comment.content;

                if (comment.author_profile.avatar_url) {
                    avatar.src = comment.author_profile.avatar_url;
                }

                // display edit button and delete button if current user is the author of the comment
                if (comment.author.id === currentUserId) {
                    const editButton = commentItem.querySelector('#comment-edit-button');
                    const deleteButton = commentItem.querySelector('#comment-delete-button');

                    editButton.classList.remove('hidden');
                    deleteButton.classList.remove('hidden');

                    if (editButton){
                        editButton.addEventListener('click', function() {
                            editCommentView(commentItem);
                        })
                    }

                    if (deleteButton) {
                        deleteButton.addEventListener('click', function() {
                            deleteComment(commentItem);
                        })
                    }
                }

                // append the commentItem to commentsContainer
                commentsContainer.appendChild(commentItem);
            })
        } else {
            const commentItem = document.createElement('div');
            commentItem.classList.add('comment-item');

            const commentContent = document.createElement('p');
            commentContent.classList.add('text-muted');
            commentContent.textContent = 'No comments yet';

            commentItem.appendChild(commentContent);
            commentsContainer.appendChild(commentItem);
        }
    })
    .catch(error => {
        console.log('Error loading comments:', error);
    });
}

function editCommentView(commentItem) {
    console.log(`edit button of comment id: ${commentItem.dataset.commentId} has been clicked!`);

    // replace the comment-content with a textarea
    const commentContent = commentItem.querySelector('#comment-content');
    commentContent.classList.add('hidden');
    const textArea = document.createElement('textarea');
    textArea.classList.add('form-control');
    textArea.innerHTML = `${commentContent.textContent}`;
    commentItem.querySelector('.comment-body').appendChild(textArea);

    // replace the edit button with a save button 
    const editButton = commentItem.querySelector('#comment-edit-button');
    const deleteButton = commentItem.querySelector('#comment-delete-button');
    editButton.classList.add('hidden'); // hide the edit button
    deleteButton.classList.add('hidden'); // hide the delete button

    // create save button for comment
    const saveButton = document.createElement('button');
    saveButton.innerHTML = 'Save';
    saveButton.classList.add('btn', 'btn-link', 'btn-sm');
    commentItem.querySelector('.button-wrap').appendChild(saveButton);

    saveButton.addEventListener('click', function() {
        saveChangeToComment(commentItem);
        saveButton.remove();
        editButton.classList.remove("hidden");
        deleteButton.classList.remove("hidden");
    })
}

function makeComment(commentForm) {
    const postId = commentForm.dataset.postId;
    const textArea = commentForm.querySelector('textarea');
    const errorMessage = commentForm.querySelector('.text-danger');

    const commentContent = textArea.value.trim();
    if (!commentContent) {
        errorMessage.textContent = 'Comment cannot be empty';
        return;
    }

    console.log(`make comment for post: ${postId}`);
    fetch(`/make_comment/${postId}`, {
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json', 
            'X-CSRFToken': getCookie('csrftoken')
        }, 
        body: JSON.stringify({ comment: commentContent })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error(`Error posting comment: ${response.status} ${response.statusText}`);
        }
    })
    .then(data => {
        // console.log(data);
        textArea.value = '';
        errorMessage.textContent = '';
        console.log(`load comments for post: ${postId} after new comment was made`);

        displayComments(postId);

        // update the comment count for that post
        const post = document.querySelector(`#post-${postId}`);
        const commentCountElement = post.querySelector(`#post-comment-count-${postId}`);
        const commentCount = data.comment_count;
        if (commentCount === 1) {
            commentCountElement.textContent = `${commentCount} comment`;
        } else if (commentCount > 1){
            commentCountElement.textContent = `${commentCount} comments`;
        }
    })
    .catch(error => console.error(error));
}

function saveChangeToComment(commentItem) {
    const commentId = commentItem.dataset.commentId;
    console.log(`save change to comment: ${commentId}`);

    const commentContent = commentItem.querySelector('#comment-content');
    const textArea = commentItem.querySelector('textarea');
    const newCommentContent = textArea.value;
    
    fetch(`/save_change_to_comment/${commentId}`, {
        method: "POST", 
        headers: {
            'Content-Type': 'application/json', 
            'X-CSRFToken': getCookie('csrftoken')
        }, 
        body: JSON.stringify({
            content: newCommentContent
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        textArea.remove();
        commentContent.innerHTML = newCommentContent;
        commentContent.classList.remove('hidden');
    })
}

function deleteComment(commentItem) {
    const commentId = commentItem.dataset.commentId;
    console.log(`delete comment: ${commentItem.dataset.commentId}`);

    const confirmDelete = confirm('Are you sure you want to delete this comment?');
    if (confirmDelete) {
        fetch(`/delete_comment/${commentId}`, {
            method: 'DELETE', 
            headers: {
                'Content-Type': 'application/json', 
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => response.json())
        .then(data => {
                // Update comment count for the post
                const postId = commentItem.dataset.postId;
                const post = document.querySelector(`#post-${postId}`);
                const commentCountElement = post.querySelector(`#post-comment-count-${ postId }`);

                let commentCount = parseInt(commentCountElement.innerHTML);
                console.log(`comment count before subtract: ${commentCount}`);
                commentCount = commentCount - 1;
                console.log(`comment count after subtract: ${commentCount}`);

                if (commentCount === 0) {
                    commentCountElement.innerHTML = '';
                } else if (commentCount === 1) {
                    commentCountElement.innerHTML = `${commentCount} comment`;
                } else {
                    commentCountElement.innerHTML = `${commentCount} comments`;
                }

                // Remove the deleted comment from the DOM
                commentItem.remove();

                // displayComments for the post
                displayComments(postId);
        })
        .catch(error => {
            console.error(error);
            alert('Failed to delete comment. Please try again later.');
        });
    }
}