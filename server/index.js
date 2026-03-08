import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import chatRoutes from './routes/chat.js';
import uploadRoutes from './routes/upload.js';

// Import database
import pool, { query } from './config/database.js';

// Load environment variables
dotenv.config();

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// MIDDLEWARE

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api', limiter);

// ROUTES

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'GuideHub API is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});



// SOCKET.IO - REAL-TIME CHAT

// Store active users
const activeUsers = new Map();

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const result = await query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.user.id} (${socket.user.email})`);

  // Add user to active users
  activeUsers.set(socket.user.id, {
    socketId: socket.id,
    userId: socket.user.id,
    email: socket.user.email,
    firstName: socket.user.first_name,
    lastName: socket.user.last_name,
  });

  // Broadcast online status
  io.emit('user:online', { userId: socket.user.id });

  // Join user's rooms
  socket.on('room:join', async (roomId) => {
    try {
      // Verify user has access to this room
      const roomCheck = await query(
        'SELECT * FROM chat_rooms WHERE id = $1 AND (traveler_id = $2 OR guide_id = $2)',
        [roomId, socket.user.id]
      );

      if (roomCheck.rows.length > 0) {
        socket.join(roomId);
        console.log(`User ${socket.user.id} joined room ${roomId}`);
        
        // Notify room that user joined
        socket.to(roomId).emit('user:joined', {
          userId: socket.user.id,
          firstName: socket.user.first_name,
          lastName: socket.user.last_name,
        });
      }
    } catch (error) {
      console.error('Room join error:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Leave room
  socket.on('room:leave', (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.user.id} left room ${roomId}`);
  });

  // Send message
  socket.on('message:send', async (data) => {
    try {
      const { roomId, message } = data;

      if (!message || message.trim().length === 0) {
        return socket.emit('error', { message: 'Message cannot be empty' });
      }

      // Verify user has access to this room
      const roomCheck = await query(
        'SELECT * FROM chat_rooms WHERE id = $1 AND (traveler_id = $2 OR guide_id = $2)',
        [roomId, socket.user.id]
      );

      if (roomCheck.rows.length === 0) {
        return socket.emit('error', { message: 'Access denied to this room' });
      }

      const room = roomCheck.rows[0];

      // Determine receiver
      const receiverId =
        room.traveler_id === socket.user.id
          ? room.guide_id
          : room.traveler_id;

      // Insert message into database
      const result = await query(
        `INSERT INTO messages (room_id, sender_id, receiver_id, message)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [roomId, socket.user.id, receiverId, message.trim()]
      );

      const newMessage = result.rows[0];

      // Add sender info
      const messageWithSender = {
        ...newMessage,
        sender_first_name: socket.user.first_name,
        sender_last_name: socket.user.last_name,
        sender_id: socket.user.id,
      };

      // Emit to room
      io.to(roomId).emit('message:new', messageWithSender);

      // If receiver is online but not in room, send notification
      const receiverSocket = activeUsers.get(receiverId);
      if (receiverSocket && !io.sockets.adapter.rooms.get(roomId)?.has(receiverSocket.socketId)) {
        io.to(receiverSocket.socketId).emit('message:notification', {
          roomId,
          senderId: socket.user.id,
          senderName: `${socket.user.first_name} ${socket.user.last_name}`,
          message: message.substring(0, 50),
        });
      }
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Typing indicator
  socket.on('typing:start', (data) => {
    const { roomId } = data;
    socket.to(roomId).emit('user:typing', {
      userId: socket.user.id,
      firstName: socket.user.first_name,
      lastName: socket.user.last_name,
    });
  });

  socket.on('typing:stop', (data) => {
    const { roomId } = data;
    socket.to(roomId).emit('user:stopped-typing', {
      userId: socket.user.id,
    });
  });

  // Mark messages as read
  socket.on('messages:read', async (data) => {
    try {
      const { roomId } = data;

      await query(
        `UPDATE messages 
         SET is_read = true, status = 'read', read_at = CURRENT_TIMESTAMP
         WHERE room_id = $1 AND receiver_id = $2 AND is_read = false`,
        [roomId, socket.user.id]
      );

      // Notify sender that messages were read
      socket.to(roomId).emit('messages:read', {
        roomId,
        readBy: socket.user.id,
      });
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.user.id}`);
    activeUsers.delete(socket.user.id);
    
    // Broadcast offline status
    io.emit('user:offline', { userId: socket.user.id });
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

// Test database connection before starting server
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Failed to connect to database:', err);
    process.exit(1);
  }

  console.log('✅ Database connected successfully');
  console.log('📅 Database time:', res.rows[0].now);

  // Start server
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 API URL: http://localhost:${PORT}/api`);
    console.log(`💬 Socket.io ready for connections`);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

export default app;
