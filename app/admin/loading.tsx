import {
  PageHeaderSkeleton,
  StatCardSkeleton,
  TableSkeleton,
} from '@/components/ui/Skeleton'

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <PageHeaderSkeleton />

      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* 테이블 */}
      <TableSkeleton rows={5} columns={5} />
    </div>
  )
}
