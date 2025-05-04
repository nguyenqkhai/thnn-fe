import React from 'react';

const FilterSection = ({ isFilterOpen, setIsFilterOpen, filters, handleFilterChange, clearFilters }) => {
  return (
    <div className="relative">
      <button
        onClick={() => setIsFilterOpen(!isFilterOpen)}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg className="h-5 w-5 text-gray-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
        </svg>
        Bộ lọc 
        {Object.values(filters).some(value => value !== '') && 
          <span className="ml-1 bg-blue-500 text-white rounded-full px-2 py-0.5 text-xs">
            {Object.values(filters).filter(value => value !== '').length}
          </span>
        }
      </button>
      
      {isFilterOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1 p-3" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Độ khó</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => handleFilterChange('difficulty', '')}
                className={`px-2 py-1 text-xs rounded-full ${
                  filters.difficulty === '' 
                    ? 'bg-gray-700 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => handleFilterChange('difficulty', 'easy')}
                className={`px-2 py-1 text-xs rounded-full ${
                  filters.difficulty === 'easy' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                Dễ
              </button>
              <button
                onClick={() => handleFilterChange('difficulty', 'medium')}
                className={`px-2 py-1 text-xs rounded-full ${
                  filters.difficulty === 'medium' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                }`}
              >
                Trung bình
              </button>
              <button
                onClick={() => handleFilterChange('difficulty', 'hard')}
                className={`px-2 py-1 text-xs rounded-full ${
                  filters.difficulty === 'hard' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                Khó
              </button>
            </div>
            
            <h3 className="text-sm font-medium text-gray-900 mb-2">Trạng thái</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => handleFilterChange('status', '')}
                className={`px-2 py-1 text-xs rounded-full ${
                  filters.status === '' 
                    ? 'bg-gray-700 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => handleFilterChange('status', 'solved')}
                className={`px-2 py-1 text-xs rounded-full ${
                  filters.status === 'solved' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                Đã giải
              </button>
              <button
                onClick={() => handleFilterChange('status', 'unsolved')}
                className={`px-2 py-1 text-xs rounded-full ${
                  filters.status === 'unsolved' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                }`}
              >
                Chưa giải
              </button>
            </div>
            
            <h3 className="text-sm font-medium text-gray-900 mb-2">Danh mục</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => handleFilterChange('category', '')}
                className={`px-2 py-1 text-xs rounded-full ${
                  filters.category === '' 
                    ? 'bg-gray-700 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => handleFilterChange('category', 'arrays')}
                className={`px-2 py-1 text-xs rounded-full ${
                  filters.category === 'arrays' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                }`}
              >
                Mảng
              </button>
              <button
                onClick={() => handleFilterChange('category', 'strings')}
                className={`px-2 py-1 text-xs rounded-full ${
                  filters.category === 'strings' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                }`}
              >
                Chuỗi
              </button>
              <button
                onClick={() => handleFilterChange('category', 'dp')}
                className={`px-2 py-1 text-xs rounded-full ${
                  filters.category === 'dp' 
                    ? 'bg-pink-600 text-white' 
                    : 'bg-pink-100 text-pink-800 hover:bg-pink-200'
                }`}
              >
                Quy hoạch động
              </button>
              <button
                onClick={() => handleFilterChange('category', 'trees')}
                className={`px-2 py-1 text-xs rounded-full ${
                  filters.category === 'trees' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                Cây
              </button>
            </div>
            
            {Object.values(filters).some(value => value !== '') && (
              <div className="pt-2 mt-2 border-t border-gray-200">
                <button
                  onClick={clearFilters}
                  className="w-full inline-flex justify-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterSection;