import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { query, getClient } from '../config/database.js';
import { generateToken, generateRefreshToken, verifyRefreshToken, authenticate } from '../middleware/auth.js';
import { sendVerificationEmail } from '../lib/email.js';

const router = express.Router();

// Validation rules
const signupValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('age')
    .isInt({ min: 18, max: 120 })
    .withMessage('Age must be between 18 and 120'),
  body('phoneNumber')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number required'),
  body('role')
    .isIn(['traveler', 'guide'])
    .withMessage('Role must be either traveler or guide'),
  body('profileImageUrl')
    .optional()
    .isString()
    .withMessage('Profile image URL must be a string'),
];

const guideProfileValidation = [
  body('languages')
    .isArray({ min: 1 })
    .withMessage('At least one language is required'),
  body('yearsOfExperience')
    .isInt({ min: 0 })
    .withMessage('Valid years of experience required'),
  body('bio').trim().notEmpty().withMessage('Bio is required for guides'),
  body('city').optional().trim(),
  body('country').optional().trim(),
  body('specialties').optional().isArray(),
  body('dailyRate').optional().isFloat({ min: 0 }),
];

// SIGN UP (Multi-step registration)

router.post('/signup', signupValidation, async (req, res) => {
  const client = await getClient();

  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      email,
      password,
      firstName,
      lastName,
      age,
      phoneNumber,
      role,
      guideProfile, // Optional: for guide-specific data
      profileImageUrl,
    } = req.body;

    // Start transaction
    await client.query('BEGIN');

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, age, phone_number, role, profile_image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, first_name, last_name, age, phone_number, role, created_at, profile_image_url`,
      [email, passwordHash, firstName, lastName, age, phoneNumber, role, profileImageUrl || null]
    );

    const user = userResult.rows[0];

    // If role is guide, create guide profile
    if (role === 'guide') {
      const {
        languages = [],
        yearsOfExperience = 0,
        bio = '',
        city = null,
        country = null,
        specialties = [],
        dailyRate = null,
      } = guideProfile || {};

      await client.query(
        `INSERT INTO guide_profiles 
         (user_id, bio, languages, years_of_experience, city, country, specialties, daily_rate)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          user.id,
          bio,
          languages,
          yearsOfExperience,
          city,
          country,
          specialties,
          dailyRate,
        ]
      );
    }

    // Generate verification token (15 min expiry)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

    await client.query(
      `UPDATE users 
       SET verification_token = $1, verification_token_expires_at = $2 
       WHERE id = $3`,
      [verificationToken, tokenExpiry, user.id]
    );

    // Commit transaction
    await client.query('COMMIT');

    // Send verification email (non-blocking)
    sendVerificationEmail(email, firstName, verificationToken).catch((err) =>
      console.error('Failed to send verification email:', err)
    );

    // Generate tokens
    const token = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          age: user.age,
          phoneNumber: user.phone_number,
          role: user.role,
          profileImageUrl: user.profile_image_url,
          createdAt: user.created_at,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
    });
  } finally {
    client.release();
  }
});

// ============================================
// VERIFY EMAIL
// ============================================
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required',
      });
    }

    const result = await query(
      `SELECT id, verification_token_expires_at 
       FROM users 
       WHERE verification_token = $1`,
      [token.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification link',
      });
    }

    const user = result.rows[0];

    if (new Date() > new Date(user.verification_token_expires_at)) {
      return res.status(400).json({
        success: false,
        message: 'Verification link has expired',
      });
    }

    await query(
      `UPDATE users 
       SET is_verified = true, verification_token = NULL, verification_token_expires_at = NULL 
       WHERE id = $1`,
      [user.id]
    );

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed',
    });
  }
});

// ============================================
// SIGN IN
// ============================================
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find user (only select needed columns)
    const result = await query(
      `SELECT id, email, password_hash, first_name, last_name, age, 
              phone_number, role, is_active, profile_image_url
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const user = result.rows[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate tokens
    const token = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          age: user.age,
          phoneNumber: user.phone_number,
          role: user.role,
          profileImageUrl: user.profile_image_url,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
});

    
// GET CURRENT USER

router.get('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user details
    let userQuery = `
      SELECT id, email, first_name, last_name, age, phone_number, 
             role, profile_image_url, is_verified, created_at
      FROM users
      WHERE id = $1
    `;

    const userResult = await query(userQuery, [userId]);
    const user = userResult.rows[0];

    // If user is a guide, get guide profile
    if (user.role === 'guide') {
      const profileResult = await query(
        `SELECT * FROM guide_profiles WHERE user_id = $1`,
        [userId]
      );

      if (profileResult.rows.length > 0) {
        user.guideProfile = profileResult.rows[0];
      }
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          age: user.age,
          phoneNumber: user.phone_number,
          role: user.role,
          profileImageUrl: user.profile_image_url,
          isVerified: user.is_verified,
          createdAt: user.created_at,
          guideProfile: user.guideProfile,
        },
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data',
    });
  }
});

// ============================================
// REFRESH TOKEN
// ============================================
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Fetch user role from DB (needed for token generation)
    const userResult = await query(
      'SELECT id, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Generate new tokens with correct role
    const token = generateToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id);

    res.json({
      success: true,
      data: {
        token,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }
});

// CHANGE PASSWORD (Protected)
router.put(
  '/change-password',
  authenticate,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .custom((value, { req }) => {
        if (value === req.body.currentPassword) {
          throw new Error('New password must be different from current password');
        }
        return true;
      }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      // Get current password hash
      const userResult = await query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      // Hash and update new password
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
      const newHash = await bcrypt.hash(newPassword, saltRounds);

      await query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [newHash, userId]
      );

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password',
      });
    }
  }
);

// GET CURRENT USER (validate token)
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, first_name, last_name, age, phone_number,
              role, profile_image_url, is_verified, created_at
       FROM users WHERE id = $1 AND is_active = true`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const row = result.rows[0];

    const user = {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      age: row.age,
      phoneNumber: row.phone_number,
      role: row.role,
      profileImageUrl: row.profile_image_url,
      isVerified: row.is_verified,
      createdAt: row.created_at,
    };

    // If guide, include guide profile
    if (row.role === 'guide') {
      const guideResult = await query(
        `SELECT bio, languages, years_of_experience, daily_rate,
                specialties, city, country, average_rating, total_reviews, is_available
         FROM guide_profiles WHERE user_id = $1`,
        [row.id]
      );
      if (guideResult.rows.length > 0) {
        user.guideProfile = guideResult.rows[0];
      }
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user data' });
  }
});

// LOGOUT
router.post('/logout', authenticate, async (req, res) => {
  // In a stateless JWT setup, logout is handled on the client side
  // by removing the token from storage
  // You can implement token blacklisting here if needed
  res.json({
    success: true,
    message: 'Logout successful',
  });
});

export default router;
