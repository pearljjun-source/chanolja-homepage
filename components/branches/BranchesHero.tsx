'use client'

export default function BranchesHero() {
  return (
    <section className="relative pt-32 pb-20 bg-gradient-to-br from-dark via-dark-200 to-dark overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233CBFDC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container-custom relative z-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-full mb-6">
            <span className="w-2 h-2 bg-primary rounded-full" />
            <span className="text-primary text-sm font-medium">Branch Network</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            지점현황
          </h1>

          <p className="text-xl text-gray-300 leading-relaxed mb-8">
            전국 120개 이상의 지점 네트워크.<br />
            어디서나 차놀자를 만날 수 있습니다.
          </p>

          <div className="flex flex-wrap gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4">
              <p className="text-4xl font-bold text-primary">120+</p>
              <p className="text-gray-300">렌트카 지점</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4">
              <p className="text-4xl font-bold text-primary">50+</p>
              <p className="text-gray-300">캠핑카 지점</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4">
              <p className="text-4xl font-bold text-primary">17</p>
              <p className="text-gray-300">전국 광역시도</p>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent" />
    </section>
  )
}
