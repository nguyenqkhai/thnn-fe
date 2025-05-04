import React from 'react'

const EmptyState = ({ clearFilters, setSearchTerm }) => {
  const handleReset = () => {
    setSearchTerm('')
    clearFilters()
  }

  return (
    <div className="p-16 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <h3 className="text-lg font-medium text-gray-600 mb-2">Không tìm thấy bài tập</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        Không tìm thấy bài tập nào phù hợp với tìm kiếm hoặc bộ lọc của bạn. Hãy thử tìm kiếm với từ khóa khác hoặc đặt lại các bộ lọc.
      </p>
      <button
        onClick={handleReset}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Xem tất cả bài tập
      </button>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-left">
          <h4 className="font-medium text-blue-700 mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Mẹo tìm kiếm
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Sử dụng từ khóa ngắn gọn</li>
            <li>• Kiểm tra lỗi chính tả</li>
            <li>• Thử tìm kiếm theo tên bài hoặc chủ đề</li>
          </ul>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-left">
          <h4 className="font-medium text-green-700 mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Lọc thông minh
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Lọc theo độ khó phù hợp với bạn</li>
            <li>• Kết hợp nhiều bộ lọc cùng lúc</li>
            <li>• Bạn có thể xóa tất cả bộ lọc bất kỳ lúc nào</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default EmptyState