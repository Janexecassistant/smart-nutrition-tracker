-- Add health_focus column to user_profiles
-- This stores health conditions like pregnancy, diabetic, celiac, etc.
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS health_focus text[] DEFAULT '{}';
