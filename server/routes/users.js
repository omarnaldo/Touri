import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// UUID validation helper
const isValidUUID = (id) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// GET ALL GUIDES (Public - for marketplace)
router.get('/guides', async (req, res) => {
  try {
    const { city, minRating, maxPrice, languages, specialties } = req.query;

    // Safe pagination values
    const safePage = Math.max(1, parseInt(req.query.page) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));

    let whereClause = ` WHERE u.role = 'guide' AND u.is_active = true`;
    const params = [];
    let paramCounter = 1;

    // Apply filters
    if (city) {
      whereClause += ` AND LOWER(gp.city) = LOWER($${paramCounter})`;
      params.push(city);
      paramCounter++;
    }

    if (minRating) {
      whereClause += ` AND gp.average_rating >= $${paramCounter}`;
      params.push(parseFloat(minRating));
      paramCounter++;
    }

    if (maxPrice) {
      whereClause += ` AND gp.daily_rate <= $${paramCounter}`;
      params.push(parseFloat(maxPrice));
      paramCounter++;
    }

    if (languages) {
      whereClause += ` AND gp.languages && $${paramCounter}`;
      params.push(Array.isArray(languages) ? languages : [languages]);
      paramCounter++;
    }

    if (specialties) {
      whereClause += ` AND gp.specialties && $${paramCounter}`;
      params.push(Array.isArray(specialties) ? specialties : [specialties]);
      paramCounter++;
    }

    // Main query with filters + pagination
    const queryText = `
      SELECT 
        u.id, u.first_name, u.last_name, u.profile_image_url,
        gp.bio, gp.languages, gp.years_of_experience, gp.daily_rate,
        gp.specialties, gp.city, gp.country, gp.average_rating,
        gp.total_reviews, gp.is_available
      FROM users u
      INNER JOIN guide_profiles gp ON u.id = gp.user_id
      ${whereClause}
      ORDER BY gp.average_rating DESC, gp.total_reviews DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    const offset = (safePage - 1) * safeLimit;
    params.push(safeLimit, offset);

    const result = await query(queryText, params);

    // Count query uses the same filters (without LIMIT/OFFSET)
    const countParams = params.slice(0, -2); // remove limit & offset
    const countQuery = `
      SELECT COUNT(*) 
      FROM users u
      INNER JOIN guide_profiles gp ON u.id = gp.user_id
      ${whereClause}
    `;
    const countResult = await query(countQuery, countParams);
    const totalGuides = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        guides: result.rows,
        pagination: {
          currentPage: safePage,
          totalPages: Math.ceil(totalGuides / safeLimit),
          totalGuides,
          limit: safeLimit,
        },
      },
    });
  } catch (error) {
    console.error('Get guides error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch guides',
    });
  }
});


// GET GUIDE BY ID (Public)
router.get('/guides/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid guide ID' });
    }

    const result = await query(
      `SELECT 
        u.id, u.email, u.first_name, u.last_name, u.profile_image_url,
        u.created_at,
        gp.bio, gp.languages, gp.years_of_experience, gp.hourly_rate,
        gp.daily_rate, gp.specialties, gp.city, gp.country,
        gp.certification_status, gp.average_rating, gp.total_reviews,
        gp.total_tours_completed, gp.is_available
      FROM users u
      INNER JOIN guide_profiles gp ON u.id = gp.user_id
      WHERE u.id = $1 AND u.role = 'guide' AND u.is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Guide not found',
      });
    }

    // Get reviews for this guide
    const reviewsResult = await query(
      `SELECT 
        r.id, r.rating, r.comment, r.created_at,
        u.first_name, u.last_name, u.profile_image_url
      FROM reviews r
      INNER JOIN users u ON r.traveler_id = u.id
      WHERE r.guide_id = $1
      ORDER BY r.created_at DESC
      LIMIT 10`,
      [id]
    );

    res.json({
      success: true,
      data: {
        guide: result.rows[0],
        reviews: reviewsResult.rows,
      },
    });
  } catch (error) {
    console.error('Get guide error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch guide',
    });
  }
});

// GET MY PROFILE (Protected)
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT id, email, first_name, last_name, age, phone_number, role, 
              profile_image_url, is_verified, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = result.rows[0];

    // If the user is a guide, include guide profile data
    if (user.role === 'guide') {
      const guideResult = await query(
        `SELECT bio, languages, years_of_experience, hourly_rate, daily_rate,
                specialties, city, country, certification_status, average_rating,
                total_reviews, total_tours_completed, is_available
         FROM guide_profiles WHERE user_id = $1`,
        [userId]
      );

      if (guideResult.rows.length > 0) {
        user.guideProfile = guideResult.rows[0];
      }
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
    });
  }
});

// UPDATE USER PROFILE (Protected)
router.put(
  '/profile',
  authenticate,
  [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('First name must be between 1 and 100 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Last name must be between 1 and 100 characters'),
    body('age')
      .optional()
      .isInt({ min: 18, max: 120 })
      .withMessage('Age must be between 18 and 120'),
    body('phoneNumber')
      .optional()
      .trim()
      .isLength({ max: 20 })
      .withMessage('Phone number is too long'),
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
      const { firstName, lastName, age, phoneNumber, profileImageUrl } = req.body;

      const result = await query(
        `UPDATE users
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             age = COALESCE($3, age),
             phone_number = COALESCE($4, phone_number),
             profile_image_url = COALESCE($5, profile_image_url)
         WHERE id = $6
         RETURNING id, email, first_name, last_name, age, phone_number, role, profile_image_url`,
        [firstName, lastName, age, phoneNumber, profileImageUrl, userId]
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Update user profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
      });
    }
  }
);

// UPDATE GUIDE PROFILE (Protected - Guide or Admin)
router.put(
  '/guides/:id/profile',
  authenticate,
  authorize('guide', 'admin'),
  [
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Bio cannot exceed 2000 characters'),
    body('languages')
      .optional()
      .isArray({ min: 1 })
      .withMessage('Languages must be an array with at least 1 item'),
    body('yearsOfExperience')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Years of experience must be 0 or more'),
    body('hourlyRate')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Hourly rate must be greater than 0'),
    body('dailyRate')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Daily rate must be greater than 0'),
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

      const { id } = req.params;

      if (!isValidUUID(id)) {
        return res.status(400).json({ success: false, message: 'Invalid guide ID' });
      }

      // Guides can only update their own profile; admins can update any
      if (req.user.role !== 'admin' && req.user.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own profile',
        });
      }

      const {
        bio,
        languages,
        yearsOfExperience,
        hourlyRate,
        dailyRate,
        specialties,
        city,
        country,
        isAvailable,
      } = req.body;

      const result = await query(
        `UPDATE guide_profiles
         SET bio = COALESCE($1, bio),
             languages = COALESCE($2, languages),
             years_of_experience = COALESCE($3, years_of_experience),
             hourly_rate = COALESCE($4, hourly_rate),
             daily_rate = COALESCE($5, daily_rate),
             specialties = COALESCE($6, specialties),
             city = COALESCE($7, city),
             country = COALESCE($8, country),
             is_available = COALESCE($9, is_available)
         WHERE user_id = $10
         RETURNING *`,
        [
          bio,
          languages,
          yearsOfExperience,
          hourlyRate,
          dailyRate,
          specialties,
          city,
          country,
          isAvailable,
          id,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Guide profile not found',
        });
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Update guide profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
      });
    }
  }
);



// ADMIN ROUTES

// GET ALL USERS (Admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const safePage = Math.max(1, parseInt(req.query.page) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (safePage - 1) * safeLimit;
    const { role, search } = req.query;

    let queryText = `
      SELECT id, email, first_name, last_name, age, phone_number, role,
             profile_image_url, is_verified, is_active, created_at, last_login
      FROM users
      WHERE 1=1
    `;
    const params = [];
    let paramCounter = 1;

    if (role) {
      queryText += ` AND role = $${paramCounter}`;
      params.push(role);
      paramCounter++;
    }

    if (search) {
      queryText += ` AND (LOWER(first_name) LIKE LOWER($${paramCounter}) OR LOWER(last_name) LIKE LOWER($${paramCounter}) OR LOWER(email) LIKE LOWER($${paramCounter}))`;
      params.push(`%${search}%`);
      paramCounter++;
    }

    // Count with same filters
    const countParams = [...params];
    const countQuery = queryText.replace(
      /SELECT .+ FROM/s,
      'SELECT COUNT(*) FROM'
    );
    const countResult = await query(countQuery, countParams);
    const totalUsers = parseInt(countResult.rows[0].count);

    // Add ordering and pagination
    queryText += ` ORDER BY created_at DESC LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
    params.push(safeLimit, offset);

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: {
        users: result.rows,
        pagination: {
          currentPage: safePage,
          totalPages: Math.ceil(totalUsers / safeLimit),
          totalUsers,
          limit: safeLimit,
        },
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
});

// DEACTIVATE USER (Admin only) - soft delete
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    // Prevent admin from deactivating themselves
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account',
      });
    }

    const result = await query(
      `UPDATE users SET is_active = false WHERE id = $1
       RETURNING id, email, first_name, last_name, role, is_active`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User deactivated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate user',
    });
  }
});

// CHANGE USER ROLE (Admin only)
router.put(
  '/:id/role',
  authenticate,
  authorize('admin'),
  [
    body('role')
      .notEmpty()
      .isIn(['traveler', 'guide', 'admin'])
      .withMessage('Role must be traveler, guide, or admin'),
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

      const { id } = req.params;
      const { role } = req.body;

      if (!isValidUUID(id)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID' });
      }

      // Prevent admin from changing their own role
      if (req.user.id === id) {
        return res.status(400).json({
          success: false,
          message: 'You cannot change your own role',
        });
      }

      const result = await query(
        `UPDATE users SET role = $1 WHERE id = $2
         RETURNING id, email, first_name, last_name, role`,
        [role, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // If changing to guide, create a guide profile if it doesn't exist
      if (role === 'guide') {
        await query(
          `INSERT INTO guide_profiles (user_id, languages)
           VALUES ($1, '{}')
           ON CONFLICT (user_id) DO NOTHING`,
          [id]
        );
      }

      res.json({
        success: true,
        message: `User role updated to ${role}`,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Change user role error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change user role',
      });
    }
  }
);

export default router;
