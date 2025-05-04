import React from 'react'
import { FiSearch } from 'react-icons/fi'

const SearchBar = ({ searchTerm, setSearchTerm, handleSearchSubmit }) => {
  return (
    <form onSubmit={handleSearchSubmit} className="w-full md:w-96">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm bài tập..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    </form>
  )
}

export default SearchBar