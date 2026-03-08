import express from 'express';
import { query, getClient } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// UUID validation helper
const isValidUUID = (id) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// GET CHAT ROOMS FOR CURRENT USER
router.get('/rooms', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Single query that works for both roles
    const result = await query(
      `SELECT 
        cr.id as room_id,
        cr.created_at,
        cr.last_message_at,
        u.id as other_user_id,
        u.first_name,
        u.last_name,
        u.profile_image_url,
        u.role,
        (SELECT message FROM messages WHERE room_id = cr.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE room_id = cr.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages WHERE room_id = cr.id AND receiver_id = $1 AND is_read = false) as unread_count
      FROM chat_rooms cr
      INNER JOIN users u ON 
        CASE 
          WHEN cr.traveler_id = $1 THEN u.id = cr.guide_id
          ELSE u.id = cr.traveler_id
        END
      WHERE cr.traveler_id = $1 OR cr.guide_id = $1
      ORDER BY cr.last_message_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get chat rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat rooms',
    });
  }
});

// GET OR CREATE CHAT ROOM
router.post('/rooms', authenticate, async (req, res) => {
  const client = await getClient();

  try {
    const { otherUserId } = req.body;
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    if (!otherUserId) {
      client.release();
      return res.status(400).json({
        success: false,
        message: 'Other user ID is required',
      });
    }

    if (!isValidUUID(otherUserId)) {
      client.release();
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    // Can't create a room with yourself
    if (currentUserId === otherUserId) {
      client.release();
      return res.status(400).json({
        success: false,
        message: 'Cannot create a chat room with yourself',
      });
    }

    // Verify the other user exists and is active
    const otherUserResult = await client.query(
      'SELECT id, role, is_active FROM users WHERE id = $1',
      [otherUserId]
    );

    if (otherUserResult.rows.length === 0) {
      client.release();
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const otherUser = otherUserResult.rows[0];

    if (!otherUser.is_active) {
      client.release();
      return res.status(400).json({
        success: false,
        message: 'Cannot chat with a deactivated user',
      });
    }

    // Validate that the room is between a traveler and a guide
    const roles = [currentUserRole, otherUser.role];
    if (!roles.includes('traveler') || !roles.includes('guide')) {
      // Allow admin to chat with anyone
      if (currentUserRole !== 'admin' && otherUser.role !== 'admin') {
        client.release();
        return res.status(400).json({
          success: false,
          message: 'Chat rooms can only be created between a traveler and a guide',
        });
      }
    }

    // Determine traveler and guide IDs
    let travelerId, guideId;
    if (currentUserRole === 'traveler') {
      travelerId = currentUserId;
      guideId = otherUserId;
    } else if (currentUserRole === 'guide') {
      travelerId = otherUserId;
      guideId = currentUserId;
    } else {
      // Admin — assign based on the other user's role
      if (otherUser.role === 'traveler') {
        travelerId = otherUserId;
        guideId = currentUserId;
      } else {
        travelerId = currentUserId;
        guideId = otherUserId;
      }
    }

    await client.query('BEGIN');

    // Check if room already exists
    const existingRoom = await client.query(
      'SELECT id, traveler_id, guide_id, created_at, last_message_at FROM chat_rooms WHERE traveler_id = $1 AND guide_id = $2',
      [travelerId, guideId]
    );

    let room;
    if (existingRoom.rows.length > 0) {
      room = existingRoom.rows[0];
    } else {
      // Create new room
      const newRoom = await client.query(
        `INSERT INTO chat_rooms (traveler_id, guide_id)
         VALUES ($1, $2)
         RETURNING id, traveler_id, guide_id, created_at, last_message_at`,
        [travelerId, guideId]
      );
      room = newRoom.rows[0];
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: room,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create/get chat room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create/get chat room',
    });
  } finally {
    client.release();
  }
});

// GET MESSAGES FOR A CHAT ROOM
router.get('/rooms/:roomId/messages', authenticate, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const { before } = req.query;

    if (!isValidUUID(roomId)) {
      return res.status(400).json({ success: false, message: 'Invalid room ID' });
    }

    // Safe limit
    const safeLimit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));

    // Verify user is part of this room
    const roomCheck = await query(
      'SELECT id FROM chat_rooms WHERE id = $1 AND (traveler_id = $2 OR guide_id = $2)',
      [roomId, userId]
    );

    if (roomCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this chat room',
      });
    }

    // Build query for messages
    let queryText = `
      SELECT 
        m.id,
        m.room_id,
        m.sender_id,
        m.receiver_id,
        m.message,
        m.status,
        m.is_read,
        m.created_at,
        m.read_at,
        u.first_name as sender_first_name,
        u.last_name as sender_last_name,
        u.profile_image_url as sender_image
      FROM messages m
      INNER JOIN users u ON m.sender_id = u.id
      WHERE m.room_id = $1
    `;

    const params = [roomId];
    let paramCounter = 2;

    if (before) {
      queryText += ` AND m.created_at < $${paramCounter}`;
      params.push(before);
      paramCounter++;
    }

    queryText += ` ORDER BY m.created_at DESC LIMIT $${paramCounter}`;
    params.push(safeLimit);

    const result = await query(queryText, params);

    // Mark messages as read (only those sent TO the current user)
    await query(
      `UPDATE messages 
       SET is_read = true, status = 'read', read_at = CURRENT_TIMESTAMP
       WHERE room_id = $1 AND receiver_id = $2 AND is_read = false`,
      [roomId, userId]
    );

    res.json({
      success: true,
      data: result.rows.reverse(), // Reverse to chronological order
      pagination: {
        limit: safeLimit,
        hasMore: result.rows.length === safeLimit,
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
    });
  }
});

// SEND MESSAGE (REST fallback — also handled via Socket.io)
router.post('/rooms/:roomId/messages', authenticate, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { message } = req.body;
    const senderId = req.user.id;

    if (!isValidUUID(roomId)) {
      return res.status(400).json({ success: false, message: 'Invalid room ID' });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty',
      });
    }

    // Enforce max message length
    if (message.trim().length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot exceed 5000 characters',
      });
    }

    // Verify user is part of this room
    const roomCheck = await query(
      'SELECT traveler_id, guide_id FROM chat_rooms WHERE id = $1 AND (traveler_id = $2 OR guide_id = $2)',
      [roomId, senderId]
    );

    if (roomCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this chat room',
      });
    }

    const room = roomCheck.rows[0];

    // Determine receiver
    const receiverId =
      room.traveler_id === senderId ? room.guide_id : room.traveler_id;

    // Insert message
    const result = await query(
      `INSERT INTO messages (room_id, sender_id, receiver_id, message)
       VALUES ($1, $2, $3, $4)
       RETURNING id, room_id, sender_id, receiver_id, message, status, is_read, created_at`,
      [roomId, senderId, receiverId, message.trim()]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
    });
  }
});

// MARK MESSAGES AS READ
router.put('/rooms/:roomId/read', authenticate, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    if (!isValidUUID(roomId)) {
      return res.status(400).json({ success: false, message: 'Invalid room ID' });
    }

    // Verify user is part of this room
    const roomCheck = await query(
      'SELECT id FROM chat_rooms WHERE id = $1 AND (traveler_id = $2 OR guide_id = $2)',
      [roomId, userId]
    );

    if (roomCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this chat room',
      });
    }

    const result = await query(
      `UPDATE messages 
       SET is_read = true, status = 'read', read_at = CURRENT_TIMESTAMP
       WHERE room_id = $1 AND receiver_id = $2 AND is_read = false`,
      [roomId, userId]
    );

    res.json({
      success: true,
      message: 'Messages marked as read',
      data: { markedCount: result.rowCount },
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
    });
  }
});

// GET UNREAD COUNT (all rooms combined)
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      'SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = false',
      [userId]
    );

    res.json({
      success: true,
      data: { unreadCount: parseInt(result.rows[0].count) },
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
    });
  }
});

// DELETE CHAT ROOM (Admin only or room participant)
router.delete('/rooms/:roomId', authenticate, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!isValidUUID(roomId)) {
      return res.status(400).json({ success: false, message: 'Invalid room ID' });
    }

    // Admin can delete any room; participants can delete their own
    let roomCheck;
    if (userRole === 'admin') {
      roomCheck = await query('SELECT id FROM chat_rooms WHERE id = $1', [roomId]);
    } else {
      roomCheck = await query(
        'SELECT id FROM chat_rooms WHERE id = $1 AND (traveler_id = $2 OR guide_id = $2)',
        [roomId, userId]
      );
    }

    if (roomCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found',
      });
    }

    // CASCADE will delete all messages in the room
    await query('DELETE FROM chat_rooms WHERE id = $1', [roomId]);

    res.json({
      success: true,
      message: 'Chat room deleted successfully',
    });
  } catch (error) {
    console.error('Delete chat room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete chat room',
    });
  }
});

export default router;
