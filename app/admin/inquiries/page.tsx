'use client'

import { useState, useEffect } from 'react'
import { Search, Mail, MailOpen, Trash2, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Inquiry } from '@/types/database'

const typeLabels: Record<string, string> = {
  branch: '지점 개설',
  corporation: '법인 설립',
  camping: '캠핑카 사업',
  other: '기타 문의',
}

export default function AdminInquiriesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInquiries()
  }, [])

  const fetchInquiries = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching inquiries:', error)
    } else {
      setInquiries(data || [])
    }
    setLoading(false)
  }

  const markAsRead = async (inquiry: Inquiry) => {
    if (inquiry.is_read) return

    const supabase = createClient()
    const { error } = await supabase
      .from('inquiries')
      .update({ is_read: true })
      .eq('id', inquiry.id)

    if (!error) {
      setInquiries(prev =>
        prev.map(i => i.id === inquiry.id ? { ...i, is_read: true } : i)
      )
      if (selectedInquiry?.id === inquiry.id) {
        setSelectedInquiry({ ...inquiry, is_read: true })
      }
    }
  }

  const deleteInquiry = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('inquiries')
      .delete()
      .eq('id', id)

    if (!error) {
      setInquiries(prev => prev.filter(i => i.id !== id))
      if (selectedInquiry?.id === id) {
        setSelectedInquiry(null)
      }
    }
  }

  const handleSelectInquiry = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry)
    markAsRead(inquiry)
  }

  const filteredInquiries = inquiries.filter((inquiry) =>
    inquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inquiry.message.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark">문의 관리</h1>
        <p className="text-gray-500">창업 문의 내역을 확인하고 관리합니다.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Inquiry List */}
        <div className="lg:col-span-1">
          {/* Search */}
          <div className="bg-white rounded-xl shadow-sm mb-4">
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* List */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {filteredInquiries.map((inquiry) => (
                <button
                  key={inquiry.id}
                  onClick={() => handleSelectInquiry(inquiry)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedInquiry?.id === inquiry.id ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {inquiry.is_read ? (
                      <MailOpen className="w-5 h-5 text-gray-400 mt-0.5" />
                    ) : (
                      <Mail className="w-5 h-5 text-primary mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-medium ${inquiry.is_read ? 'text-gray-600' : 'text-dark'}`}>
                          {inquiry.name}
                        </p>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {new Date(inquiry.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{typeLabels[inquiry.inquiry_type] || inquiry.inquiry_type}</p>
                      <p className="text-sm text-gray-400 line-clamp-1 mt-1">{inquiry.message}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {filteredInquiries.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                문의 내역이 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* Inquiry Detail */}
        <div className="lg:col-span-2">
          {selectedInquiry ? (
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-dark">{selectedInquiry.name}</h2>
                    <p className="text-gray-500">{typeLabels[selectedInquiry.inquiry_type] || selectedInquiry.inquiry_type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => markAsRead(selectedInquiry)}
                      className="p-2 text-gray-400 hover:text-primary transition-colors"
                      title="읽음 표시"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteInquiry(selectedInquiry.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">연락처</p>
                    <p className="font-medium">{selectedInquiry.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">이메일</p>
                    <p className="font-medium">{selectedInquiry.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">희망 지역</p>
                    <p className="font-medium">{selectedInquiry.region || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">문의일시</p>
                    <p className="font-medium">
                      {new Date(selectedInquiry.created_at).toLocaleString('ko-KR')}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">문의 내용</p>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-line">{selectedInquiry.message}</p>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <a
                    href={`tel:${selectedInquiry.phone}`}
                    className="btn-primary"
                  >
                    전화 연결
                  </a>
                  {selectedInquiry.email && (
                    <a
                      href={`mailto:${selectedInquiry.email}`}
                      className="btn-outline"
                    >
                      이메일 보내기
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">왼쪽에서 문의를 선택해주세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
