import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import LoadingSpinner from '../ProblemList/components/LoadingSpinner';
import ErrorMessage from '../ProblemList/components/ErrorMessage';
import authService from '../../services/authService';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const ContestList = () => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'ongoing', 'finished'
  const [searchTerm, setSearchTerm] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check authentication status
  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
    setIsAdmin(authService.isAdmin());
  }, []);
  
  // Fetch contests
  useEffect(() => {
    const fetchContests = async () => {
      try {
        setLoading(true);
        let url = `${API_BASE_URL}/contests/`;
        let params = { status: filter !== 'all' ? filter : undefined };
        
        // Add token if logged in
        const headers = {};
        const token = localStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await axios.get(url, { params, headers });
        
        // Kiểm tra và đảm bảo dữ liệu hợp lệ
        if (Array.isArray(response.data)) {
          setContests(response.data);
        } else if (response.data && Array.isArray(response.data.results)) {
          setContests(response.data.results);
        } else {
          console.error('Unexpected API response format:', response.data);
          setContests([]);
          setError('Dữ liệu trả về không đúng định dạng. Vui lòng thử lại sau.');
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách cuộc thi:', err);
        setError('Không thể tải danh sách cuộc thi. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchContests();
  }, [filter]);
  
  // Format datetime
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    
    const date = new Date(dateTimeStr);
    
    // Format date
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    // Format time
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };
  
  // Check contest status
  const getContestStatus = (startTime, endTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (now < start) {
      return { text: 'Upcoming', className: 'bg-blue-100 text-blue-800' };
    } else if (now >= start && now <= end) {
      return { text: 'Ongoing', className: 'bg-green-100 text-green-800' };
    } else {
      return { text: 'Finished', className: 'bg-gray-100 text-gray-800' };
    }
  };
  
  // Filter contests by search term
  const filteredContests = contests.filter(contest => 
    contest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contest.description && contest.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Danh sách cuộc thi</h1>
            
            {isAdmin && (
              <Link
                to="/admin/quan-ly-cuoc-thi"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                Quản lý cuộc thi
              </Link>
            )}
          </div>
          
          {/* Filter and Search */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 text-sm rounded-md ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setFilter('upcoming')}
                  className={`px-4 py-2 text-sm rounded-md ${
                    filter === 'upcoming'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Sắp diễn ra
                </button>
                <button
                  onClick={() => setFilter('ongoing')}
                  className={`px-4 py-2 text-sm rounded-md ${
                    filter === 'ongoing'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Đang diễn ra
                </button>
                <button
                  onClick={() => setFilter('finished')}
                  className={`px-4 py-2 text-sm rounded-md ${
                    filter === 'finished'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Đã kết thúc
                </button>
              </div>
              
              <div className="w-full md:w-1/3">
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="text"
                    placeholder="Tìm kiếm cuộc thi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Error message */}
          {error && <ErrorMessage error={error} />}
          
          {/* Contest list */}
          <div className="p-6">
            {filteredContests.length === 0 ? (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy cuộc thi nào</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm 
                    ? 'Không có cuộc thi nào phù hợp với từ khóa tìm kiếm của bạn.' 
                    : 'Không có cuộc thi nào trong danh mục này.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContests.map(contest => {
                  // Đảm bảo contest có ID hợp lệ
                  if (!contest.id) {
                    return null;
                  }
                  
                  const status = getContestStatus(contest.start_time, contest.end_time);
                  return (
                    <div key={contest.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                      <div className="px-4 py-5 sm:p-6">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-medium text-gray-900 truncate">{contest.title}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                            {status.text === 'Upcoming' ? 'Sắp diễn ra' : status.text === 'Ongoing' ? 'Đang diễn ra' : 'Đã kết thúc'}
                          </span>
                        </div>
                        
                        <div className="mt-3">
                          <p className="text-sm text-gray-500 line-clamp-2">{contest.description}</p>
                        </div>
                        
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            <span>Bắt đầu: {formatDateTime(contest.start_time)}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <span>Kết thúc: {formatDateTime(contest.end_time)}</span>
                          </div>
                          {contest.participants_count !== undefined && (
                            <div className="flex items-center text-sm text-gray-500">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                              </svg>
                              <span>{contest.participants_count} người tham gia</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-5">
                          {contest.requires_approval && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mr-2">
                              Yêu cầu phê duyệt
                            </span>
                          )}
                          {!contest.is_public && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Riêng tư
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="bg-gray-50 px-4 py-4 sm:px-6">
                        <div className="text-sm">
                          <Link
                            to={`/cac-ky-thi/${contest.id}`}
                            className="font-medium text-blue-600 hover:text-blue-500"
                          >
                            Xem chi tiết
                            <span aria-hidden="true"> &rarr;</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ContestList;