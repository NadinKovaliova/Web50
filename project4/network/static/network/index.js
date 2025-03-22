document.addEventListener('DOMContentLoaded', function() {
    // Initialize post form functionality
    initializePostForm();
    initializeLikeButtons();

});

function initializeLikeButtons() {
    document.querySelectorAll('.like-btn').forEach(button => {
        button.addEventListener('click', function() {
            toggleLike(this);
        });
    });
}
// Helper function to get CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function initializePostForm() {
    const form = document.getElementById('post-form');
    const newPostBtn = document.getElementById('newPostBtn');

    // Handle new post button click
    if (newPostBtn) {
        newPostBtn.addEventListener('click', function() {
            expandPostForm();
            document.querySelector('textarea[name="content"]').focus();
        });
    }

    // Handle form submission
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            
            fetch('/create_post', {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    addNewPost(data.post);
                    form.reset();
                    closePostForm();
                } else {
                    alert(data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while creating the post.');
            });
        });
    }
}

function expandPostForm() {
    document.getElementById('postFormExpanded').style.display = 'block';
    document.querySelector('.post-form-trigger').style.display = 'none';
}

function closePostForm() {
    document.getElementById('postFormExpanded').style.display = 'none';
    document.querySelector('.post-form-trigger').style.display = 'flex';
}


// Existing image preview functions
function previewImage(input) {
    const preview = document.getElementById('preview');
    const previewDiv = document.getElementById('imagePreview');

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            previewDiv.style.display = 'block';
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function removeImage() {
    const input = document.getElementById('image');
    const preview = document.getElementById('preview');
    const previewDiv = document.getElementById('imagePreview');
    
    input.value = '';
    preview.src = '';
    previewDiv.style.display = 'none';
}

function addNewPost(post) {
    const postsContainer = document.getElementById('posts-container');
    const postHTML = `
        <div class="post" data-post-id="${post.id}">
            <div class="post-header">
                <strong><a href="/profile/${post.user}">${post.user}</a></strong>
                <span class="text-muted">${post.timestamp}</span>
            </div>
            <div class="post-content">
                <p class="content-text">${post.content}</p>
                ${post.image_url ? `<img src="${post.image_url}" class="post-image">` : ''}
            </div>
        </div>
    `;
    postsContainer.insertAdjacentHTML('afterbegin', postHTML);
}

function editPost(button) {
    const postId = button.dataset.postId;
    const postDiv = button.closest('.post');
    const contentDiv = postDiv.querySelector('.post-content');
    const contentText = postDiv.querySelector('.content-text');
    
    if (!contentText) {
        console.error('Content text element not found');
        return;
    }

    const currentContent = contentText.textContent.trim();

    // Create edit form
    const editForm = document.createElement('div');
    editForm.className = 'edit-form';
    editForm.innerHTML = `
        <textarea class="form-control mb-2 edit-textarea">${currentContent}</textarea>
        <div class="edit-buttons">
            <button class="btn btn-primary btn-sm mr-2" onclick="saveEdit(${postId}, this)">Save</button>
            <button class="btn btn-secondary btn-sm" onclick="cancelEdit(this)">Cancel</button>
        </div>
    `;
    
    // Hide content and show edit form
    //contentDiv.style.display = 'none';
    //contentDiv.after(editForm);
    //button.style.display = 'none';

    contentText.style.display = 'none';  // Change from contentDiv to contentText
    contentText.after(editForm);
    button.style.display = 'none';
}

function saveEdit(postId, button) {
    const editForm = button.closest('.edit-form');
    const postDiv = editForm.closest('.post');
    const contentText = postDiv.querySelector('.content-text');
    const textarea = editForm.querySelector('.edit-textarea');

    if (!textarea) {
        console.error('Textarea not found');
        return;
    }
    
    const newContent = textarea.value.trim();

    if (!newContent) {
        alert('Post content cannot be empty');
        return;
    }
    
    const formData = new FormData();
    formData.append('content', newContent);
    
    fetch(`/posts/${postId}/edit`, {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update content
            contentText.textContent = data.content;
            contentText.style.display = 'block';
            
            // Remove edit form
            editForm.remove();
            
            // Show edit button
            postDiv.querySelector('.edit-btn').style.display = 'inline-block';
        } else {
            alert(data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while saving the post.');
    });
}

function cancelEdit(button) {
    const editForm = button.closest('.edit-form');
    const postDiv = editForm.closest('.post');
    
    // Show original content
    postDiv.querySelector('.content-text').style.display = 'block';
    
    // Remove edit form
    editForm.remove();
    
    // Show edit button
    postDiv.querySelector('.edit-btn').style.display = 'inline-block';
}

function toggleLike(button) {
    console.log('Like button clicked for post:', button.dataset.postId);
    const postId = button.dataset.postId;
    const postDiv = button.closest('.post');
    const likesCountSpan = postDiv.querySelector('.likes-count');
    
    fetch(`/posts/${postId}/toggle_like`, {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => {
        console.log('Response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
     
    .then(data => {
        console.log('Like response:', data);
        if (data.liked) {
            button.textContent = 'Unlike';
        } else {
            button.textContent = 'Like';
        }
        likesCountSpan.textContent = `${data.likes_count} likes`;
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while toggling the like.');
    });
}
