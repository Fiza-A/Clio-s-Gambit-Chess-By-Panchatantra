-- Optional one-time migration when stories.storyid is still uuid.
-- Principles: run database/migrations/principle-sequential-ids.sql if needed.
-- The backend also auto-migrates on first curriculum API call.

BEGIN;

ALTER TABLE public.storyprinciplemapping DROP CONSTRAINT IF EXISTS fk_spm_story;
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS fk_story_chapter;

ALTER TABLE public.stories ALTER COLUMN storyid DROP DEFAULT;

DO $$
DECLARE
  n int;
BEGIN
  SELECT COUNT(*) INTO n FROM public.stories;
  IF n = 0 THEN
    ALTER TABLE public.stories ALTER COLUMN storyid TYPE text;
    ALTER TABLE public.storyprinciplemapping ALTER COLUMN storyid TYPE text USING storyid::text;
  END IF;
END $$;

-- If you have existing story rows, restart the backend and create one entity;
-- ensureCurriculumIdsReady() will renumber stories to ST01, ST02, …

ALTER TABLE public.stories
  ADD CONSTRAINT fk_story_chapter FOREIGN KEY (chapterid) REFERENCES public.chapter(chapterid);

ALTER TABLE public.storyprinciplemapping
  ADD CONSTRAINT fk_spm_story FOREIGN KEY (storyid) REFERENCES public.stories(storyid);

COMMIT;
