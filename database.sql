-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.Login (
  Chess_com_ID character varying NOT NULL,
  Player_Name character varying NOT NULL,
  email character varying,
  password character varying,
  Role character varying DEFAULT 'student'::character varying CHECK ("Role"::text = ANY (ARRAY['student'::character varying, 'coach'::character varying, 'admin'::character varying]::text[])),
  otp character varying,
  otp_expires_at timestamp with time zone,
  profile_image text,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT Login_pkey PRIMARY KEY (Chess_com_ID)
);
CREATE TABLE public.chapter (
  chapterid text NOT NULL,
  chaptername text NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  moduleid text,
  CONSTRAINT chapter_pkey PRIMARY KEY (chapterid),
  CONSTRAINT fk_chapter_module FOREIGN KEY (moduleid) REFERENCES public.module(moduleid)
);
CREATE TABLE public.module (
  moduleid text NOT NULL,
  modulename text NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT module_pkey PRIMARY KEY (moduleid)
);
CREATE TABLE public.principles (
  principleid text NOT NULL,
  principlename text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT principles_pkey PRIMARY KEY (principleid)
);
CREATE TABLE public.stories (
  storyid text NOT NULL,
  storytitle text NOT NULL,
  storydescription text,
  storyimages ARRAY,
  storytext text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  chapterid text,
  CONSTRAINT stories_pkey PRIMARY KEY (storyid),
  CONSTRAINT fk_story_chapter FOREIGN KEY (chapterid) REFERENCES public.chapter(chapterid)
);
CREATE TABLE public.storyprinciplemapping (
  storyid text NOT NULL,
  principleid text NOT NULL,
  CONSTRAINT storyprinciplemapping_pkey PRIMARY KEY (storyid, principleid),
  CONSTRAINT fk_spm_story FOREIGN KEY (storyid) REFERENCES public.stories(storyid),
  CONSTRAINT fk_spm_principle FOREIGN KEY (principleid) REFERENCES public.principles(principleid)
);