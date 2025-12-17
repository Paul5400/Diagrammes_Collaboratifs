CREATE TABLE IF NOT EXISTS github_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_id TEXT NOT NULL UNIQUE,
    username VARCHAR(150),
    email VARCHAR(255) UNIQUE,
    avatar_url VARCHAR(500),
    access_token TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
