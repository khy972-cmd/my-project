-- RPC for admin required docs aggregation (additive-only)

CREATE OR REPLACE FUNCTION public.admin_document_type_counts(_since TIMESTAMPTZ DEFAULT NULL)
RETURNS TABLE(doc_type TEXT, count BIGINT)
LANGUAGE sql
STABLE
AS $$
  SELECT d.doc_type::text AS doc_type, COUNT(*)::bigint AS count
  FROM public.documents d
  WHERE (_since IS NULL OR d.created_at >= _since)
  GROUP BY d.doc_type
  ORDER BY COUNT(*) DESC, d.doc_type ASC;
$$;

REVOKE ALL ON FUNCTION public.admin_document_type_counts(TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_document_type_counts(TIMESTAMPTZ) TO authenticated;

-- Admin required-docs aggregation RPC (additive-only)
-- Returns doc_type counts computed in DB (faster than client-side aggregation).

CREATE OR REPLACE FUNCTION public.admin_document_type_counts(_since TIMESTAMPTZ DEFAULT NULL)
RETURNS TABLE (doc_type TEXT, count BIGINT)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(d.doc_type, 'other')::text AS doc_type,
    COUNT(*)::bigint AS count
  FROM public.documents d
  WHERE (_since IS NULL OR d.created_at >= _since)
  GROUP BY COALESCE(d.doc_type, 'other')::text
  ORDER BY COUNT(*) DESC, COALESCE(d.doc_type, 'other')::text ASC;
$$;

