-- ============================================
-- Touri Database Schema
-- PostgreSQL 14+
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

-- User roles for RBAC
CREATE TYPE user_role AS ENUM ('traveler', 'guide', 'admin');

-- Message status
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');

-- ============================================
-- USERS TABLE (RBAC - Role-Based Access Control)
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    age INTEGER CHECK (age >= 18 AND age <= 120),
    phone_number VARCHAR(20),
    role user_role NOT NULL,
    profile_image_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Index for faster queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================
-- GUIDE PROFILES TABLE
-- ============================================

CREATE TABLE guide_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    languages TEXT[] NOT NULL DEFAULT '{}', -- Array of languages
    years_of_experience INTEGER NOT NULL DEFAULT 0 CHECK (years_of_experience >= 0),
    hourly_rate DECIMAL(10, 2),
    daily_rate DECIMAL(10, 2),
    specialties TEXT[] DEFAULT '{}', -- Array of specialties
    city VARCHAR(100),
    country VARCHAR(100),
    certification_status BOOLEAN DEFAULT FALSE,
    certification_documents TEXT[], -- URLs to certification documents
    average_rating DECIMAL(3, 2) DEFAULT 0.0 CHECK (average_rating >= 0 AND average_rating <= 5),
    total_reviews INTEGER DEFAULT 0,
    total_tours_completed INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_rates CHECK (
        (hourly_rate IS NULL OR hourly_rate > 0) AND
        (daily_rate IS NULL OR daily_rate > 0)
    )
);

-- Index for faster queries
CREATE INDEX idx_guide_profiles_user_id ON guide_profiles(user_id);
CREATE INDEX idx_guide_profiles_city ON guide_profiles(city);
CREATE INDEX idx_guide_profiles_rating ON guide_profiles(average_rating DESC);
CREATE INDEX idx_guide_profiles_available ON guide_profiles(is_available);

-- ============================================
-- CHAT ROOMS TABLE
-- ============================================

CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    traveler_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT different_users CHECK (traveler_id != guide_id),
    CONSTRAINT unique_room UNIQUE(traveler_id, guide_id)
);

-- Index for faster queries
CREATE INDEX idx_chat_rooms_traveler ON chat_rooms(traveler_id);
CREATE INDEX idx_chat_rooms_guide ON chat_rooms(guide_id);
CREATE INDEX idx_chat_rooms_last_message ON chat_rooms(last_message_at DESC);

-- ============================================
-- MESSAGES TABLE (Socket.io Chat)
-- ============================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status message_status DEFAULT 'sent',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT message_not_empty CHECK (LENGTH(TRIM(message)) > 0)
);

-- Index for faster queries
CREATE INDEX idx_messages_room_id ON messages(room_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_unread ON messages(receiver_id, is_read) WHERE is_read = FALSE;

-- ============================================
-- BOOKINGS TABLE
-- ============================================

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    traveler_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    duration_hours INTEGER,
    total_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_price CHECK (total_price > 0),
    CONSTRAINT future_booking CHECK (booking_date >= CURRENT_DATE)
);

-- Index for faster queries
CREATE INDEX idx_bookings_traveler ON bookings(traveler_id);
CREATE INDEX idx_bookings_guide ON bookings(guide_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);

-- ============================================
-- REVIEWS TABLE
-- ============================================

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    traveler_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX idx_reviews_guide ON reviews(guide_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update guide rating
CREATE OR REPLACE FUNCTION update_guide_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE guide_profiles
    SET 
        average_rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM reviews
            WHERE guide_id = NEW.guide_id
        ),
        total_reviews = (
            SELECT COUNT(*)
            FROM reviews
            WHERE guide_id = NEW.guide_id
        )
    WHERE user_id = NEW.guide_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update last_message_at in chat_rooms
CREATE OR REPLACE FUNCTION update_room_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_rooms
    SET last_message_at = NEW.created_at
    WHERE id = NEW.room_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to auto-update updated_at for users
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at for guide_profiles
CREATE TRIGGER update_guide_profiles_updated_at
    BEFORE UPDATE ON guide_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at for bookings
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update guide rating after review insert/update
CREATE TRIGGER update_guide_rating_after_review
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_guide_rating();

-- Trigger to update chat room last_message_at
CREATE TRIGGER update_room_last_message_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_room_last_message();

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample traveler (password: password123)
INSERT INTO users (email, password_hash, first_name, last_name, age, phone_number, role)
VALUES (
    'traveler@example.com',
    '$2b$10$YourHashedPasswordHere', -- Replace with actual bcrypt hash
    'John',
    'Doe',
    30,
    '+1234567890',
    'traveler'
);

-- Insert sample guide (password: password123)
INSERT INTO users (email, password_hash, first_name, last_name, age, phone_number, role)
VALUES (
    'guide@example.com',
    '$2b$10$YourHashedPasswordHere', -- Replace with actual bcrypt hash
    'Maria',
    'Santos',
    28,
    '+34123456789',
    'guide'
);

-- Insert guide profile for the sample guide
INSERT INTO guide_profiles (
    user_id,
    bio,
    languages,
    years_of_experience,
    daily_rate,
    specialties,
    city,
    country,
    certification_status
)
VALUES (
    (SELECT id FROM users WHERE email = 'guide@example.com'),
    'Passionate about sharing Barcelona''s hidden gems and rich cultural history',
    ARRAY['English', 'Spanish', 'Catalan'],
    5,
    180.00,
    ARRAY['Architecture', 'Food Tours', 'History'],
    'Barcelona',
    'Spain',
    TRUE
);

-- ============================================
-- VIEWS (Optional - for easier queries)
-- ============================================

-- View: Complete guide information
CREATE VIEW guide_complete_info AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.phone_number,
    u.profile_image_url,
    u.created_at as user_created_at,
    gp.bio,
    gp.languages,
    gp.years_of_experience,
    gp.hourly_rate,
    gp.daily_rate,
    gp.specialties,
    gp.city,
    gp.country,
    gp.certification_status,
    gp.average_rating,
    gp.total_reviews,
    gp.total_tours_completed,
    gp.is_available
FROM users u
INNER JOIN guide_profiles gp ON u.id = gp.user_id
WHERE u.role = 'guide' AND u.is_active = TRUE;

-- View: Chat room with user details
CREATE VIEW chat_rooms_with_users AS
SELECT 
    cr.id as room_id,
    cr.created_at as room_created_at,
    cr.last_message_at,
    t.id as traveler_id,
    t.first_name as traveler_first_name,
    t.last_name as traveler_last_name,
    t.profile_image_url as traveler_image,
    g.id as guide_id,
    g.first_name as guide_first_name,
    g.last_name as guide_last_name,
    g.profile_image_url as guide_image
FROM chat_rooms cr
INNER JOIN users t ON cr.traveler_id = t.id
INNER JOIN users g ON cr.guide_id = g.id;

-- ============================================
-- GRANT PERMISSIONS (Adjust based on your user)
-- ============================================

Grant all privileges to your local dev user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_dev_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_dev_user;


-- Add email verification columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token) WHERE verification_token IS NOT NULL;


-- ============================================
-- END OF SCHEMA
-- ============================================
