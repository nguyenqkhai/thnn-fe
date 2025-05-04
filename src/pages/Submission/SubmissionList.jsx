import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import LoadingSpinner from '../ProblemList/components/LoadingSpinner';
import ErrorMessage from '../ProblemList/components/ErrorMessage';
import Pagination from '../ProblemList/components/Pagination';
import authService from '../../services/authService';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const SubmissionList = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    problem_id: '',
    contest_id: '',
    status: '',
    language: '',
    view_mode: 'all' // 'all' or 'mine'
  });
  const [problems, setProblems] = useState([]);
  const [languages, setLanguages] = useState(['c', 'cpp', 'python', 'pascal']);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const pageSize = 10;

  // Function to get auth token from localStorage
  const getAuthToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Vui lòng đăng nhập để xem danh sách bài nộp');
    }
    return token;
  };

  // Get current user info
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = getAuthToken();
        const response = await axios.get(`${API_BASE_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setCurrentUser(response.data);
        
        // Set isAdmin based on user data
        if (response.data && response.data.is_admin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          // If not admin, force view_mode to 'mine'
          setFilters(prev => ({
            ...prev,
            view_mode: 'mine'
          }));
        }
      } catch (err) {
        console.error('Lỗi khi lấy thông tin người dùng:', err);
      }
    };
    
    fetchCurrentUser();
  }, []);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle filter change
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset to page 1 when filters change
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      problem_id: '',
      contest_id: '',
      status: '',
      language: '',
      // If not admin, keep view_mode as 'mine'
      view_mode: isAdmin ? 'all' : 'mine'
    });
  };

  // Fetch problems for filter dropdown
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const token = getAuthToken();
        const response = await axios.get(`${API_BASE_URL}/problems/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setProblems(response.data);
      } catch (err) {
        console.error('Lỗi khi lấy danh sách bài tập:', err);
      }
    };
    
    fetchProblems();
  }, []);

  // Fetch submissions with filters
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        
        // Prepare query params
        const params = {
          skip: (currentPage - 1) * pageSize,
          limit: pageSize
        };
        
        // Add filters if they exist
        if (filters.problem_id) params.problem_id = filters.problem_id;
        if (filters.contest_id) params.contest_id = filters.contest_id;
        if (filters.status) params.status = filters.status;
        if (filters.language) params.language = filters.language;
        
        // Always send the view_mode parameter
        params.view_mode = filters.view_mode;
        
        const response = await axios.get(`${API_BASE_URL}/submissions/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params
        });
        
        setSubmissions(response.data);
        
        // Calculate total pages
        if (response.headers['x-total-count']) {
          const totalItems = parseInt(response.headers['x-total-count']);
          setTotalPages(Math.ceil(totalItems / pageSize));
        } else {
          // Fallback if header not provided
          setTotalPages(Math.max(1, Math.ceil(response.data.length / pageSize)));
        }
      } catch (err) {
        console.error('Lỗi khi lấy danh sách bài nộp:', err);
        setError('Không thể tải danh sách bài nộp. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch if we have the user info
    if (currentUser) {
      fetchSubmissions();
    }
  }, [currentPage, filters, currentUser]);

  // Convert status to readable text
  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Đang chờ',
      'accepted': 'Đã chấp nhận',
      'wrong_answer': 'Sai kết quả',
      'time_limit_exceeded': 'Quá thời gian',
      'memory_limit_exceeded': 'Quá bộ nhớ',
      'runtime_error': 'Lỗi thực thi',
      'compilation_error': 'Lỗi biên dịch'
    };
    
    return statusMap[status] || status;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'wrong_answer':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'time_limit_exceeded':
      case 'memory_limit_exceeded':
        return 'bg-orange-100 text-orange-800';
      case 'runtime_error':
      case 'compilation_error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format datetime
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Danh Sách Bài Nộp</h1>
          </div>
          
          {/* Filter Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between md:space-x-4">
                {/* View Selector - Only visible for admin users */}
                {isAdmin && (
                  <div className="mb-4 md:mb-0">
                    <label htmlFor="view-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Hiển thị bài nộp
                    </label>
                    <select
                      id="view-select"
                      value={filters.view_mode}
                      onChange={(e) => handleFilterChange('view_mode', e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="all">Tất cả bài nộp</option>
                      <option value="mine">Chỉ bài nộp của tôi</option>
                    </select>
                  </div>
                )}
                
                {/* Problem Filter */}
                <div className="mb-4 md:mb-0">
                  <label htmlFor="problem-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Bài tập
                  </label>
                  <select
                    id="problem-filter"
                    value={filters.problem_id}
                    onChange={(e) => handleFilterChange('problem_id', e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">Tất cả bài tập</option>
                    {problems.map(problem => (
                      <option key={problem.id} value={problem.id}>
                        {problem.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Status Filter */}
                <div className="mb-4 md:mb-0">
                  <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    id="status-filter"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="accepted">Đã chấp nhận</option>
                    <option value="wrong_answer">Sai kết quả</option>
                    <option value="time_limit_exceeded">Quá thời gian</option>
                    <option value="memory_limit_exceeded">Quá bộ nhớ</option>
                    <option value="runtime_error">Lỗi thực thi</option>
                    <option value="compilation_error">Lỗi biên dịch</option>
                  </select>
                </div>
                
                {/* Language Filter */}
                <div>
                  <label htmlFor="language-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Ngôn ngữ
                  </label>
                  <select
                    id="language-filter"
                    value={filters.language}
                    onChange={(e) => handleFilterChange('language', e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">Tất cả ngôn ngữ</option>
                    {languages.map(lang => (
                      <option key={lang} value={lang}>
                        {lang === 'cpp' ? 'C++' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Clear filters button */}
              {Object.values(filters).some(value => value !== '' && (isAdmin ? value !== 'all' : true)) && (
                <div className="flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Xóa bộ lọc
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Submissions Table */}
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorMessage error={error} />
          ) : submissions.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium">Không tìm thấy bài nộp nào</p>
                <p className="mt-1">Hiện tại không có bài nộp nào phù hợp với bộ lọc của bạn.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Bài tập
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Người nộp
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Ngôn ngữ
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Trạng thái
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Thời gian chạy
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Bộ nhớ sử dụng
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Thời gian nộp
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {submissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {submission.problem_title || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {submission.username || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {submission.language === 'cpp' ? 'C++' : submission.language.charAt(0).toUpperCase() + submission.language.slice(1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                            {getStatusText(submission.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {submission.execution_time_ms ? `${submission.execution_time_ms} ms` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {submission.memory_used_kb ? `${submission.memory_used_kb} KB` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateTime(submission.submitted_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            to={`/submissions/${submission.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Xem chi tiết
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                handlePageChange={handlePageChange}
                problems={submissions}
                pageSize={pageSize}
              />
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SubmissionList;