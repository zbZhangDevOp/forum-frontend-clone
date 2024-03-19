import { BACKEND_PORT } from './config.js';
import { displayThread } from './thread-display.js';
import { validateUser } from './main.js';
import { getUserImg, openUserModal } from './user.js';

let user = null;

if (localStorage.getItem('user') !== null) {
    user = JSON.parse(localStorage.getItem('user'));

}

export const loadComments = (threadId) => {
    fetch(`http://localhost:${BACKEND_PORT}/comments?threadId=${threadId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validateUser.user.token}`
        }
    }).then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                document.getElementById("comments-container").innerText = "";
                displayComments(data, null);
            }
        });
}

const displayComments = (comments, parentId) => {
    if (comments.length === 0) {
        return;
    }

    const children = comments.filter(comment => comment.parentCommentId === parentId);

    children.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const remaining = comments.filter(comment => comment.parentCommentId !== parentId);

    children.forEach(comment => {
        getUserImg(comment.creatorId).then(profilePictureUrl => {
            const parentElement = comment.parentCommentId != null
                ? document.querySelector(`#comment-${comment.parentCommentId} .nested-comments`) : document.getElementById("comments-container");



            const commentElement = document.createElement("div");
            commentElement.id = `comment-${comment.id}`;
            commentElement.className = "comment";

            const commentHeading = document.createElement("div");
            commentHeading.className = "comment-heading";


            const profilePic = document.createElement("img");
            profilePic.src = profilePictureUrl;
            profilePic.className = "img-thumbnail profile-pic";
            profilePic.alt = "Profile Picture";
            commentHeading.appendChild(profilePic);

            profilePic.onclick = function () {
                console.log("clicked");
                openUserModal(comment.creatorId, comment.threadId);
            };

            // Add time since commented
            // const timeSince = document.createElement("p");
            // timeSince.innerText = formatTimeSince(comment.createdAt);
            // commentHeading.appendChild(timeSince);

            console.log(comment)
            // Add number of likes
            const numLikes = document.createElement("p");
            numLikes.innerText = `${formatTimeSince(comment.createdAt)} | Likes: ${comment.likes.length}`;
            commentHeading.appendChild(numLikes);

            const commentBody = document.createElement("div");
            commentBody.className = "comment-body";

            // Add comment content
            const content = document.createElement("p");
            content.innerText = comment.content;
            commentBody.appendChild(content);

            // Add number of likes

            const likeButton = document.createElement("button");
            likeButton.className = "btn btn-outline-primary";
            likeButton.id = `like-comment-${comment.id}`;

            likeButton.innerHTML = comment.likes.includes(validateUser.user.userId) ? "♥ Unlike" : "♡ Like";
            likeButton.addEventListener("click", () => {
                toggleLikeComment(comment.id, comment.threadId);
            });

            commentBody.appendChild(likeButton);

            const replyButton = document.createElement("button");
            replyButton.innerText = "Reply";
            replyButton.className = "btn btn-primary";
            replyButton.addEventListener("click", () => {
                openReplyModal(comment.id, comment.threadId);
            });
            commentBody.appendChild(replyButton);

            const editButton = document.createElement("button");
            editButton.innerText = "Edit";
            editButton.className = "btn btn-outline-primary";
            editButton.addEventListener("click", () => {
                openEditCommentModal(comment.id, comment.content, comment.threadId);
            });
            commentBody.appendChild(editButton);

            // Add nested comments container
            const nestedComments = document.createElement("div");
            nestedComments.className = "nested-comments";
            nestedComments.style.paddingLeft = `50px`;

            const commentBorderLink = document.createElement("a");
            commentBorderLink.href = `#comment-${comment.id}`;
            commentBorderLink.className = "comment-border-link";

            commentElement.appendChild(commentHeading);
            commentElement.appendChild(commentBody);
            commentElement.appendChild(nestedComments);
            commentElement.appendChild(commentBorderLink);

            parentElement.appendChild(commentElement);

            displayComments(remaining, comment.id);
        });
    })
};

export const postMainComment = (threadId) => {
    const commentText = document.getElementById("new-comment-text").value;

    if (commentText.trim() === "") {
        alert("Comment cannot be empty!");
        return;
    }

    const data = {
        "content": commentText,
        "threadId": threadId,
        "parentCommentId": null
    };

    fetch(`http://localhost:${BACKEND_PORT}/comment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validateUser.user.token}`
        },
        body: JSON.stringify(data)
    }).then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                loadComments(threadId); // Reload the comments
            }
        });

}

const openReplyModal = (parentId, threadId) => {
    document.getElementById("reply-modal").style.display = "block";

    document.getElementById("reply-comment-submit").onclick = () => {
        replyComment(parentId, threadId);
    };

    document.getElementById("reply-comment-close").onclick = () => {
        document.getElementById("reply-modal").style.display = "none";
    };
};

const replyComment = (parentId, threadId) => {
    const commentText = document.getElementById("reply-comment-text").value;

    const data = {
        "content": commentText,
        "threadId": threadId,
        "parentCommentId": parentId
    };

    fetch(`http://localhost:${BACKEND_PORT}/comment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validateUser.user.token}`
        },
        body: JSON.stringify(data)
    }).then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                document.getElementById("reply-modal").style.display = "none";
                loadComments(threadId); // Reload the comments
            }
        });
};

const formatTimeSince = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
        return "Just now";
    } else if (diffInSeconds < 3600) {
        return `${Math.floor(diffInSeconds / 60)} minute(s) ago`;
    } else if (diffInSeconds < 86400) {
        return `${Math.floor(diffInSeconds / 3600)} hour(s) ago`;
    } else if (diffInSeconds < 604800) {
        return `${Math.floor(diffInSeconds / 86400)} day(s) ago`;
    } else {
        return `${Math.floor(diffInSeconds / 604800)} week(s) ago`;
    }
};

const openEditCommentModal = (commentId, commentText, threadId) => {
    document.getElementById("edit-comment-modal").style.display = "block";

    document.getElementById("edit-comment-submit").onclick = () => {
        updateComment(commentId, threadId);
    };

    document.getElementById("edit-comment-text").value = commentText;

    document.getElementById("edit-comment-close").onclick = () => {
        document.getElementById("edit-comment-modal").style.display = "none";
    };
};

const updateComment = (commentId, threadId) => {
    const commentText = document.getElementById("edit-comment-text").value;

    const data = {
        "id": commentId,
        "content": commentText
    };

    fetch(`http://localhost:${BACKEND_PORT}/comment`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validateUser.user.token}`
        },
        body: JSON.stringify(data)
    }).then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                document.getElementById("edit-comment-modal").style.display = "none";
                loadComments(threadId); // Reload the comments
            }
        });
};

const isCommentLiked = (commentId, threadId) => {
    return fetch(`http://localhost:${BACKEND_PORT}/comments?threadId=${threadId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validateUser.user.token}`
        }
    }).then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                const comment = data.find(comment => comment.id === commentId);
                return comment.likes.includes(validateUser.user.userId);
            }
        });
}

const toggleLikeComment = (commentId, threadId) => {
    isCommentLiked(commentId, threadId).then(isLiked => {
        const likeComment = {
            "id": commentId,
            "turnon": !isLiked
        };

        fetch(`http://localhost:${BACKEND_PORT}/comment/like`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${validateUser.user.token}`
            },
            body: JSON.stringify(likeComment)
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    const likeButton = document.getElementById(`like-comment-${commentId}`);
                    likeButton.innerHTML = !isLiked ? "♥ Unlike" : "♡ Like";
                    loadComments(threadId);
                }
            })
            .catch(error => {
                console.error('Error liking thread:', error);
            });
    });

}