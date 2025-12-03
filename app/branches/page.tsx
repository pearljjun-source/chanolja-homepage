import { Metadata } from 'next'
import BranchesHero from '@/components/branches/BranchesHero'
import BranchesMap from '@/components/branches/BranchesMap'
import BranchesList from '@/components/branches/BranchesList'

export const metadata: Metadata = {
  title: '지점현황',
  description: '차놀자 전국 120개 지점을 확인하세요. 서울, 경기, 인천, 충청, 전라, 경상, 강원, 부산, 제주까지 전국 어디서나 차놀자를 만날 수 있습니다.',
}

export default function BranchesPage() {
  return (
    <>
      <BranchesHero />
      <BranchesMap />
      <BranchesList />
    </>
  )
}
