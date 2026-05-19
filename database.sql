-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.3000_rated_puzzles (
  Rated_id text NOT NULL,
  principle_id text,
  Fen text,
  CONSTRAINT 3000_rated_puzzles_pkey PRIMARY KEY (Rated_id)
);
CREATE TABLE public.Login (
  Chess_com_ID text NOT NULL,
  Player_Name text,
  email character varying,
  password character varying,
  Role text NOT NULL DEFAULT 'student'::text,
  otp text,
  otp_expires_at timestamp with time zone,
  CONSTRAINT Login_pkey PRIMARY KEY (Chess_com_ID)
);
CREATE TABLE public.brilliant_moves (
  id integer NOT NULL DEFAULT nextval('brilliant_moves_id_seq'::regclass),
  game_link text NOT NULL,
  chess_com_id text NOT NULL,
  player_name text NOT NULL,
  move_number integer NOT NULL,
  move_san text NOT NULL,
  move_uci text NOT NULL,
  player_color text NOT NULL,
  game_date date NOT NULL,
  white_player text NOT NULL,
  black_player text NOT NULL,
  game_result text NOT NULL,
  pgn_moves text NOT NULL,
  hanging_pieces text NOT NULL,
  analysis_depth integer NOT NULL,
  weighted_eval_score numeric,
  eval_summary text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fen_before_move text NOT NULL,
  fen_after_move text NOT NULL,
  move_from text NOT NULL,
  move_to text NOT NULL,
  captured_piece text,
  promotion text,
  CONSTRAINT brilliant_moves_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chapter (
  chapter_id text NOT NULL,
  chapter_name text,
  story_ids text,
  module_id text,
  order_index integer,
  CONSTRAINT chapter_pkey PRIMARY KEY (chapter_id)
);
CREATE TABLE public.chess_puzzle (
  chess_puzzle_id text NOT NULL,
  principle_id text,
  fen_with_move text,
  isdone boolean DEFAULT false,
  answer text,
  CONSTRAINT chess_puzzle_pkey PRIMARY KEY (chess_puzzle_id)
);
CREATE TABLE public.module (
  module_id text NOT NULL,
  module_name text,
  chapter_ids text,
  CONSTRAINT module_pkey PRIMARY KEY (module_id)
);
CREATE TABLE public.player_games (
  game_id bigint NOT NULL,
  chess_com_id character varying NOT NULL,
  game_date date NOT NULL,
  pgn text NOT NULL,
  white_player character varying,
  black_player character varying,
  is_brilliant_found boolean,
  brilliant_moves jsonb,
  CONSTRAINT player_games_pkey PRIMARY KEY (game_id)
);
CREATE TABLE public.players (
  Chess_com_ID text NOT NULL,
  Player_Name text,
  Joining_Date date,
  activity_tracker jsonb,
  current_elo integer,
  chess_profile_url text,
  chess_country_url text,
  rapid_rating integer,
  rapid_best integer,
  blitz_rating integer,
  blitz_best integer,
  bullet_rating integer,
  bullet_best integer,
  fide_rating integer,
  tactics_highest integer,
  puzzle_rush_best integer,
  chess_last_synced_at timestamp with time zone,
  CONSTRAINT players_pkey PRIMARY KEY (Chess_com_ID)
);
CREATE TABLE public.players_activity (
  Chess_com_ID text NOT NULL,
  index bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  status text,
  total_games integer,
  blitz_rating ARRAY,
  rapid_rating ARRAY,
  rapid_results ARRAY,
  blitz_results ARRAY,
  fetch_lock boolean,
  date text,
  blitz_times ARRAY,
  rapid_times ARRAY,
  CONSTRAINT players_activity_pkey PRIMARY KEY (index)
);
CREATE TABLE public.principle_position (
  principle_id text NOT NULL,
  principle text,
  fen_with_move text,
  puzzle_list text,
  isdone boolean DEFAULT false,
  CONSTRAINT principle_position_pkey PRIMARY KEY (principle_id)
);
CREATE TABLE public.principles (
  id text NOT NULL,
  name text NOT NULL,
  CONSTRAINT principles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.roles_control (
  role text NOT NULL,
  mod_access ARRAY,
  chap_access ARRAY,
  story_access ARRAY,
  CONSTRAINT roles_control_pkey PRIMARY KEY (role)
);
CREATE TABLE public.story (
  story_id text NOT NULL,
  title text,
  description text,
  chapter_id text,
  module_id text,
  status text DEFAULT 'published'::text,
  tags text DEFAULT '[]'::text,
  CONSTRAINT story_pkey PRIMARY KEY (story_id),
  CONSTRAINT story_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapter(chapter_id),
  CONSTRAINT story_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.module(module_id)
);
CREATE TABLE public.story_mapping (
  mapping_id text NOT NULL,
  story_id text,
  principle_id text,
  story_text text,
  isdone boolean DEFAULT false,
  CONSTRAINT story_mapping_pkey PRIMARY KEY (mapping_id),
  CONSTRAINT story_mapping_principle_id_fkey FOREIGN KEY (principle_id) REFERENCES public.principles(id),
  CONSTRAINT story_mapping_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.story(story_id)
);