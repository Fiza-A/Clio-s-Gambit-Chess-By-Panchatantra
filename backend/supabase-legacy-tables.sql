-- Run this in Supabase → SQL Editor if your project has `stories` (content)
-- but is missing `story` / `story_mapping` required by the admin curriculum UI.
-- Safe to run multiple times (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS public.story (
  story_id text NOT NULL,
  title text,
  description text,
  chapter_id text,
  module_id text,
  status text DEFAULT 'published'::text,
  tags text DEFAULT '[]'::text,
  CONSTRAINT story_pkey PRIMARY KEY (story_id)
);

CREATE TABLE IF NOT EXISTS public.story_mapping (
  mapping_id text NOT NULL,
  story_id text,
  principle_id text,
  story_text text,
  isdone boolean DEFAULT false,
  CONSTRAINT story_mapping_pkey PRIMARY KEY (mapping_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'story_chapter_id_fkey'
  ) THEN
    ALTER TABLE public.story
      ADD CONSTRAINT story_chapter_id_fkey
      FOREIGN KEY (chapter_id) REFERENCES public.chapter(chapter_id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'story_chapter_id_fkey skipped: %', SQLERRM;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'story_module_id_fkey'
  ) THEN
    ALTER TABLE public.story
      ADD CONSTRAINT story_module_id_fkey
      FOREIGN KEY (module_id) REFERENCES public.module(module_id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'story_module_id_fkey skipped: %', SQLERRM;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'story_mapping_principle_id_fkey'
  ) THEN
    ALTER TABLE public.story_mapping
      ADD CONSTRAINT story_mapping_principle_id_fkey
      FOREIGN KEY (principle_id) REFERENCES public.principles(id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'story_mapping_principle_id_fkey skipped: %', SQLERRM;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'story_mapping_story_id_fkey'
  ) THEN
    ALTER TABLE public.story_mapping
      ADD CONSTRAINT story_mapping_story_id_fkey
      FOREIGN KEY (story_id) REFERENCES public.story(story_id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'story_mapping_story_id_fkey skipped: %', SQLERRM;
END $$;
