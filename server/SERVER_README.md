# GuideHub - Full-Stack Tour Guide Platform

A modern, full-stack SaaS platform connecting travelers with professional local tour guides, featuring real-time chat, JWT authentication, and role-based access control.

## 🏗️ Tech Stack

### Frontend
- React 18.3.1
- React Router 7.13.0
- Motion/React (Framer Motion) for animations
- Tailwind CSS 4
- Socket.io Client for real-time chat

### Backend
- Node.js with Express
- PostgreSQL 14+ (Relational Database)
- Socket.io for real-time communication
- JWT for authentication
- bcryptjs for password hashing

## 📋 Prerequisites

Before you begin, ensure you have installed:
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or pnpm package manager

## 🚀 Getting Started

### 1. Database Setup

#### Create PostgreSQL Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE guidehub_db;

# Exit psql
\q
```

#### Run Database Schema

```bash
# Execute the database schema
psql -U postgres -d guidehub_db -f database.sql
```

This will create:
- `users` table with RBAC (traveler/guide roles)
- `guide_profiles` table for guide-specific data
- `chat_rooms` table for conversations
- `messages` table for chat messages
- `bookings` table for tour bookings
- `reviews` table for guide ratings
- Necessary indexes, triggers, and views

### 2. Environment Configuration

#### Create `.env` file

```bash
# Copy the example file
cp .env.example .env

# Edit with your values
nano .env
```

**Required Environment Variables:**

```env
# Server
NODE_ENV=development
PORT=5000

# Database (Local PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=guidehub_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# JWT Secret (Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Client URL
CLIENT_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

### 3. Install Dependencies

```bash
# Install all dependencies
npm install

# Or using pnpm
pnpm install
```

### 4. Start Development Servers

#### Terminal 1: Start Backend Server

```bash
npm run server:dev
```

The API will run on `http://localhost:5000`

#### Terminal 2: Start Frontend

```bash
npm run dev
```

The app will run on `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Sign Up (Multi-Step)
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "age": 25,
  "phoneNumber": "+1234567890",
  "role": "traveler", // or "guide"
  "guideProfile": { // Required if role is "guide"
    "bio": "Experienced tour guide...",
    "languages": ["English", "Spanish"],
    "yearsOfExperience": 5,
    "dailyRate": 180,
    "specialties": ["History", "Food Tours"],
    "city": "Barcelona",
    "country": "Spain"
  }
}
```

#### Sign In
```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {...},
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### User Endpoints

#### Get All Guides (Public - Marketplace)
```http
GET /api/users/guides?city=Barcelona&minRating=4.5&page=1&limit=10
```

#### Get Guide by ID
```http
GET /api/users/guides/:id
```

#### Update Guide Profile (Protected - Guide Only)
```http
PUT /api/users/guides/:id/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "bio": "Updated bio",
  "languages": ["English", "Spanish", "French"],
  "dailyRate": 200,
  "isAvailable": true
}
```

### Chat Endpoints

#### Get Chat Rooms
```http
GET /api/chat/rooms
Authorization: Bearer <token>
```

#### Create or Get Chat Room
```http
POST /api/chat/rooms
Authorization: Bearer <token>
Content-Type: application/json

{
  "otherUserId": "guide-user-id"
}
```

#### Get Messages for Room
```http
GET /api/chat/rooms/:roomId/messages?limit=50
Authorization: Bearer <token>
```

#### Send Message (REST)
```http
POST /api/chat/rooms/:roomId/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Hello!"
}
```

## 💬 Real-Time Chat with Socket.io

### Client Connection Example

```javascript
import { io } from 'socket.io-client';

// Connect with JWT token
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your_jwt_token_here'
  }
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to chat server');
});

// Join a chat room
socket.emit('room:join', 'room-uuid-here');

// Listen for new messages
socket.on('message:new', (message) => {
  console.log('New message:', message);
});

// Send a message
socket.emit('message:send', {
  roomId: 'room-uuid-here',
  message: 'Hello from client!'
});

// Typing indicators
socket.emit('typing:start', { roomId: 'room-uuid' });
socket.emit('typing:stop', { roomId: 'room-uuid' });

// Listen for typing
socket.on('user:typing', (data) => {
  console.log(`${data.firstName} is typing...`);
});

// Mark messages as read
socket.emit('messages:read', { roomId: 'room-uuid' });
```

### Socket.io Events

**Client → Server:**
- `room:join` - Join a chat room
- `room:leave` - Leave a chat room
- `message:send` - Send a message
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `messages:read` - Mark messages as read

**Server → Client:**
- `message:new` - New message received
- `message:notification` - Notification for message in other room
- `user:typing` - User is typing
- `user:stopped-typing` - User stopped typing
- `messages:read` - Messages were read by other user
- `user:online` - User came online
- `user:offline` - User went offline
- `user:joined` - User joined the room

## 🔐 Protected Routes & RBAC

### Route Protection Example

```javascript
// Protect route - any authenticated user
router.get('/profile', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Guide-only route
router.put('/guide/profile', 
  authenticate, 
  authorize('guide'), 
  (req, res) => {
    // Only guides can access
  }
);

// Traveler-only route
router.post('/bookings', 
  authenticate, 
  authorize('traveler'), 
  (req, res) => {
    // Only travelers can book
  }
);

// Multiple roles allowed
router.get('/chat', 
  authenticate, 
  authorize('traveler', 'guide'), 
  (req, res) => {
    // Both travelers and guides can access
  }
);
```

## 🗃️ Database Schema Overview

### Users Table
- **RBAC Implementation**: `role` field with ENUM ('traveler', 'guide')
- Password hashing with bcrypt
- Email uniqueness constraint
- Soft delete support with `is_active`

### Guide Profiles Table
- Linked to Users via `user_id` (Foreign Key)
- Array fields: `languages[]`, `specialties[]`
- Rating system with triggers
- Certification status

### Chat System Tables
- **chat_rooms**: Conversation between traveler and guide
- **messages**: Individual messages with read receipts
- Automatic timestamp updates via triggers

### Additional Tables
- **bookings**: Tour booking management
- **reviews**: Guide ratings and reviews

## 🛠️ Useful Scripts

```bash
# Start backend in development mode (with auto-reload)
npm run server:dev

# Start backend in production mode
npm run server

# Start frontend development server
npm run dev

# Build frontend for production
npm run build
```

## 📦 Database Utilities

### Generate Password Hash

```javascript
// Use this to generate password hashes for testing
import bcrypt from 'bcryptjs';

const password = 'password123';
const hash = await bcrypt.hash(password, 10);
console.log(hash);
```

### Generate JWT Secret

```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🧪 Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:5000/api/health

# Sign up
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "age": 25,
    "role": "traveler"
  }'

# Sign in
curl -X POST http://localhost:5000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get guides (with token)
curl http://localhost:5000/api/users/guides \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🔧 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo service postgresql status

# Check database exists
psql -U postgres -l

# Test connection
psql -U postgres -d guidehub_db -c "SELECT NOW();"
```

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

### JWT Errors

- Ensure `JWT_SECRET` is set in `.env`
- Check token format: `Bearer <token>`
- Verify token hasn't expired

## 📄 License

MIT License - feel free to use for personal and commercial projects.

## 👥 Contributors

Built with ❤️ for the GuideHub platform.
