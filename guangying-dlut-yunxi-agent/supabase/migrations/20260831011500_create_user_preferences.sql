CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY,
  preferred_style TEXT,
  preferred_colors TEXT[],
  preferred_scenes TEXT[],
  people_preference TEXT,
  clothing_mentioned TEXT,
  disliked_styles TEXT[] DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT NOW()
);
