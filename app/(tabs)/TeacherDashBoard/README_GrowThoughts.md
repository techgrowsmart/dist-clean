# GrowThoughts Implementation

## Overview
This implementation adds functional post creation and interaction capabilities to the Teacher Dashboard's RightScreen (GrowThoughts).

## Features Implemented

### Frontend (RightScreen.tsx)
- **Post Creation**: Teachers can create posts with text content and optional images
- **Image Upload**: Teachers can select and attach images to posts
- **Post Feed**: Display all posts in chronological order
- **Like/Unlike**: Both teachers and students can like/unlike posts
- **Real-time UI**: Immediate feedback for user actions
- **Loading States**: Visual feedback during API calls
- **Error Handling**: User-friendly error messages

### Backend (posts.js)
- **Database Schema**: Cassandra tables for posts, likes, and comments
- **Post Creation**: `/api/posts/create` - Teachers only
- **Fetch Posts**: `/api/posts/all` - All authenticated users
- **Like System**: `/api/posts/:id/like` - Toggle likes
- **Comments**: `/api/posts/:id/comments` - Add and view comments
- **Image Upload**: Multer middleware for image handling
- **Authentication**: JWT token verification
- **Role-based Access**: Teachers can create, all users can view/interact

## Database Tables

### posts
- id (UUID, Primary Key)
- author_email (TEXT)
- author_name (TEXT)
- author_role (TEXT)
- content (TEXT)
- post_image (TEXT, optional)
- likes_counter (COUNTER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- tags (SET<TEXT>, optional)

### post_likes
- post_id (UUID, Primary Key)
- user_email (TEXT, Primary Key)
- liked_at (TIMESTAMP)

### post_comments
- id (UUID, Primary Key)
- post_id (UUID)
- author_email (TEXT)
- author_name (TEXT)
- content (TEXT)
- created_at (TIMESTAMP)

## API Endpoints

### POST /api/posts/create
- **Purpose**: Create a new post
- **Access**: Teachers only
- **Body**: FormData with content, optional postImage, optional tags
- **Response**: Created post data

### GET /api/posts/all
- **Purpose**: Get all posts
- **Access**: All authenticated users
- **Response**: Array of posts sorted by created_at DESC

### POST /api/posts/:id/like
- **Purpose**: Like a post
- **Access**: All authenticated users
- **Response**: Success message

### DELETE /api/posts/:id/like
- **Purpose**: Unlike a post
- **Access**: All authenticated users
- **Response**: Success message

### POST /api/posts/:id/comments
- **Purpose**: Add comment to post
- **Access**: All authenticated users
- **Body**: JSON with content
- **Response**: Created comment data

### GET /api/posts/:id/comments
- **Purpose**: Get comments for post
- **Access**: All authenticated users
- **Response**: Array of comments

## Usage Instructions

### For Teachers
1. Type your thoughts in the input field
2. Optionally add an image using the image button
3. Click "Post" to publish
4. Your post will appear at the top of the feed

### For Students
1. View all posts in the feed
2. Like posts to show appreciation
3. Comment on posts to engage in discussion
4. Cannot create posts (role-based restriction)

## Setup Instructions

### Backend Setup
1. The posts route is already added to app.js
2. Database tables are created automatically on first run
3. Image uploads are stored in /uploads directory
4. Ensure proper permissions for uploads directory

### Frontend Setup
1. expo-image-picker is already installed
2. Update API_BASE_URL in RightScreen.tsx to match your backend
3. Implement proper authentication token retrieval
4. Test with both teacher and student accounts

## Security Considerations
- JWT token verification for all endpoints
- Role-based access control (teachers only for posting)
- File type validation for images
- Input sanitization and validation
- Proper error handling without exposing sensitive information

## Future Enhancements
- Real-time updates using WebSockets
- Post editing and deletion
- Rich text editor for posts
- Video uploads
- Post categories and filtering
- User mentions and notifications
- Post analytics and insights

## Notes
- Current implementation uses mock data for demonstration
- Replace mock API calls with actual backend integration
- Update authentication token handling based on your auth system
- Test thoroughly with different user roles and permissions
