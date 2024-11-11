# YouTube Clone Backend (MERN Stack)

This project is a backend clone of YouTube, created as part of my journey in mastering the **MERN stack**. It showcases various backend concepts and best practices used in professional development, focusing on **API development**, **database integration**, **middleware usage**, and **cloud storage**.

## Overview

In this project, I learned how to build and structure a robust backend system that mimics the functionalities of a video-sharing platform. The backend is powered by **Node.js** with **Express** as the server framework, **MongoDB** as the database, and **Cloudinary** for cloud storage of assets.

## Features

### 1. **Environment Configuration**
- Sensitive data (e.g., database URLs, API keys) is stored in an `.env` file for security.

### 2. **Database**
- Utilizes **MongoDB** (NoSQL) for storing user information, video details, comments, likes, and other data.
- Explored database connection setup, schema design, and CRUD operations.

### 3. **Custom Middleware**
- **Authorization Middleware**: Handles user authentication and role-based authorization.
- **Multer Middleware**: Used for temporary storage of files before uploading to Cloudinary.

### 4. **Cloudinary Integration**
- Upload and deletion of assets are managed through **Cloudinary**.

### 5. **Routing with Express Router**
- Organized routes using **Express.Router()** for a cleaner and modular structure.
- Created routes for video uploads, comments, likes, and user profiles.

### 6. **HTTP Methods and Express Techniques**
- Gained proficiency with HTTP methods (**GET**, **POST**, **PUT**, **DELETE**) to handle different types of requests.
- Used Express methods for middleware handling, error handling, and efficient request processing.

### 7. **Postman Testing**
- Utilized **Postman** to send requests and test the API endpoints during development.

## Key API Endpoints

- **POST** `/api/v1/users/register` - Register a new user.
- **POST** `/api/v1/users/login` - Log in a user.
- **GET** `/api/v1/videos` - Get all videos for a user.
- **POST** `/api/v1/videos/publish` - Upload a new video.
- **GET** `/api/v1/videos/:videoId` - Retrieve a specific video.
- **PATCH** `/api/v1/likes/toggle/video/:videoId` - Like a video.
- **POST** `/api/v1/comment/:videoId` - Add a comment to a video.
- **GET** `/api/v1/comment/:videoId` - Get comments for a video.

## Technologies & Dependencies

- **Node.js**: Server runtime.
- **Express**: Server framework.
- **MongoDB**: NoSQL database.
- **Mongoose**: MongoDB object modeling.
- **Multer**: Middleware for handling file uploads.
- **Cloudinary**: Cloud storage for images and videos.
- **Nodemon**: Auto-restarts the server during development.

## Conclusion

This backend project is an excellent demonstration of my learning journey through the **MERN stack**, covering **API development**, **database management**, **file storage** with **Cloudinary**, and implementing **custom middleware**. It serves as a foundational project that has helped me gain a deeper understanding of backend practices and how to structure a scalable, maintainable system.
