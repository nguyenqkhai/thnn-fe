import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Header from '../../components/header/Header'
import Footer from '../../components/footer/Footer'
import SearchBar from './components/SearchBar'
import FilterSection from './components/FilterSection'
import ProblemTable from './components/ProblemTable'
import Pagination from './components/Pagination'
import EmptyState from './components/EmptyState'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorMessage from './components/ErrorMessage'
import authService from '../../services/authService'

const API_BASE_URL = 'http://localhost:8000/api/v1';

const ProblemList = () => {
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState({
    difficulty: '',
    category: '',
    status: ''
  })
  const [solvedProblems, setSolvedProblems] = useState([])
  const [loadingSolved, setLoadingSolved] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  
  const pageSize = 10
  
  // Kiểm tra nếu người dùng là admin
  useEffect(() => {
    // Sử dụng hàm isAdmin từ authService
    setIsAdmin(authService.isAdmin());
  }, []);

  // Hàm lấy token xác thực
  const getAuthToken = () => {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('Vui lòng đăng nhập để xem danh sách bài tập')
    }
    return token
  }

  // Hàm lấy danh sách bài đã giải
  const fetchSolvedProblems = async () => {
    try {
      setLoadingSolved(true)
      const token = getAuthToken()
      
      // Sử dụng endpoint submissions để lấy danh sách bài nộp
      const response = await axios.get(`${API_BASE_URL}/submissions/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      // Kiểm tra dữ liệu trả về
      if (response.data && Array.isArray(response.data)) {
        // Lọc ra các bài nộp có trạng thái "accepted"
        const acceptedSubmissions = response.data.filter(
          submission => submission.status === 'accepted'
        )
        
        // Lấy danh sách các problem_id không trùng lặp
        const solvedIds = [...new Set(acceptedSubmissions.map(sub => sub.problem_id))]
        
        setSolvedProblems(solvedIds)
        console.log('Danh sách bài đã giải:', solvedIds)
      } else {
        console.warn('Dữ liệu submissions không phải là mảng:', response.data)
        setSolvedProblems([])
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách bài đã giải:', err)
      setSolvedProblems([])
    } finally {
      setLoadingSolved(false)
    }
  }
  
  // Lấy danh sách bài tập
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true)
        const token = getAuthToken()
        
        // Tạo query params
        const params = {
          page: currentPage,
          limit: pageSize,
          search: searchTerm,
        }
        
        // Thêm các bộ lọc nếu có
        if (filters.difficulty) params.difficulty = filters.difficulty
        if (filters.category) params.category = filters.category
        if (filters.status) params.status = filters.status
        
        const response = await axios.get(`${API_BASE_URL}/problems/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params
        })
        
        setProblems(response.data)
        
        if (response.headers['x-total-pages']) {
          setTotalPages(parseInt(response.headers['x-total-pages']))
        } else {
          // Nếu không có thông tin phân trang, tính toán dựa trên số lượng bài tập
          const totalProblems = Array.isArray(response.data) ? response.data.length : 0
          setTotalPages(Math.max(1, Math.ceil(totalProblems / pageSize)))
        }
        
        // Sau khi lấy danh sách bài tập, lấy danh sách bài đã giải
        if (!loadingSolved) {
          fetchSolvedProblems()
        }
      } catch (err) {
        console.error('Lỗi khi lấy danh sách bài tập:', err)
        if (err.response?.status === 401) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại')
        } else {
          setError('Không thể tải danh sách bài tập. Vui lòng thử lại sau.')
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchProblems()
  }, [currentPage, searchTerm, filters])
    
  // Lấy danh sách bài đã giải khi component mount
  useEffect(() => {
    fetchSolvedProblems()
  }, [])
  
  // Xử lý khi người dùng thay đổi từ khóa tìm kiếm
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1) // Reset về trang 1 khi tìm kiếm
  }
  
  // Xử lý khi người dùng submit form tìm kiếm
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    // Tìm kiếm sẽ được kích hoạt bởi useEffect
  }
  
  // Xử lý khi người dùng thay đổi bộ lọc
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
    setCurrentPage(1) // Reset về trang 1 khi thay đổi bộ lọc

    // Nếu bộ lọc status được thay đổi thành "solved" hoặc "unsolved",
    // thì cần đảm bảo đã lấy danh sách bài đã giải
    if (name === 'status' && (value === 'solved' || value === 'unsolved')) {
      if (solvedProblems.length === 0 && !loadingSolved) {
        fetchSolvedProblems()
      }
    }
  }
  
  // Xử lý khi người dùng chuyển trang
  const handlePageChange = (page) => {
    setCurrentPage(page)
  }
  
  // Xử lý khi người dùng xóa tất cả bộ lọc
  const clearFilters = () => {
    setFilters({
      difficulty: '',
      category: '',
      status: ''
    })
  }
  
  // Lọc danh sách bài tập theo trạng thái đã giải/chưa giải nếu có bộ lọc status
  const getFilteredProblems = () => {
    if (!filters.status || solvedProblems.length === 0) {
      return problems
    }
    
    if (filters.status === 'solved') {
      return problems.filter(problem => solvedProblems.includes(problem.id))
    }
    
    if (filters.status === 'unsolved') {
      return problems.filter(problem => !solvedProblems.includes(problem.id))
    }
    
    return problems
  }
  
  const filteredProblems = getFilteredProblems()
  
  // Hiển thị spinner khi đang tải dữ liệu
  if (loading && problems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Danh Sách Bài Tập</h1>
          </div>
          {/* Search and Filter Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <SearchBar 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm} 
                handleSearchSubmit={handleSearchSubmit} 
              />
              
              <FilterSection 
                isFilterOpen={isFilterOpen} 
                setIsFilterOpen={setIsFilterOpen} 
                filters={filters} 
                handleFilterChange={handleFilterChange} 
                clearFilters={clearFilters} 
              />
            </div>
          </div>
          
          {/* Thông báo đang tải danh sách bài đã giải */}
          {loadingSolved && (
            <div className="px-6 py-2 bg-blue-50 text-blue-700 text-sm">
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang tải thông tin trạng thái bài tập...
              </div>
            </div>
          )}
          
          {/* Problems table */}
          {error ? (
            <ErrorMessage error={error} />
          ) : filteredProblems.length === 0 ? (
            <EmptyState clearFilters={clearFilters} setSearchTerm={setSearchTerm} />
          ) : (
            <>
              <ProblemTable 
                problems={filteredProblems}
                currentPage={currentPage}
                pageSize={pageSize}
                solvedProblems={solvedProblems}
                loadingSolved={loadingSolved}
              />
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                handlePageChange={handlePageChange}
                problems={filteredProblems}
                pageSize={pageSize}
              />
            </>
          )}
        </div>
      </main>
  
      <Footer />
    </div>
  )
}
  
export default ProblemList