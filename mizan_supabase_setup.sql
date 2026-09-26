-- ==============================================================================
-- إعداد قاعدة البيانات السحابية المركزية لـ «منظومة ميزان للإدارة المدرسية والكنترول الذكي»
-- خطوات التفعيل (مرة واحدة فقط):
-- 1. افتح لوحة تحكم Supabase الخاصة بك -> اذهب إلى قسم (SQL Editor).
-- 2. انسخ هذا الكود بالكامل والصقه هناك ثم اضغط على زر (RUN).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.mizan_cloud_sync (
  school_code TEXT PRIMARY KEY,
  school_name TEXT DEFAULT '',
  school_level TEXT DEFAULT 'primary',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT DEFAULT 'الكنترول'
);

-- تفعيل سياسات الأمان السحابية للقراءة والكتابة والمزامنة بين المعلمين والإدارة
ALTER TABLE public.mizan_cloud_sync ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all mizan_cloud_sync" ON public.mizan_cloud_sync;
CREATE POLICY "Allow select for all mizan_cloud_sync" 
  ON public.mizan_cloud_sync FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for all mizan_cloud_sync" ON public.mizan_cloud_sync;
CREATE POLICY "Allow insert for all mizan_cloud_sync" 
  ON public.mizan_cloud_sync FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all mizan_cloud_sync" ON public.mizan_cloud_sync;
CREATE POLICY "Allow update for all mizan_cloud_sync" 
  ON public.mizan_cloud_sync FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete for all mizan_cloud_sync" ON public.mizan_cloud_sync;
CREATE POLICY "Allow delete for all mizan_cloud_sync" 
  ON public.mizan_cloud_sync FOR DELETE USING (true);

-- تفعيل البث اللحظي الفوري (Realtime Publication)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'mizan_cloud_sync'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mizan_cloud_sync;
  END IF;
END $$;
