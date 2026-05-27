-- One-time migration: principles use sequential text IDs (P01, P02, P100, …).
-- Run in Supabase SQL Editor when principles.principleid is still uuid.

BEGIN;

ALTER TABLE public.storyprinciplemapping
  DROP CONSTRAINT IF EXISTS fk_spm_principle;

ALTER TABLE public.principles
  DROP CONSTRAINT IF EXISTS principles_pkey;

ALTER TABLE public.principles
  ADD COLUMN IF NOT EXISTS principleid_seq text;

WITH numbered AS (
  SELECT
    principleid AS old_uuid,
    row_number() OVER (ORDER BY created_at NULLS LAST, principlename) AS rn
  FROM public.principles
),
mapped AS (
  SELECT
    old_uuid,
    'P' || CASE
      WHEN rn < 100 THEN lpad(rn::text, 2, '0')
      ELSE rn::text
    END AS new_id
  FROM numbered
)
UPDATE public.principles p
SET principleid_seq = m.new_id
FROM mapped m
WHERE p.principleid = m.old_uuid;

UPDATE public.storyprinciplemapping spm
SET principleid = p.principleid_seq::text
FROM public.principles p
WHERE spm.principleid::text = p.principleid::text;

ALTER TABLE public.principles DROP COLUMN principleid;
ALTER TABLE public.principles RENAME COLUMN principleid_seq TO principleid;
ALTER TABLE public.principles ADD PRIMARY KEY (principleid);

ALTER TABLE public.storyprinciplemapping
  ALTER COLUMN principleid TYPE text USING principleid::text;

ALTER TABLE public.storyprinciplemapping
  ADD CONSTRAINT fk_spm_principle
  FOREIGN KEY (principleid) REFERENCES public.principles(principleid);

COMMIT;
