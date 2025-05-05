import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import LoadingSpinner from '../ProblemList/components/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import authService from '../../services/authService';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const ManageContestRequests = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  
  const [contest, setContest] = useState(null);
  const [requests, setRequests] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' hoặc 'participants'
  
  // Kiểm tra quyền admin
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (!authService.isAdmin()) {
      navigate('/danh-sach-bai');
    }
  }, [navigate]);
  
  // Lấy thông tin cuộc thi và các yêu cầu
  useEffect(() => {
    const fetchContestAndRequests = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Lấy thông tin cuộc thi
        const contestResponse = await axios.get(`${API_BASE_URL}/contests/${contestId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setContest(contestResponse.data);
        
        // Lấy danh sách yêu cầu tham gia
        const requestsResponse = await axios.get(`${API_BASE_URL}/contests/${contestId}/requests`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setRequests(requestsResponse.data);
        
        // Lấy danh sách người tham gia
        const participantsResponse = await axios.get(`${API_BASE_URL}/contests/${contestId}/participants`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setParticipants(participantsResponse.data);
        
      } catch (err) {
        console.error('Lỗi khi tải thông tin cuộc thi và yêu cầu:', err);
        setError('Không thể tải thông tin cuộc thi và yêu cầu tham gia. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchContestAndRequests();
  }, [contestId]);
  
  // Xử lý phê duyệt yêu cầu
  const handleApproveRequest = async (requestId, username) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.put(
        `${API_BASE_URL}/contests/requests/${requestId}`,
        { status: 'approved' },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Cập nhật danh sách yêu cầu và người tham gia
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId ? { ...req, status: 'approved' } : req
        )
      );
      
      // Hiển thị thông báo thành công
      setSuccessMessage(`Đã chấp nhận yêu cầu tham gia của ${username}`);
      
      // Tự động tắt thông báo thành công sau 3 giây
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
      // Làm mới danh sách người tham gia
      const token2 = localStorage.getItem('token');
      const participantsResponse = await axios.get(`${API_BASE_URL}/contests/${contestId}/participants`, {
        headers: { 'Authorization': `Bearer ${token2}` }
      });
      
      setParticipants(participantsResponse.data);
      
    } catch (err) {
      console.error('Lỗi khi phê duyệt yêu cầu:', err);
      setError('Có lỗi xảy ra khi phê duyệt yêu cầu tham gia. Vui lòng thử lại sau.');
    }
  };
  
  // Xử lý từ chối yêu cầu
  const handleRejectRequest = async (requestId, username) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.put(
        `${API_BASE_URL}/contests/requests/${requestId}`,
        { status: 'rejected' },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Cập nhật danh sách yêu cầu
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId ? { ...req, status: 'rejected' } : req
        )
      );
      
      // Hiển thị thông báo thành công
      setSuccessMessage(`Đã từ chối yêu cầu tham gia của ${username}`);
      
      // Tự động tắt thông báo thành công sau 3 giây
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (err) {
      console.error('Lỗi khi từ chối yêu cầu:', err);
      setError('Có lỗi xảy ra khi từ chối yêu cầu tham gia. Vui lòng thử lại sau.');
    }
  };
  
  // Xử lý xóa người tham gia
  const handleRemoveParticipant = async (participantId, username) => {
    if (!window.confirm(`Bạn có chắc muốn xóa ${username} khỏi cuộc thi này?`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`${API_BASE_URL}/contests/${contestId}/participants/${participantId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Cập nhật danh sách người tham gia
      setParticipants(prevParticipants => 
        prevParticipants.filter(p => p.id !== participantId)
      );
      
      // Hiển thị thông báo thành công
      setSuccessMessage(`Đã xóa ${username} khỏi cuộc thi`);
      
      // Tự động tắt thông báo thành công sau 3 giây
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (err) {
      console.error('Lỗi khi xóa người tham gia:', err);
      setError('Có lỗi xảy ra khi xóa người tham gia. Vui lòng thử lại sau.');
    }
  };
  
  // Format datetime
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    
    const date = new Date(dateTimeStr);
    
    // Định dạng ngày tháng
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    // Định dạng giờ phút
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };
  
  // Lọc yêu cầu theo trạng thái
  const pendingRequests = requests.filter(req => req.status === 'pending');
  const approvedRequests = requests.filter(req => req.status === 'approved');
  const rejectedRequests = requests.filter(req => req.status === 'rejected');
  
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
        <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">Quản Lý Tham Gia Cuộc Thi</h1>
                {contest && (
                  <p className="mt-1 text-blue-100">
                    {contest.title}
                  </p>
                )}
              </div>
              
              <div className="mt-2 md:mt-0">
                <Link
                  to="/admin/quan-ly-cuoc-thi"
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Quay lại danh sách
                </Link>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="p-4">
              <ErrorMessage error={error} />
            </div>
          )}
          
          {successMessage && (
            <div className="p-4 bg-green-50 border-b border-green-100">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-800">{successMessage}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'requests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('requests')}
              >
                Yêu cầu tham gia {pendingRequests.length > 0 && `(${pendingRequests.length})`}
              </button>
              <button
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'participants'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('participants')}
              >
                Người tham gia {participants.length > 0 && `(${participants.length})`}
              </button>
            </nav>
          </div>
          
          {/* Content based on active tab */}
          <div className="p-6">
            {activeTab === 'requests' ? (
              <div>
                <div className="mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Yêu cầu tham gia</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Quản lý các yêu cầu tham gia cuộc thi từ người dùng
                  </p>
                </div>
                
                {/* Pending requests */}
                <div className="mb-8">
                  <h3 className="text-md font-medium text-gray-900 mb-3">
                    Yêu cầu đang chờ duyệt ({pendingRequests.length})
                  </h3>
                  
                  {pendingRequests.length === 0 ? (
                    <div className="bg-gray-50 p-4 rounded-md text-center text-gray-500 border border-gray-200">
                      Không có yêu cầu nào đang chờ duyệt
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Người dùng
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Thời gian yêu cầu
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Lời nhắn
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Hành động
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pendingRequests.map(request => (
                            <tr key={request.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                                    {request.username ? request.username.charAt(0).toUpperCase() : '?'}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{request.username}</div>
                                    <div className="text-sm text-gray-500">{request.user_email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{formatDateTime(request.created_at)}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">
                                  {request.request_message || (
                                    <span className="text-gray-500 italic">Không có lời nhắn</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => handleApproveRequest(request.id, request.username)}
                                    className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-1 rounded-md transition-colors"
                                  >
                                    Chấp nhận
                                  </button>
                                  <button
                                    onClick={() => handleRejectRequest(request.id, request.username)}
                                    className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-md transition-colors"
                                  >
                                    Từ chối
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                
                {/* Approved requests */}
                {approvedRequests.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-md font-medium text-gray-900 mb-3">
                      Yêu cầu đã chấp nhận ({approvedRequests.length})
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Người dùng
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Thời gian yêu cầu
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Thời gian phê duyệt
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {approvedRequests.map(request => (
                            <tr key={request.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-8 w-8 bg-green-500 rounded-full flex items-center justify-center text-white font-medium">
                                    {request.username ? request.username.charAt(0).toUpperCase() : '?'}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{request.username}</div>
                                    <div className="text-sm text-gray-500">{request.user_email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{formatDateTime(request.created_at)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{formatDateTime(request.responded_at)}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {/* Rejected requests */}
                {rejectedRequests.length > 0 && (
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-3">
                      Yêu cầu đã từ chối ({rejectedRequests.length})
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Người dùng
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Thời gian yêu cầu
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Thời gian từ chối
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {rejectedRequests.map(request => (
                            <tr key={request.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-8 w-8 bg-red-500 rounded-full flex items-center justify-center text-white font-medium">
                                    {request.username ? request.username.charAt(0).toUpperCase() : '?'}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{request.username}</div>
                                    <div className="text-sm text-gray-500">{request.user_email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{formatDateTime(request.created_at)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{formatDateTime(request.responded_at)}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Danh sách người tham gia</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Người dùng hiện đang tham gia vào cuộc thi này
                  </p>
                </div>
                
                {participants.length === 0 ? (
                  <div className="bg-gray-50 p-4 rounded-md text-center text-gray-500 border border-gray-200">
                    Chưa có người tham gia nào
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Người dùng
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Thời gian tham gia
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Điểm số
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hành động
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {participants.map(participant => (
                          <tr key={participant.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-medium">
                                  {participant.username ? participant.username.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{participant.username}</div>
                                  <div className="text-sm text-gray-500">{participant.user_email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formatDateTime(participant.joined_at)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{participant.score || 0}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleRemoveParticipant(participant.id, participant.username)}
                                className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-md transition-colors"
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ManageContestRequests;