-- Clio's Gambit Local Database Schema

-- 1. Authentication & Users
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    player_name TEXT NOT NULL,
    role TEXT CHECK(role IN ('student', 'coach', 'admin')) DEFAULT 'student',
    chess_com_id TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Curriculum (Modules & Chapters)
CREATE TABLE IF NOT EXISTS modules (
    module_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    icon TEXT,
    level TEXT,
    order_index INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chapters (
    chapter_id TEXT PRIMARY KEY,
    module_id TEXT,
    title TEXT NOT NULL,
    order_index INTEGER,
    FOREIGN KEY (module_id) REFERENCES modules(module_id)
);

CREATE TABLE IF NOT EXISTS stories (
    story_id TEXT PRIMARY KEY,
    chapter_id TEXT,
    title TEXT NOT NULL,
    content TEXT,
    chess_data JSON, -- Stores FEN/PGN if applicable
    order_index INTEGER,
    FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id)
);

-- 3. Student Progress & Analytics
CREATE TABLE IF NOT EXISTS user_progress (
    user_id TEXT,
    story_id TEXT,
    completed BOOLEAN DEFAULT 0,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, story_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (story_id) REFERENCES stories(story_id)
);

CREATE TABLE IF NOT EXISTS puzzles (
    puzzle_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    fen TEXT NOT NULL,
    solution TEXT NOT NULL, -- JSON move list
    reward_points INTEGER DEFAULT 10,
    difficulty TEXT
);

-- Seed Data
INSERT OR IGNORE INTO users (user_id, email, password, player_name, role, is_active) 
VALUES 
('u1', 'shreyakshz@gmail.com', '$2b$10$UnKZhhHLGKDldcPWbEk3ZeAIEoA9pxkQF8.OeKL21BmwVa1fqPu8O', 'Shreyak', 'student', 1),
('u2', 'raghavendrak.bsc23@rvu.edu.in', '$2b$10$UnKZhhHLGKDldcPWbEk3ZeAIEoA9pxkQF8.OeKL21BmwVa1fqPu8O', 'Raghavendra', 'admin', 1);

INSERT OR IGNORE INTO modules (module_id, title, subtitle, level, order_index)
VALUES 
('m1', 'Opening Wisdom', 'Foundations of the board', 'Beginner', 1),
('m2', 'Midgame Strategy', 'The Art of the Exchange', 'Intermediate', 2);
