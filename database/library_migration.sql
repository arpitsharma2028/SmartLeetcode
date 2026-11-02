-- Run in the Supabase SQL Editor for the project used by Smart Leetcode.
-- Safe to rerun: existing data is preserved and policies are recreated atomically.
BEGIN;

CREATE TABLE IF NOT EXISTS public.library_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name),
  UNIQUE (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.library_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source VARCHAR(30) NOT NULL CHECK (source IN ('smartleetcode', 'leetcode', 'gfg', 'other')),
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  external_url TEXT,
  title VARCHAR(255) NOT NULL,
  difficulty VARCHAR(10) NOT NULL DEFAULT 'Unknown' CHECK (difficulty IN ('Easy', 'Medium', 'Hard', 'Unknown')),
  topic VARCHAR(80),
  folder_id UUID,
  solved_external BOOLEAN NOT NULL DEFAULT FALSE,
  approach TEXT NOT NULL DEFAULT '',
  edge_cases TEXT NOT NULL DEFAULT '',
  solution_code TEXT NOT NULL DEFAULT '',
  language VARCHAR(50),
  time_complexity VARCHAR(80),
  space_complexity VARCHAR(80),
  review_step INT NOT NULL DEFAULT 0,
  next_review_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT library_item_source CHECK (
    (source = 'smartleetcode' AND question_id IS NOT NULL AND external_url IS NULL)
    OR (source <> 'smartleetcode' AND question_id IS NULL AND external_url IS NOT NULL)
  ),
  CONSTRAINT library_item_folder FOREIGN KEY (folder_id)
    REFERENCES public.library_folders(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS library_internal_unique ON public.library_items(user_id, question_id) WHERE question_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS library_external_unique ON public.library_items(user_id, external_url) WHERE external_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS library_due_index ON public.library_items(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS library_folder_index ON public.library_items(user_id, folder_id);

ALTER TABLE public.library_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO authenticated;
REVOKE ALL ON public.library_folders, public.library_items FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_folders, public.library_items TO authenticated;

DROP POLICY IF EXISTS library_folders_owner_select ON public.library_folders;
DROP POLICY IF EXISTS library_folders_owner_insert ON public.library_folders;
DROP POLICY IF EXISTS library_folders_owner_update ON public.library_folders;
DROP POLICY IF EXISTS library_folders_owner_delete ON public.library_folders;
DROP POLICY IF EXISTS library_items_owner_select ON public.library_items;
DROP POLICY IF EXISTS library_items_owner_insert ON public.library_items;
DROP POLICY IF EXISTS library_items_owner_update ON public.library_items;
DROP POLICY IF EXISTS library_items_owner_delete ON public.library_items;

CREATE POLICY library_folders_owner_select ON public.library_folders FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY library_folders_owner_insert ON public.library_folders FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY library_folders_owner_update ON public.library_folders FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY library_folders_owner_delete ON public.library_folders FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY library_items_owner_select ON public.library_items FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY library_items_owner_insert ON public.library_items FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY library_items_owner_update ON public.library_items FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY library_items_owner_delete ON public.library_items FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

COMMIT;
