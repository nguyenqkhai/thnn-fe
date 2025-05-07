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
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'active', 'upcoming', 'ended'
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contestToDelete, setContestToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Check if user is admin
  useEffect(() => {
    setIsAdmin(authService.isAdmin());
  }, []);

  // Fetch contests
  const fetchContests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await axios.get(`${API_BASE_URL}/contests`, { headers });
      
      if (Array.isArray(response.data)) {
        setContests(response.data);
      } else if (response.data && Array.isArray(response.data.results)) {
        setContests(response.data.results);
      } else {
        console.error('Dữ liệu không đúng định dạng:', response.data);
        setContests([]);
        setError('Không thể tải danh sách kỳ thi. Vui lòng thử lại sau.');
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách kỳ thi:', err);
      setError('Không thể tải danh sách kỳ thi. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContests();
  }, []);

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year}, ${hours}:${minutes}`;
  };

  // Format duration
  const formatDuration = (hours, minutes) => {
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days} ngày`;
    }
    
    if (hours > 0 && minutes > 0) {
      return `${hours} giờ, ${minutes} phút`;
    } else if (hours > 0) {
      return `${hours} giờ`;
    } else {
      return `${minutes} phút`;
    }
  };

  // Get contest status
  const getContestStatus = (startTime, endTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (now < start) {
      return { status: 'upcoming', text: 'Sắp diễn ra', className: 'bg-blue-100 text-blue-800' };
    } else if (now >= start && now <= end) {
      return { status: 'active', text: 'Đang diễn ra', className: 'bg-green-100 text-green-800' };
    } else {
      return { status: 'ended', text: 'Đã kết thúc', className: 'bg-gray-100 text-gray-800' };
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (contest) => {
    setContestToDelete(contest);
    setDeleteModalOpen(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setContestToDelete(null);
  };

  // Delete contest
  const deleteContest = async () => {
    if (!contestToDelete) return;

    try {
      setIsDeleting(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Bạn cần đăng nhập để thực hiện chức năng này.');
        return;
      }

      await axios.delete(
        `${API_BASE_URL}/contests/${contestToDelete.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      // Update the contests list
      setContests(prevContests => 
        prevContests.filter(contest => contest.id !== contestToDelete.id)
      );

      // Show success message
      setSuccessMessage(`Kỳ thi "${contestToDelete.title}" đã được xóa thành công.`);
      
      // Auto hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

      // Close the modal
      closeDeleteModal();
    } catch (err) {
      console.error('Lỗi khi xóa kỳ thi:', err);
      setError('Không thể xóa kỳ thi. Vui lòng thử lại sau.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter contests
  const filteredContests = contests.filter(contest => {
    if (activeFilter === 'all') return true;
    
    const status = getContestStatus(contest.start_time, contest.end_time);
    return status.status === activeFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{successMessage}</span>
            <button 
              onClick={() => setSuccessMessage('')}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <svg 
                className="fill-current h-5 w-5 text-green-500" 
                role="button" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20"
              >
                <title>Đóng</title>
                <path 
                  fillRule="evenodd" 
                  d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" 
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="flex justify-between items-center bg-blue-600 text-white p-4">
            <h1 className="text-2xl font-bold">Danh Sách Kỳ Thi</h1>
            {isAdmin && (
              <Link 
                to="/admin/tao-ky-thi" 
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Thêm kỳ thi
              </Link>
            )}
          </div>
          
          {error && <ErrorMessage error={error} />}
          
          {/* Filter tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 text-sm font-medium ${
                activeFilter === 'all'
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setActiveFilter('active')}
              className={`px-4 py-2 text-sm font-medium ${
                activeFilter === 'active'
                  ? 'text-green-600 border-b-2 border-green-500'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Đang diễn ra
            </button>
            <button
              onClick={() => setActiveFilter('upcoming')}
              className={`px-4 py-2 text-sm font-medium ${
                activeFilter === 'upcoming'
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sắp diễn ra
            </button>
            <button
              onClick={() => setActiveFilter('ended')}
              className={`px-4 py-2 text-sm font-medium ${
                activeFilter === 'ended'
                  ? 'text-gray-600 border-b-2 border-gray-500'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Đã kết thúc
            </button>
          </div>
          
          {filteredContests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <p className="text-lg font-medium">Không có kỳ thi nào.</p>
              {isAdmin && (
                <Link
                  to="/admin/tao-ky-thi"
                  className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-medium text-white hover:bg-blue-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Tạo kỳ thi mới
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {filteredContests.map(contest => {
                const statusInfo = getContestStatus(contest.start_time, contest.end_time);
                return (
                  <div key={contest.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex justify-between items-start">
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">
                          {contest.title}
                        </h2>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
                          {statusInfo.text}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {contest.description}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50">
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Bắt đầu</p>
                          <p className="text-sm font-medium">{formatDate(contest.start_time)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Kết thúc</p>
                          <p className="text-sm font-medium">{formatDate(contest.end_time)}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">{contest.participants_count || 0}</span> người tham gia
                        </p>
                        <div className="flex gap-2">
                          <Link
                            to={`/cac-ky-thi/${contest.id}`}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                          >
                            Xem chi tiết
                          </Link>
                          {isAdmin && (
                            <button
                              onClick={() => openDeleteModal(contest)}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Xác nhận xóa kỳ thi</h2>
            </div>
            <div className="p-4">
              <p className="mb-4 text-gray-700">
                Bạn có chắc chắn muốn xóa kỳ thi "{contestToDelete?.title}"? Hành động này không thể hoàn tác.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  disabled={isDeleting}
                >
                  Hủy
                </button>
                <button
                  onClick={deleteContest}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Đang xóa...' : 'Xóa kỳ thi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default ContestList;