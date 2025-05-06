import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const ContestList = () => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Kiểm tra nếu user là admin
  useEffect(() => {
    const checkAdmin = () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setIsAdmin(user.is_admin || false);
    };
    
    checkAdmin();
  }, []);

  // Fetch contests
  useEffect(() => {
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
    
    return `${day} Tháng ${month}, ${year}, ${hours}:${minutes}`;
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="flex justify-between items-center bg-blue-600 text-white p-4">
            <h1 className="text-2xl font-bold">Kỳ thi</h1>
            <div className="text-white font-bold">Thành viên</div>
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 text-red-700 border-l-4 border-red-500">
              {error}
            </div>
          )}
          
          {isAdmin && (
            <div className="p-4 border-b border-gray-200">
              <Link 
                to="/admin/tao-ky-thi" 
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center w-max"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tạo kỳ thi mới
              </Link>
            </div>
          )}
          
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kỳ thi
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thành viên
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contests.map((contest) => (
                <tr key={contest.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <Link to={`/ky-thi/${contest.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                        {contest.title}
                      </Link>
                      <div className="text-sm text-gray-500 mt-1">
                        {formatDate(contest.start_time)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Thời gian làm bài: {formatDuration(contest.duration_hours || 0, contest.duration_minutes || 0)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-500">
                    {contest.participants_count || 0} ({contest.registered_count || 0})
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link
                      to={`/cac-ky-thi/${contest.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Tham gia
                    </Link>
                  </td>
                </tr>
              ))}
              
              {contests.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                    Không có kỳ thi nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ContestList;