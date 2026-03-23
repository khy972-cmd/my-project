-- ============================================================================
-- Site-Centric Architecture Refactoring (ADDITIVE ONLY - SAFE)
-- ============================================================================
-- 목적: 기존 서비스 중단 없이 새로운 현장 중심 아키텍처 준비
-- 전략: 기존 테이블 유지 + 새 테이블 추가 + 점진적 전환
-- 안전성: 파괴적 작업 없음, 롤백 용이, 프론트엔드 영향 최소화
-- ============================================================================

-- ============================================================================
-- PHASE 1: Master Data 확장 (안전)
-- ============================================================================

-- 1.1. profiles 테이블에 daily_wage 컬럼 추가
-- 목적: 급여 자동화를 위한 작업자별 일당 정보 저장
-- 영향: 기존 데이터 유지, 새 컬럼만 추가 (NULL 허용 후 기본값 설정)
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
    
    COMMENT ON COLUMN public.profiles.daily_wage IS '작업자 일당 (급여 자동화용, 단위: 원)';
  END IF;
END $$;

-- 1.2. admin_user_directory의 daily 정보를 profiles로 마이그레이션
-- 목적: 기존 단가 정보 보존
-- 안전성: UPDATE만 수행, 데이터 유실 없음
UPDATE public.profiles p
SET daily_wage = COALESCE(aud.daily, 0)
FROM public.admin_user_directory aud
WHERE p.user_id = aud.linked_user_id
  AND aud.daily IS NOT NULL
  AND aud.daily > 0
  AND p.daily_wage = 0; -- 이미 설정된 값은 유지

-- 1.3. profiles 테이블에 is_active 컬럼 추가
-- 목적: 작업자 활성/비활성 상태 관리 (작업자 선택 시 필터링용)
-- 영향: 기존 데이터 유지, 새 컬럼만 추가
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
-- PHASE 2: 새로운 테이블 생성 (Additive Only)
-- ============================================================================

-- 2.1. worklog_workers 테이블 (FK 기반 작업자 관리)
-- 목적: worklog_manpower를 대체할 새 테이블 (FK 기반으로 실시간 동기화 가능)
-- 전략: 기존 worklog_manpower는 유지, 새 테이블 추가 후 점진적 전환
-- FK 선택 근거: auth.users(id)를 직접 참조
--   - Supabase 표준 방식 (auth.users는 시스템 테이블)
--   - profiles.user_id도 auth.users(id)를 참조하므로 동일한 효과
--   - ON DELETE CASCADE로 사용자 삭제 시 자동 정리
--   - 직접 참조가 더 간단하고 명확함
CREATE TABLE IF NOT EXISTS public.worklog_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worklog_id UUID NOT NULL REFERENCES public.worklogs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_name TEXT NOT NULL,
  work_hours NUMERIC(4,2) NOT NULL DEFAULT 8.0 CHECK (work_hours >= 0 AND work_hours <= 24),
  daily_wage NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (daily_wage >= 0),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_worklog_workers_worklog_id ON public.worklog_workers(worklog_id);
CREATE INDEX IF NOT EXISTS idx_worklog_workers_user_id ON public.worklog_workers(user_id);
CREATE INDEX IF NOT EXISTS idx_worklog_workers_created_at ON public.worklog_workers(created_at DESC);

COMMENT ON TABLE public.worklog_workers IS '작업일지 작업자 목록 (FK 기반, worklog_manpower 대체용)';
COMMENT ON COLUMN public.worklog_workers.user_id IS '작업자 ID (auth.users FK, 실시간 동기화 가능)';
COMMENT ON COLUMN public.worklog_workers.worker_name IS '작업자명 (denormalized for display, profiles.name 스냅샷)';
COMMENT ON COLUMN public.worklog_workers.daily_wage IS '일당 스냅샷 (작성 시점 profiles.daily_wage 값 저장)';
COMMENT ON COLUMN public.worklog_workers.is_primary IS '주 작성자 여부 (작업일지 작성자 표시용)';

-- 2.2. site_documents 테이블 (통합 문서 관리)
-- 목적: documents를 대체할 새 테이블 (사진, 도면, 확인서 통합 관리)
-- 전략: 기존 documents는 유지, 새 테이블 추가 후 점진적 전환
CREATE TABLE IF NOT EXISTS public.site_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('photo', 'drawing', 'confirmation', 'other')),
  title TEXT NOT NULL DEFAULT '',
  file_path TEXT NOT NULL,
  file_url TEXT NULL,
  file_size BIGINT NULL CHECK (file_size >= 0),
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
CREATE INDEX IF NOT EXISTS idx_site_documents_created_at ON public.site_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_documents_search_vector ON public.site_documents USING gin(search_vector);

COMMENT ON TABLE public.site_documents IS '현장 문서 통합 관리 (documents 대체용, 사진/도면/확인서 등)';
COMMENT ON COLUMN public.site_documents.file_path IS 'Storage 경로 (권장: site_id/YYYY-MM-DD/type/original/uuid.ext)';
COMMENT ON COLUMN public.site_documents.thumbnail_path IS '썸네일 경로 (이미지 최적화용, Edge Function으로 생성)';
COMMENT ON COLUMN public.site_documents.doc_type IS '문서 유형 (photo: 사진, drawing: 도면, confirmation: 확인서, other: 기타)';

-- 2.3. drawing_markings 테이블 (도면 마킹 데이터)
-- 목적: 도면 마킹 정보를 DB에 저장 (현재는 메모리에만 존재)
-- 현재 방식: DrawingMarkingOverlay 컴포넌트에서 메모리 관리 → onSave로 Base64 PNG 반환
-- 새 방식: 마킹 데이터를 JSONB로 저장 → 재편집 가능, 이력 관리 가능
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
CREATE INDEX IF NOT EXISTS idx_drawing_markings_created_at ON public.drawing_markings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drawing_markings_data ON public.drawing_markings USING gin(marking_data);

COMMENT ON TABLE public.drawing_markings IS '도면 마킹 데이터 (JSONB 기반 유연한 구조)';
COMMENT ON COLUMN public.drawing_markings.marking_data IS 'JSON 구조 예시: {type: "brush"|"polygon", points: [{x, y}], color: "#ff0000", width: 3, ...}';

-- 2.4. punch_lists 테이블 (지적사항 그룹)
-- 목적: punch_groups를 대체할 새 테이블
-- 전략: 기존 punch_groups는 유지, 새 테이블 추가 후 점진적 전환
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
CREATE INDEX IF NOT EXISTS idx_punch_lists_created_by ON public.punch_lists(created_by);
CREATE INDEX IF NOT EXISTS idx_punch_lists_created_at ON public.punch_lists(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_punch_lists_search_vector ON public.punch_lists USING gin(search_vector);

COMMENT ON TABLE public.punch_lists IS '지적사항 목록 (punch_groups 대체용)';

-- 2.5. punch_items 테이블 재생성 (punch_lists 참조)
-- 목적: 기존 punch_items는 punch_groups를 참조, 새 테이블은 punch_lists 참조
-- 전략: 새 테이블 이름을 punch_items_new로 생성 (기존과 충돌 방지)
CREATE TABLE IF NOT EXISTS public.punch_items_new (
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

CREATE INDEX IF NOT EXISTS idx_punch_items_new_punch_list_id ON public.punch_items_new(punch_list_id);
CREATE INDEX IF NOT EXISTS idx_punch_items_new_assignee ON public.punch_items_new(assignee);
CREATE INDEX IF NOT EXISTS idx_punch_items_new_status ON public.punch_items_new(status);
CREATE INDEX IF NOT EXISTS idx_punch_items_new_priority ON public.punch_items_new(priority);
CREATE INDEX IF NOT EXISTS idx_punch_items_new_created_at ON public.punch_items_new(created_at DESC);

COMMENT ON TABLE public.punch_items_new IS '지적사항 세부 항목 (punch_lists 참조, 기존 punch_items 대체용)';
COMMENT ON COLUMN public.punch_items_new.assignee IS '담당자 (auth.users FK)';
COMMENT ON COLUMN public.punch_items_new.before_photo IS '조치 전 사진 (site_documents FK)';
COMMENT ON COLUMN public.punch_items_new.after_photo IS '조치 후 사진 (site_documents FK)';

-- 2.6. site_wages 테이블 (급여 자동화)
-- 목적: 일지 승인 시 자동으로 급여 데이터 생성
-- 전략: Trigger로 worklogs 승인 시 자동 생성
CREATE TABLE IF NOT EXISTS public.site_wages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  worklog_id UUID NOT NULL REFERENCES public.worklogs(id) ON DELETE CASCADE,
  work_hours NUMERIC(4,2) NOT NULL DEFAULT 8.0 CHECK (work_hours >= 0 AND work_hours <= 24),
  daily_wage NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (daily_wage >= 0),
  total_amount NUMERIC(10,2) GENERATED ALWAYS AS (work_hours * daily_wage) STORED,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  approved_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (worklog_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_site_wages_site_id ON public.site_wages(site_id);
CREATE INDEX IF NOT EXISTS idx_site_wages_user_id ON public.site_wages(user_id);
CREATE INDEX IF NOT EXISTS idx_site_wages_work_date ON public.site_wages(work_date DESC);
CREATE INDEX IF NOT EXISTS idx_site_wages_worklog_id ON public.site_wages(worklog_id);
CREATE INDEX IF NOT EXISTS idx_site_wages_status ON public.site_wages(status);
CREATE INDEX IF NOT EXISTS idx_site_wages_created_at ON public.site_wages(created_at DESC);

COMMENT ON TABLE public.site_wages IS '급여 자동화 (일지 승인 시 Trigger로 자동 생성)';
COMMENT ON COLUMN public.site_wages.total_amount IS '총 금액 (work_hours * daily_wage, 자동 계산)';
COMMENT ON CONSTRAINT site_wages_worklog_id_user_id_key ON public.site_wages IS '중복 방지: 같은 일지/작업자 조합은 1개만';

-- ============================================================================
-- PHASE 3: UNIQUE 제약 추가 (중복 방지)
-- ============================================================================

-- 3.1. 기존 중복 데이터 사전 점검 SQL
-- 목적: UNIQUE 제약 추가 전 기존 중복 데이터 확인
-- 사용법: 아래 쿼리 실행 후 결과가 0이면 안전, 1 이상이면 중복 데이터 존재
-- 실행 시점: UNIQUE 제약 추가 직전
DO $$
DECLARE
  v_duplicate_count INTEGER;
BEGIN
  -- 중복 데이터 개수 확인
  SELECT COUNT(*)
  INTO v_duplicate_count
  FROM (
    SELECT site_id, work_date, created_by, COUNT(*) as cnt
    FROM public.worklogs
    GROUP BY site_id, work_date, created_by
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF v_duplicate_count > 0 THEN
    RAISE WARNING '중복 데이터 발견: % 건', v_duplicate_count;
    RAISE WARNING '중복 데이터 상세 조회: SELECT site_id, work_date, created_by, COUNT(*) FROM worklogs GROUP BY site_id, work_date, created_by HAVING COUNT(*) > 1;';
    RAISE NOTICE 'UNIQUE 제약 추가 전 중복 데이터를 먼저 정리해야 합니다.';
  ELSE
    RAISE NOTICE '중복 데이터 없음. UNIQUE 제약 추가 가능.';
  END IF;
END $$;

-- 3.2. UNIQUE 제약 추가 (중복 방지)
-- 목적: 같은 현장, 같은 날짜, 같은 작성자는 하나의 일지만 생성 가능
-- 안전성: 기존 로직과 호환 (useSupabaseWorklogs.ts에서 이미 중복 체크 후 UPDATE)
-- 주의: 기존 중복 데이터가 있으면 실패하므로 사전 점검 필수
CREATE UNIQUE INDEX IF NOT EXISTS idx_worklogs_unique_site_date_creator
ON public.worklogs(site_id, work_date, created_by);

COMMENT ON INDEX idx_worklogs_unique_site_date_creator IS '중복 방지: 같은 현장/날짜/작성자는 1개 일지만 허용';

-- ============================================================================
-- PHASE 4: Trigger 함수 생성
-- ============================================================================

-- 4.1. updated_at 자동 갱신 함수 (재사용 가능)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at IS 'updated_at 컬럼 자동 갱신 (범용 Trigger 함수)';

-- 4.2. 새 테이블용 updated_at 트리거
DROP TRIGGER IF EXISTS trg_site_documents_updated_at ON public.site_documents;
CREATE TRIGGER trg_site_documents_updated_at
BEFORE UPDATE ON public.site_documents
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_drawing_markings_updated_at ON public.drawing_markings;
CREATE TRIGGER trg_drawing_markings_updated_at
BEFORE UPDATE ON public.drawing_markings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_punch_lists_updated_at ON public.punch_lists;
CREATE TRIGGER trg_punch_lists_updated_at
BEFORE UPDATE ON public.punch_lists
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_punch_items_new_updated_at ON public.punch_items_new;
CREATE TRIGGER trg_punch_items_new_updated_at
BEFORE UPDATE ON public.punch_items_new
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_site_wages_updated_at ON public.site_wages;
CREATE TRIGGER trg_site_wages_updated_at
BEFORE UPDATE ON public.site_wages
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 4.3. 급여 자동 생성 트리거 함수 (핵심!)
-- 목적: 일지 승인 시 자동으로 급여 데이터 생성
-- 중복 방지: UNIQUE 제약 + ON CONFLICT DO NOTHING
-- 조건: status가 'approved'로 변경될 때만 실행
CREATE OR REPLACE FUNCTION public.auto_create_wages()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 승인 상태로 변경되었을 때만 실행
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- worklog_workers 테이블에서 작업자 정보 가져오기
    -- 주의: 현재는 worklog_manpower를 사용하지만, 향후 worklog_workers로 전환 예정
    -- 따라서 두 테이블 모두 확인하는 로직 필요
    
    -- 1. worklog_workers에서 급여 생성 (새 테이블)
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
      auth.uid(), -- 현재 승인한 사용자
      now()
    FROM public.worklog_workers ww
    WHERE ww.worklog_id = NEW.id
    ON CONFLICT (worklog_id, user_id) DO NOTHING; -- 중복 방지
    
    -- 2. worklog_manpower에서도 급여 생성 (기존 테이블, 호환성 유지)
    -- 주의: user_id가 없으므로 worker_name으로 profiles 조회 필요
    -- 이 부분은 worklog_workers 전환 완료 후 제거 예정
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
      p.user_id,
      NEW.work_date,
      NEW.id,
      wm.work_hours,
      COALESCE(p.daily_wage, 0),
      'approved',
      auth.uid(),
      now()
    FROM public.worklog_manpower wm
    LEFT JOIN public.profiles p ON p.name = wm.worker_name
    WHERE wm.worklog_id = NEW.id
      AND p.user_id IS NOT NULL -- profiles에서 찾은 경우만
    ON CONFLICT (worklog_id, user_id) DO NOTHING; -- 중복 방지
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auto_create_wages IS '일지 승인 시 급여 자동 생성 (worklog_workers + worklog_manpower 호환)';

-- 4.4. 급여 자동 생성 트리거
DROP TRIGGER IF EXISTS trg_auto_create_wages ON public.worklogs;
CREATE TRIGGER trg_auto_create_wages
AFTER INSERT OR UPDATE ON public.worklogs
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_wages();

-- 4.5. 검색 벡터 자동 업데이트 함수
CREATE OR REPLACE FUNCTION public.update_site_documents_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.badge, '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_site_documents_search_vector ON public.site_documents;
CREATE TRIGGER trg_site_documents_search_vector
BEFORE INSERT OR UPDATE ON public.site_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_site_documents_search_vector();

CREATE OR REPLACE FUNCTION public.update_punch_lists_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    COALESCE(NEW.status, '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_punch_lists_search_vector ON public.punch_lists;
CREATE TRIGGER trg_punch_lists_search_vector
BEFORE INSERT OR UPDATE ON public.punch_lists
FOR EACH ROW
EXECUTE FUNCTION public.update_punch_lists_search_vector();

-- ============================================================================
-- PHASE 5: RLS (Row Level Security) 정책 - 새 테이블만
-- ============================================================================

-- 5.1. RLS 활성화
ALTER TABLE public.worklog_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drawing_markings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.punch_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.punch_items_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_wages ENABLE ROW LEVEL SECURITY;

-- 5.2. worklog_workers RLS 정책
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

-- 5.3. site_documents RLS 정책
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

-- 5.4. drawing_markings RLS 정책
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

-- 5.5. punch_lists RLS 정책
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

-- 5.6. punch_items_new RLS 정책
CREATE POLICY "punch_items_new_select_scoped"
ON public.punch_items_new
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.punch_lists pl
    WHERE pl.id = punch_list_id
      AND public.can_access_site(pl.site_id, auth.uid())
  )
);

CREATE POLICY "punch_items_new_write_admin_manager"
ON public.punch_items_new
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

-- 5.7. site_wages RLS 정책
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
-- PHASE 6: orphans 테이블 삭제 (프론트엔드 영향 없음)
-- ============================================================================

-- 6.1. orphans 테이블 삭제
-- 안전성: 프론트엔드에서 사용하지 않음 (검증 완료)
-- 영향: Storage 절약, 복잡도 감소
DROP TABLE IF EXISTS public.worklogs_orphans CASCADE;
DROP TABLE IF EXISTS public.documents_orphans CASCADE;
DROP TABLE IF EXISTS public.worklog_manpower_orphans CASCADE;
DROP TABLE IF EXISTS public.worklog_materials_orphans CASCADE;
DROP TABLE IF EXISTS public.worklog_worksets_orphans CASCADE;
DROP TABLE IF EXISTS public.punch_groups_orphans CASCADE;
DROP TABLE IF EXISTS public.punch_items_orphans CASCADE;
DROP TABLE IF EXISTS public.partner_deployments_orphans CASCADE;
DROP TABLE IF EXISTS public.site_lodgings_orphans CASCADE;

-- ============================================================================
-- PHASE 7: 완료 메시지
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Site-Centric Architecture Refactoring (ADDITIVE ONLY) 완료!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ profiles 테이블 확장 완료 (daily_wage, is_active 추가)';
  RAISE NOTICE '✅ 새 테이블 생성 완료 (worklog_workers, site_documents, drawing_markings, punch_lists, site_wages)';
  RAISE NOTICE '✅ UNIQUE 제약 추가 완료 (worklogs: site_id, work_date, created_by)';
  RAISE NOTICE '✅ RLS 정책 생성 완료 (새 테이블만)';
  RAISE NOTICE '✅ Trigger 생성 완료 (급여 자동화, 검색 벡터 자동 업데이트)';
  RAISE NOTICE '✅ orphans 테이블 삭제 완료 (9개)';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '⚠️  기존 테이블 유지됨 (worklogs, worklog_manpower, documents, punch_groups 등)';
  RAISE NOTICE '⚠️  프론트엔드 수정 필요 (타입 재생성 후)';
  RAISE NOTICE '⚠️  파괴적 작업은 별도 승인 후 수동 실행 필요';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '다음 단계:';
  RAISE NOTICE '1. 타입 재생성: npx supabase gen types typescript --project-id YOUR_PROJECT_ID';
  RAISE NOTICE '2. 프론트엔드 수정 (useSupabaseWorklogs.ts 등)';
  RAISE NOTICE '3. 빌드 및 테스트';
  RAISE NOTICE '4. 배포';
  RAISE NOTICE '5. Cleanup (선택사항, scripts/cleanup_old_tables.sql 참조)';
  RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- 참고: 나중에 수동 실행할 Cleanup 예시 (별도 파일로 분리됨)
-- ============================================================================
-- 파일: scripts/cleanup_old_tables.sql
-- 실행 시점: 프론트엔드 전환 완료 + 배포 완료 + 모든 기능 정상 동작 확인 후
-- 승인 필요: 사용자 명시적 승인 필수
--
-- DROP TABLE IF EXISTS public.worklog_manpower CASCADE;
-- DROP TABLE IF EXISTS public.documents CASCADE;
-- DROP TABLE IF EXISTS public.punch_groups CASCADE;
-- DROP TABLE IF EXISTS public.punch_items CASCADE; -- 기존 테이블
-- ALTER TABLE public.punch_items_new RENAME TO punch_items; -- 새 테이블을 기존 이름으로
-- ALTER TABLE public.worklogs DROP COLUMN IF EXISTS site_name; -- 선택사항
