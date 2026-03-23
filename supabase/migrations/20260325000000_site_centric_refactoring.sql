-- ============================================================================
-- Site-Centric Architecture Refactoring
-- ============================================================================
-- 목적: 현장(Site) 중심의 최적화된 데이터 아키텍처 구축
-- 보존: sites, profiles, user_roles, organizations 등 Master Data
-- 초기화: worklogs, documents, punch_groups 등 Transaction Data
-- 작성일: 2026-03-25
-- ============================================================================

-- ============================================================================
-- PHASE 1: Master Data 보존 및 확장
-- ============================================================================

-- 1.1. profiles 테이블에 daily_wage 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'daily_wage'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN daily_wage NUMERIC(10,2) DEFAULT 0 NOT NULL;
    
    COMMENT ON COLUMN public.profiles.daily_wage IS '작업자 일당 (급여 자동화용)';
  END IF;
END $$;

-- 1.2. admin_user_directory의 daily 정보를 profiles로 마이그레이션
UPDATE public.profiles p
SET daily_wage = COALESCE(aud.daily, 0)
FROM public.admin_user_directory aud
WHERE p.user_id = aud.linked_user_id
  AND aud.daily IS NOT NULL
  AND aud.daily > 0;

-- 1.3. profiles 테이블에 is_active 컬럼 추가 (없는 경우)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;
    
    COMMENT ON COLUMN public.profiles.is_active IS '활성 상태 (작업자 선택 시 필터링용)';
  END IF;
END $$;

-- ============================================================================
-- PHASE 2: Transaction Data 초기화
-- ============================================================================

-- 2.1. 기존 Transaction 테이블 데이터 삭제 (CASCADE로 자식 데이터도 함께 삭제)
TRUNCATE TABLE public.worklogs CASCADE;
TRUNCATE TABLE public.documents CASCADE;
TRUNCATE TABLE public.punch_groups CASCADE;
TRUNCATE TABLE public.partner_deployments CASCADE;

-- 2.2. orphans 테이블 완전 삭제
DROP TABLE IF EXISTS public.worklogs_orphans CASCADE;
DROP TABLE IF EXISTS public.documents_orphans CASCADE;
DROP TABLE IF EXISTS public.worklog_manpower_orphans CASCADE;
DROP TABLE IF EXISTS public.worklog_materials_orphans CASCADE;
DROP TABLE IF EXISTS public.worklog_worksets_orphans CASCADE;
DROP TABLE IF EXISTS public.punch_groups_orphans CASCADE;
DROP TABLE IF EXISTS public.punch_items_orphans CASCADE;
DROP TABLE IF EXISTS public.partner_deployments_orphans CASCADE;
DROP TABLE IF EXISTS public.site_lodgings_orphans CASCADE;

-- 2.3. 기존 테이블 삭제 (재설계를 위해)
DROP TABLE IF EXISTS public.worklog_manpower CASCADE;
DROP TABLE IF EXISTS public.worklog_materials CASCADE;
DROP TABLE IF EXISTS public.worklog_worksets CASCADE;
DROP TABLE IF EXISTS public.worklogs CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.punch_items CASCADE;
DROP TABLE IF EXISTS public.punch_groups CASCADE;

-- ============================================================================
-- PHASE 3: 새로운 테이블 생성 (현장 중심 아키텍처)
-- ============================================================================

-- 3.1. worklogs 테이블 재설계
CREATE TABLE IF NOT EXISTS public.worklogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  dept TEXT NULL,
  weather TEXT NULL,
  memo TEXT NULL,
  approved_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ NULL,
  rejected_reason TEXT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  search_vector tsvector NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 중복 방지: 같은 현장, 같은 날짜, 같은 작성자는 하나의 일지만 생성 가능
CREATE UNIQUE INDEX IF NOT EXISTS idx_worklogs_unique_site_date_creator
ON public.worklogs(site_id, work_date, created_by);

-- 검색 최적화
CREATE INDEX IF NOT EXISTS idx_worklogs_site_id ON public.worklogs(site_id);
CREATE INDEX IF NOT EXISTS idx_worklogs_work_date ON public.worklogs(work_date DESC);
CREATE INDEX IF NOT EXISTS idx_worklogs_status ON public.worklogs(status);
CREATE INDEX IF NOT EXISTS idx_worklogs_created_by ON public.worklogs(created_by);
CREATE INDEX IF NOT EXISTS idx_worklogs_search_vector ON public.worklogs USING gin(search_vector);

COMMENT ON TABLE public.worklogs IS '작업일지 (현장 중심 재설계)';
COMMENT ON COLUMN public.worklogs.status IS 'draft: 임시저장, pending: 승인요청, approved: 승인완료, rejected: 반려';
COMMENT ON COLUMN public.worklogs.memo IS '메모 (선택값, nullable)';

-- 3.2. worklog_workers 테이블 (FK 기반 작업자 관리)
CREATE TABLE IF NOT EXISTS public.worklog_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worklog_id UUID NOT NULL REFERENCES public.worklogs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_name TEXT NOT NULL,
  work_hours NUMERIC(4,2) NOT NULL DEFAULT 8.0,
  daily_wage NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_worklog_workers_worklog_id ON public.worklog_workers(worklog_id);
CREATE INDEX IF NOT EXISTS idx_worklog_workers_user_id ON public.worklog_workers(user_id);

COMMENT ON TABLE public.worklog_workers IS '작업일지 작업자 목록 (FK 기반, 실시간 동기화 가능)';
COMMENT ON COLUMN public.worklog_workers.worker_name IS '작업자명 (denormalized for display)';
COMMENT ON COLUMN public.worklog_workers.daily_wage IS '일당 스냅샷 (작성 시점 단가 저장)';
COMMENT ON COLUMN public.worklog_workers.is_primary IS '주 작성자 여부';

-- 3.3. worklog_materials 테이블
CREATE TABLE IF NOT EXISTS public.worklog_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worklog_id UUID NOT NULL REFERENCES public.worklogs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  qty NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_worklog_materials_worklog_id ON public.worklog_materials(worklog_id);

COMMENT ON TABLE public.worklog_materials IS '작업일지 자재 목록';

-- 3.4. worklog_worksets 테이블
CREATE TABLE IF NOT EXISTS public.worklog_worksets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worklog_id UUID NOT NULL REFERENCES public.worklogs(id) ON DELETE CASCADE,
  member TEXT NULL,
  process TEXT NULL,
  work_type TEXT NULL,
  block TEXT NULL,
  dong TEXT NULL,
  floor TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_worklog_worksets_worklog_id ON public.worklog_worksets(worklog_id);

COMMENT ON TABLE public.worklog_worksets IS '작업일지 작업 세트';

-- 3.5. site_documents 테이블 (통합 문서 관리)
CREATE TABLE IF NOT EXISTS public.site_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('photo', 'drawing', 'confirmation', 'other')),
  title TEXT NOT NULL DEFAULT '',
  file_path TEXT NOT NULL,
  file_url TEXT NULL,
  file_size BIGINT NULL,
  file_ext TEXT NULL,
  thumbnail_path TEXT NULL,
  work_date DATE NULL,
  worklog_id UUID NULL REFERENCES public.worklogs(id) ON DELETE SET NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge TEXT NULL,
  search_vector tsvector NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_documents_site_id ON public.site_documents(site_id);
CREATE INDEX IF NOT EXISTS idx_site_documents_doc_type ON public.site_documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_site_documents_work_date ON public.site_documents(work_date DESC);
CREATE INDEX IF NOT EXISTS idx_site_documents_worklog_id ON public.site_documents(worklog_id);
CREATE INDEX IF NOT EXISTS idx_site_documents_uploaded_by ON public.site_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_site_documents_search_vector ON public.site_documents USING gin(search_vector);

COMMENT ON TABLE public.site_documents IS '현장 문서 통합 관리 (사진, 도면, 확인서 등)';
COMMENT ON COLUMN public.site_documents.file_path IS 'Storage 경로: site_id/date/type/original/uuid.ext';
COMMENT ON COLUMN public.site_documents.thumbnail_path IS '썸네일 경로 (이미지 최적화용)';

-- 3.6. drawing_markings 테이블 (도면 마킹 데이터)
CREATE TABLE IF NOT EXISTS public.drawing_markings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.site_documents(id) ON DELETE CASCADE,
  marking_data JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drawing_markings_document_id ON public.drawing_markings(document_id);
CREATE INDEX IF NOT EXISTS idx_drawing_markings_created_by ON public.drawing_markings(created_by);
CREATE INDEX IF NOT EXISTS idx_drawing_markings_data ON public.drawing_markings USING gin(marking_data);

COMMENT ON TABLE public.drawing_markings IS '도면 마킹 데이터 (JSONB 기반 유연한 구조)';
COMMENT ON COLUMN public.drawing_markings.marking_data IS 'JSON 구조: {type, coordinates, color, text, photo_url, ...}';

-- 3.7. punch_lists 테이블 (지적사항 그룹, 기존 punch_groups)
CREATE TABLE IF NOT EXISTS public.punch_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  punch_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  search_vector tsvector NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_punch_lists_site_id ON public.punch_lists(site_id);
CREATE INDEX IF NOT EXISTS idx_punch_lists_punch_date ON public.punch_lists(punch_date DESC);
CREATE INDEX IF NOT EXISTS idx_punch_lists_status ON public.punch_lists(status);
CREATE INDEX IF NOT EXISTS idx_punch_lists_search_vector ON public.punch_lists USING gin(search_vector);

COMMENT ON TABLE public.punch_lists IS '지적사항 목록 (현장별 관리)';

-- 3.8. punch_items 테이블
CREATE TABLE IF NOT EXISTS public.punch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  punch_list_id UUID NOT NULL REFERENCES public.punch_lists(id) ON DELETE CASCADE,
  issue TEXT NOT NULL,
  location TEXT NULL,
  assignee UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'verified')),
  due_date DATE NULL,
  before_photo UUID NULL REFERENCES public.site_documents(id) ON DELETE SET NULL,
  after_photo UUID NULL REFERENCES public.site_documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_punch_items_punch_list_id ON public.punch_items(punch_list_id);
CREATE INDEX IF NOT EXISTS idx_punch_items_assignee ON public.punch_items(assignee);
CREATE INDEX IF NOT EXISTS idx_punch_items_status ON public.punch_items(status);
CREATE INDEX IF NOT EXISTS idx_punch_items_priority ON public.punch_items(priority);

COMMENT ON TABLE public.punch_items IS '지적사항 세부 항목';
COMMENT ON COLUMN public.punch_items.assignee IS '담당자 (FK to users)';
COMMENT ON COLUMN public.punch_items.before_photo IS '조치 전 사진 (FK to site_documents)';
COMMENT ON COLUMN public.punch_items.after_photo IS '조치 후 사진 (FK to site_documents)';

-- 3.9. site_wages 테이블 (급여 자동화)
CREATE TABLE IF NOT EXISTS public.site_wages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  worklog_id UUID NOT NULL REFERENCES public.worklogs(id) ON DELETE CASCADE,
  work_hours NUMERIC(4,2) NOT NULL DEFAULT 8.0,
  daily_wage NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) GENERATED ALWAYS AS (work_hours * daily_wage) STORED,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  approved_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_wages_site_id ON public.site_wages(site_id);
CREATE INDEX IF NOT EXISTS idx_site_wages_user_id ON public.site_wages(user_id);
CREATE INDEX IF NOT EXISTS idx_site_wages_work_date ON public.site_wages(work_date DESC);
CREATE INDEX IF NOT EXISTS idx_site_wages_worklog_id ON public.site_wages(worklog_id);
CREATE INDEX IF NOT EXISTS idx_site_wages_status ON public.site_wages(status);

COMMENT ON TABLE public.site_wages IS '급여 자동화 (일지 승인 시 자동 생성)';
COMMENT ON COLUMN public.site_wages.total_amount IS '총 금액 (work_hours * daily_wage, 자동 계산)';

-- ============================================================================
-- PHASE 4: Trigger 함수 생성
-- ============================================================================

-- 4.1. updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.2. worklogs updated_at 트리거
DROP TRIGGER IF EXISTS trg_worklogs_updated_at ON public.worklogs;
CREATE TRIGGER trg_worklogs_updated_at
BEFORE UPDATE ON public.worklogs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 4.3. site_documents updated_at 트리거
DROP TRIGGER IF EXISTS trg_site_documents_updated_at ON public.site_documents;
CREATE TRIGGER trg_site_documents_updated_at
BEFORE UPDATE ON public.site_documents
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 4.4. drawing_markings updated_at 트리거
DROP TRIGGER IF EXISTS trg_drawing_markings_updated_at ON public.drawing_markings;
CREATE TRIGGER trg_drawing_markings_updated_at
BEFORE UPDATE ON public.drawing_markings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 4.5. punch_lists updated_at 트리거
DROP TRIGGER IF EXISTS trg_punch_lists_updated_at ON public.punch_lists;
CREATE TRIGGER trg_punch_lists_updated_at
BEFORE UPDATE ON public.punch_lists
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 4.6. punch_items updated_at 트리거
DROP TRIGGER IF EXISTS trg_punch_items_updated_at ON public.punch_items;
CREATE TRIGGER trg_punch_items_updated_at
BEFORE UPDATE ON public.punch_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 4.7. site_wages updated_at 트리거
DROP TRIGGER IF EXISTS trg_site_wages_updated_at ON public.site_wages;
CREATE TRIGGER trg_site_wages_updated_at
BEFORE UPDATE ON public.site_wages
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 4.8. 급여 자동 생성 트리거 함수 (핵심!)
CREATE OR REPLACE FUNCTION public.auto_create_wages()
RETURNS TRIGGER AS $$
BEGIN
  -- 승인 상태로 변경되었을 때만 실행
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- 해당 일지의 모든 작업자에 대해 급여 생성
    INSERT INTO public.site_wages (
      site_id,
      user_id,
      work_date,
      worklog_id,
      work_hours,
      daily_wage,
      status,
      approved_by,
      approved_at
    )
    SELECT
      NEW.site_id,
      ww.user_id,
      NEW.work_date,
      NEW.id,
      ww.work_hours,
      ww.daily_wage,
      'approved',
      NEW.approved_by,
      NEW.approved_at
    FROM public.worklog_workers ww
    WHERE ww.worklog_id = NEW.id
    ON CONFLICT DO NOTHING; -- 중복 방지
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_create_wages ON public.worklogs;
CREATE TRIGGER trg_auto_create_wages
AFTER INSERT OR UPDATE ON public.worklogs
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_wages();

COMMENT ON FUNCTION public.auto_create_wages IS '일지 승인 시 급여 자동 생성';

-- ============================================================================
-- PHASE 5: RLS (Row Level Security) 정책 적용
-- ============================================================================

-- 5.1. RLS 활성화
ALTER TABLE public.worklogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worklog_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worklog_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worklog_worksets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drawing_markings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.punch_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.punch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_wages ENABLE ROW LEVEL SECURITY;

-- 5.2. 기존 정책 삭제 (재생성을 위해)
DO $$
DECLARE
  v_policy RECORD;
BEGIN
  FOR v_policy IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'worklogs', 'worklog_workers', 'worklog_materials', 'worklog_worksets',
        'site_documents', 'drawing_markings', 'punch_lists', 'punch_items', 'site_wages'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_policy.policyname, v_policy.tablename);
  END LOOP;
END $$;

-- 5.3. worklogs RLS 정책
CREATE POLICY "worklogs_select_scoped"
ON public.worklogs
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR (
    public.has_role(auth.uid(), 'worker')
    AND public.can_access_site(site_id, auth.uid())
  )
  OR (
    public.has_role(auth.uid(), 'partner')
    AND public.can_access_site(site_id, auth.uid())
  )
);

CREATE POLICY "worklogs_insert_worker"
ON public.worklogs
FOR INSERT
TO authenticated
WITH CHECK (
  (
    public.has_role(auth.uid(), 'worker')
    AND created_by = auth.uid()
    AND public.can_access_site(site_id, auth.uid())
  )
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "worklogs_update_own_or_admin"
ON public.worklogs
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR (
    public.has_role(auth.uid(), 'worker')
    AND created_by = auth.uid()
    AND status IN ('draft', 'pending')
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR (
    public.has_role(auth.uid(), 'worker')
    AND created_by = auth.uid()
    AND status IN ('draft', 'pending')
  )
);

CREATE POLICY "worklogs_delete_own_draft"
ON public.worklogs
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR (
    public.has_role(auth.uid(), 'worker')
    AND created_by = auth.uid()
    AND status = 'draft'
  )
);

-- 5.4. worklog_workers RLS 정책
CREATE POLICY "worklog_workers_select_scoped"
ON public.worklog_workers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.worklogs w
    WHERE w.id = worklog_id
      AND (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'manager')
        OR public.can_access_site(w.site_id, auth.uid())
      )
  )
);

CREATE POLICY "worklog_workers_write_worklog_owner"
ON public.worklog_workers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.worklogs w
    WHERE w.id = worklog_id
      AND (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'manager')
        OR (w.created_by = auth.uid() AND w.status IN ('draft', 'pending'))
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.worklogs w
    WHERE w.id = worklog_id
      AND (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'manager')
        OR (w.created_by = auth.uid() AND w.status IN ('draft', 'pending'))
      )
  )
);

-- 5.5. worklog_materials RLS 정책
CREATE POLICY "worklog_materials_select_scoped"
ON public.worklog_materials
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.worklogs w
    WHERE w.id = worklog_id
      AND (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'manager')
        OR public.can_access_site(w.site_id, auth.uid())
      )
  )
);

CREATE POLICY "worklog_materials_write_worklog_owner"
ON public.worklog_materials
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.worklogs w
    WHERE w.id = worklog_id
      AND (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'manager')
        OR (w.created_by = auth.uid() AND w.status IN ('draft', 'pending'))
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.worklogs w
    WHERE w.id = worklog_id
      AND (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'manager')
        OR (w.created_by = auth.uid() AND w.status IN ('draft', 'pending'))
      )
  )
);

-- 5.6. worklog_worksets RLS 정책
CREATE POLICY "worklog_worksets_select_scoped"
ON public.worklog_worksets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.worklogs w
    WHERE w.id = worklog_id
      AND (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'manager')
        OR public.can_access_site(w.site_id, auth.uid())
      )
  )
);

CREATE POLICY "worklog_worksets_write_worklog_owner"
ON public.worklog_worksets
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.worklogs w
    WHERE w.id = worklog_id
      AND (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'manager')
        OR (w.created_by = auth.uid() AND w.status IN ('draft', 'pending'))
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.worklogs w
    WHERE w.id = worklog_id
      AND (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'manager')
        OR (w.created_by = auth.uid() AND w.status IN ('draft', 'pending'))
      )
  )
);

-- 5.7. site_documents RLS 정책
CREATE POLICY "site_documents_select_scoped"
ON public.site_documents
FOR SELECT
TO authenticated
USING (public.can_access_site(site_id, auth.uid()));

CREATE POLICY "site_documents_insert_scoped"
ON public.site_documents
FOR INSERT
TO authenticated
WITH CHECK (
  public.can_access_site(site_id, auth.uid())
  AND uploaded_by = auth.uid()
  AND NOT public.has_role(auth.uid(), 'partner')
);

CREATE POLICY "site_documents_update_own_or_admin"
ON public.site_documents
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR uploaded_by = auth.uid()
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR uploaded_by = auth.uid()
);

CREATE POLICY "site_documents_delete_own_or_admin"
ON public.site_documents
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR uploaded_by = auth.uid()
);

-- 5.8. drawing_markings RLS 정책
CREATE POLICY "drawing_markings_select_scoped"
ON public.drawing_markings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.site_documents sd
    WHERE sd.id = document_id
      AND public.can_access_site(sd.site_id, auth.uid())
  )
);

CREATE POLICY "drawing_markings_insert_scoped"
ON public.drawing_markings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.site_documents sd
    WHERE sd.id = document_id
      AND public.can_access_site(sd.site_id, auth.uid())
      AND NOT public.has_role(auth.uid(), 'partner')
  )
  AND created_by = auth.uid()
);

CREATE POLICY "drawing_markings_update_own_or_admin"
ON public.drawing_markings
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR created_by = auth.uid()
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR created_by = auth.uid()
);

CREATE POLICY "drawing_markings_delete_own_or_admin"
ON public.drawing_markings
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR created_by = auth.uid()
);

-- 5.9. punch_lists RLS 정책
CREATE POLICY "punch_lists_select_scoped"
ON public.punch_lists
FOR SELECT
TO authenticated
USING (public.can_access_site(site_id, auth.uid()));

CREATE POLICY "punch_lists_write_admin_manager"
ON public.punch_lists
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

-- 5.10. punch_items RLS 정책
CREATE POLICY "punch_items_select_scoped"
ON public.punch_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.punch_lists pl
    WHERE pl.id = punch_list_id
      AND public.can_access_site(pl.site_id, auth.uid())
  )
);

CREATE POLICY "punch_items_write_admin_manager"
ON public.punch_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.punch_lists pl
    WHERE pl.id = punch_list_id
      AND (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'manager')
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.punch_lists pl
    WHERE pl.id = punch_list_id
      AND (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'manager')
      )
  )
);

-- 5.11. site_wages RLS 정책
CREATE POLICY "site_wages_select_own_or_admin"
ON public.site_wages
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR user_id = auth.uid()
);

CREATE POLICY "site_wages_write_admin_only"
ON public.site_wages
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- PHASE 6: 검색 벡터 업데이트 함수
-- ============================================================================

-- 6.1. worklogs 검색 벡터 업데이트
CREATE OR REPLACE FUNCTION public.update_worklogs_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    COALESCE(NEW.dept, '') || ' ' ||
    COALESCE(NEW.weather, '') || ' ' ||
    COALESCE(NEW.memo, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_worklogs_search_vector ON public.worklogs;
CREATE TRIGGER trg_worklogs_search_vector
BEFORE INSERT OR UPDATE ON public.worklogs
FOR EACH ROW
EXECUTE FUNCTION public.update_worklogs_search_vector();

-- 6.2. site_documents 검색 벡터 업데이트
CREATE OR REPLACE FUNCTION public.update_site_documents_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.badge, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_site_documents_search_vector ON public.site_documents;
CREATE TRIGGER trg_site_documents_search_vector
BEFORE INSERT OR UPDATE ON public.site_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_site_documents_search_vector();

-- ============================================================================
-- PHASE 7: 완료 메시지
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Site-Centric Architecture Refactoring 완료!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ Master Data 보존 완료 (sites, profiles, user_roles, organizations)';
  RAISE NOTICE '✅ profiles 테이블에 daily_wage 컬럼 추가 및 데이터 마이그레이션 완료';
  RAISE NOTICE '✅ Transaction Data 초기화 완료 (worklogs, documents, punch_groups 등)';
  RAISE NOTICE '✅ orphans 테이블 9개 삭제 완료';
  RAISE NOTICE '✅ 새로운 테이블 생성 완료 (worklogs, worklog_workers, site_documents, drawing_markings, punch_lists, site_wages)';
  RAISE NOTICE '✅ FK 제약조건 및 UNIQUE 인덱스 설정 완료';
  RAISE NOTICE '✅ RLS 정책 적용 완료 (4가지 역할: admin, manager, worker, partner)';
  RAISE NOTICE '✅ 급여 자동화 Trigger 생성 완료';
  RAISE NOTICE '✅ 검색 벡터 자동 업데이트 Trigger 생성 완료';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '다음 단계: TypeScript 타입 재생성 필요';
  RAISE NOTICE 'npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts';
  RAISE NOTICE '============================================================================';
END $$;
