// anon 역할이 접근 가능한 branches 컬럼 목록
// 20260220_branches_column_security.sql에서 GRANT된 컬럼과 일치해야 함
// select('*') 사용 시 anon에게 GRANT되지 않은 컬럼 접근으로 401 에러 발생하므로 명시적 지정 필요
// 타입은 '*'로 캐스팅하여 Supabase SDK의 타입 추론이 Branch 전체 타입을 반환하도록 함
export const BRANCHES_PUBLIC_COLUMNS = 'id, name, region, address, phone, owner_name, branch_type, lat, lng, website_url, subdomain, is_active, created_at, updated_at, business_hours, business_number, description, introduction, theme' as unknown as '*'
