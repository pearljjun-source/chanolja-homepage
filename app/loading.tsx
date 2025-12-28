export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
      <div className="text-center">
        {/* 로고 또는 스피너 */}
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin" />
        </div>

        {/* 로딩 텍스트 */}
        <p className="text-slate-500 text-sm animate-pulse">
          페이지를 불러오는 중...
        </p>
      </div>
    </div>
  )
}
