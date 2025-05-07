import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import Pagination from '../ProblemList/components/Pagination';
import LoadingSpinner from '../ProblemList/components/LoadingSpinner';
import ErrorMessage from '../ProblemList/components/ErrorMessage';
import authService from '../../services/authService';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiFilter } from 'react-icons/fi';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const ManageProblems = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [message, setMessage] = useState(null);
  const [deletingProblemId, setDeletingProblemId] = useState(null);
  const pageSize = 10;
  const navigate = useNavigate();

  useEffect(() => {
    if (!authService.isAdmin()) {
      navigate('/danh-sach-bai');
    }
  }, [navigate]);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Tạo object params cho request
      const params = { 
        page: currentPage, 
        limit: pageSize 
      };
      
      // Thêm search term nếu có
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      // Thêm filter difficulty nếu có
      if (selectedDifficulty) {
        params.difficulty = selectedDifficulty;
      }
      
      const response = await axios.get(`${API_BASE_URL}/problems/`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params
      });
      
      setProblems(response.data);
      
      // Xử lý pagination
      if (response.headers['x-total-pages']) {
        setTotalPages(parseInt(response.headers['x-total-pages']));
      } else {
        const estimatedPages = Math.ceil(response.data.length / pageSize);
        setTotalPages(Math.max(1, estimatedPages));
      }
    } catch (err) {
      console.error('Error fetching problems:', err);
      setError('Không thể tải danh sách bài tập');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, [currentPage, searchTerm, selectedDifficulty]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset về trang 1 khi tìm kiếm
  };

  const parseErrorMessage = (error) => {
    // Cố gắng phân tích thông báo lỗi để cung cấp thông tin hữu ích cho người dùng
    const errorString = JSON.stringify(error);
    
    if (errorString.includes('submissions')) {
      return 'Không thể xóa bài tập này vì nó có các bài nộp liên quan. Bạn cần xóa các bài nộp trước hoặc liên hệ quản trị viên để được hỗ trợ.';
    }
    
    if (errorString.includes('contest_problems')) {
      return 'Không thể xóa bài tập này vì nó đang được sử dụng trong một hoặc nhiều cuộc thi. Vui lòng xóa bài tập khỏi các cuộc thi trước khi xóa.';
    }
    
    if (errorString.includes('foreign key constraint')) {
      return 'Không thể xóa bài tập này vì nó đang được tham chiếu bởi dữ liệu khác trong hệ thống. Hãy đảm bảo xóa tất cả dữ liệu liên quan trước.';
    }
    
    return 'Có lỗi xảy ra khi xóa bài tập. Vui lòng thử lại sau hoặc liên hệ quản trị viên.';
  };

  const handleDelete = async (problemId, problemTitle) => {
    // Hiển thị xác nhận ban đầu
    if (!window.confirm(`Bạn có chắc muốn xóa bài tập "${problemTitle}"?`)) return;
    
    // Cảnh báo đặc biệt
    const warningConfirm = window.confirm(
      `⚠️ CẢNH BÁO QUAN TRỌNG ⚠️\n\n` +
      `Xóa bài tập có thể gây ra lỗi nếu bài tập này có các bài nộp hoặc đang được sử dụng trong cuộc thi.\n\n` +
      `Để xóa an toàn, bạn nên:\n` +
      `1. Xóa tất cả các bài nộp liên quan trước\n` +
      `2. Xóa bài tập khỏi tất cả các cuộc thi\n\n` +
      `Bạn vẫn muốn tiếp tục?`
    );
    
    if (!warningConfirm) return;
    
    try {
      setDeletingProblemId(problemId);
      setError(null);
      setMessage(null);
      
      const token = localStorage.getItem('token');
      
      await axios.delete(`${API_BASE_URL}/problems/${problemId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Cập nhật danh sách sau khi xóa thành công
      setProblems(problems.filter(p => p.id !== problemId));
      
      // Hiển thị thông báo thành công
      setMessage({
        type: 'success',
        text: `Đã xóa bài tập "${problemTitle}" thành công!`
      });
      
      // Ẩn thông báo sau 3 giây
      setTimeout(() => setMessage(null), 3000);
      
    } catch (err) {
      console.error('Error deleting problem:', err);
      
      // Phân tích lỗi để hiển thị thông báo hữu ích
      setError(parseErrorMessage(err));
      
    } finally {
      setDeletingProblemId(null);
    }
  };

  // Định dạng độ khó của bài tập
  const getDifficultyBadge = (difficulty) => {
    switch(difficulty) {
      case 'easy':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Dễ</span>;
      case 'medium':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Trung bình</span>;
      case 'hard':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Khó</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{difficulty}</span>;
    }
  };

  // Xóa thông báo lỗi
  const clearError = () => {
    setError(null);
  };

  // Xóa thông báo thành công
  const clearMessage = () => {
    setMessage(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <h1 className="text-2xl font-bold text-white mb-4 md:mb-0">Quản lý bài tập</h1>
              <div className="flex space-x-2">
                <Link 
                  to="/admin/them-bai-tap" 
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center"
                >
                  <FiPlus className="mr-2" />
                  Thêm bài tập mới
                </Link>
              </div>
            </div>
          </div>
          
          {/* Thông báo cảnh báo */}
          
          
          {/* Search and filter section */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0">
              {/* Search form */}
              <form onSubmit={handleSearch} className="flex">
                <div className="relative w-full md:w-96">
                  <input
                    type="text"
                    placeholder="Tìm kiếm bài tập..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="text-gray-400" />
                  </div>
                </div>
                <button
                  type="submit"
                  className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Tìm
                </button>
              </form>
              
              {/* Filter dropdown */}
              <div className="flex items-center space-x-2">
                <span className="flex items-center text-gray-600">
                  <FiFilter className="mr-2" />
                  Độ khó:
                </span>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả</option>
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Messages section */}
          {message && (
            <div className={`p-4 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'} flex justify-between items-center`}>
              <div>{message.text}</div>
              <button 
                onClick={clearMessage}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Đóng thông báo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-50 text-red-800 flex justify-between items-center">
              <div>{error}</div>
              <button 
                onClick={clearError}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Đóng thông báo lỗi"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Problems table */}
          {loading && !deletingProblemId ? (
            <div className="p-8 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên bài tập</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Độ khó</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {problems.map((problem) => (
                      <tr key={problem.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {problem.id.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{problem.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getDifficultyBadge(problem.difficulty)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {problem.tags && problem.tags.length > 0 ? (
                              problem.tags.slice(0, 2).map((tag, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 text-xs">Không có</span>
                            )}
                            {problem.tags && problem.tags.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                                +{problem.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {problem.is_public ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Public</span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Private</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link
                              to={`/admin/sua-bai-tap/${problem.id}`}
                              className="text-yellow-600 hover:text-yellow-900 bg-yellow-100 p-2 rounded-md"
                              title="Chỉnh sửa"
                            >
                              <FiEdit size={18} />
                            </Link>
                            {deletingProblemId === problem.id ? (
                              <button
                                className="text-gray-600 bg-gray-100 p-2 rounded-md cursor-not-allowed"
                                disabled
                                title="Đang xóa..."
                              >
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDelete(problem.id, problem.title)}
                                className="text-red-600 hover:text-red-900 bg-red-100 p-2 rounded-md"
                                title="Xóa (cần xóa các bài nộp trước)"
                              >
                                <FiTrash2 size={18} />
                              </button>
                            )}
                            <Link
                              to={`/problems/${problem.id}`}
                              className="text-blue-600 hover:text-blue-900 bg-blue-100 p-2 rounded-md"
                              title="Xem chi tiết"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {problems.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500">
                          <div className="flex flex-col items-center">
                            <svg className="h-12 w-12 text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p>Không tìm thấy bài tập nào</p>
                            <button 
                              onClick={() => {
                                setSearchTerm('');
                                setSelectedDifficulty('');
                              }}
                              className="mt-2 text-blue-600 hover:text-blue-800"
                            >
                              Xóa bộ lọc
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  handlePageChange={setCurrentPage}
                  problems={problems}
                  pageSize={pageSize}
                />
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ManageProblems;