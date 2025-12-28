# GitHub Secrets 설정 가이드

CI/CD 파이프라인을 위해 GitHub Repository에 다음 Secrets를 설정해야 합니다.

## 설정 방법

1. GitHub 저장소로 이동
2. Settings → Secrets and variables → Actions 클릭
3. "New repository secret" 클릭하여 아래 시크릿 추가

## 필수 Secrets

### Supabase
| Secret Name | 설명 | 예시 |
|-------------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 키 | `eyJhbGciOiJIUzI1...` |

### 네이버 지도
| Secret Name | 설명 | 예시 |
|-------------|------|------|
| `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` | 네이버 지도 클라이언트 ID | `xxxxxxxxxx` |

### 토스페이먼츠
| Secret Name | 설명 | 예시 |
|-------------|------|------|
| `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY` | 클라이언트 키 | `test_ck_xxx` 또는 `live_ck_xxx` |
| `TOSS_PAYMENTS_SECRET_KEY` | 시크릿 키 | `test_sk_xxx` 또는 `live_sk_xxx` |

### 카카오
| Secret Name | 설명 | 예시 |
|-------------|------|------|
| `KAKAO_REST_API_KEY` | REST API 키 | `xxxxxxxxxxxxxxxx` |

### Vercel 배포 (선택)
| Secret Name | 설명 | 얻는 방법 |
|-------------|------|----------|
| `VERCEL_TOKEN` | Vercel API 토큰 | [Vercel Settings](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | 조직/팀 ID | `vercel link` 후 `.vercel/project.json` 확인 |
| `VERCEL_PROJECT_ID` | 프로젝트 ID | `vercel link` 후 `.vercel/project.json` 확인 |

## Vercel 연동 방법

```bash
# 1. Vercel CLI 설치
npm install -g vercel

# 2. 로그인
vercel login

# 3. 프로젝트 연결
vercel link

# 4. .vercel/project.json에서 ID 확인
cat .vercel/project.json
```

## 환경별 설정

### 개발 환경 (테스트 키 사용)
```
NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY=test_ck_xxx
TOSS_PAYMENTS_SECRET_KEY=test_sk_xxx
```

### 프로덕션 환경 (라이브 키 사용)
```
NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY=live_ck_xxx
TOSS_PAYMENTS_SECRET_KEY=live_sk_xxx
```

## 워크플로우 설명

### ci.yml
- **트리거**: main, master, develop 브랜치 push/PR
- **작업**: Lint → Unit Tests → E2E Tests → Build
- **목적**: 코드 품질 검증

### deploy.yml
- **트리거**: main, master 브랜치 push
- **작업**: Tests → Vercel 배포
- **목적**: 자동 배포

## 로컬 테스트

GitHub Actions 없이 로컬에서 테스트:

```bash
# 모든 테스트 실행
npm test && npm run test:e2e

# 빌드 테스트
npm run build
```
