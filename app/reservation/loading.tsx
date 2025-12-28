import { Skeleton } from '@/components/ui/Skeleton'

export default function ReservationLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-primary/20 to-blue-600/20 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-xl bg-white/10" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32 bg-white/10" />
              <Skeleton className="h-4 w-48 bg-white/10" />
            </div>
          </div>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* 섹션 헤더 */}
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl bg-white/10" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-24 bg-white/10" />
              <Skeleton className="h-4 w-40 bg-white/10" />
            </div>
          </div>

          {/* 지점 카드 그리드 */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-2xl p-5"
              >
                <Skeleton className="h-6 w-2/3 mb-3 bg-white/10" />
                <Skeleton className="h-4 w-1/2 mb-2 bg-white/10" />
                <Skeleton className="h-4 w-1/3 bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
