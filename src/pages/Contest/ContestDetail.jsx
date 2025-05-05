import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import LoadingSpinner from '../ProblemList/components/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import authService from '../../services/authService';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const ContestDetail = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  
  // Contest data
  const [contest, setContest] = useState(null);
  const [problems, setProblems] = useState([]);
  const [participants, setParticipants] = useState([]);
  
  // User state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isContestCreator, setIsContestCreator] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [requestStatus, setRequestStatus] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Check authentication state
  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
    setIsAdmin(authService.isAdmin());
  }, []);
  
  // Fetch contest data
  useEffect(() => {
    const fetchContestData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          // Vẫn có thể xem thông tin cơ bản của cuộc thi mà không cần đăng nhập
          const contestResponse = await axios.get(`${API_BASE_URL}/contests/${contestId}`);
          setContest(contestResponse.data);
          return;
        }
        
        // Lấy thông tin cuộc thi với chi tiết
        const contestResponse = await axios.get(`${API_BASE_URL}/contests/${contestId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setContest(contestResponse.data);
        
        // Kiểm tra xem người dùng có phải người tạo cuộc thi không
        const userId = authService.getUserInfo()?.id;
        if (userId && contestResponse.data.created_by === userId) {
          setIsContestCreator(true);
        }
        
        // Lấy danh sách bài tập của cuộc thi
        if (contestResponse.data.problems && Array.isArray(contestResponse.data.problems)) {
          setProblems(contestResponse.data.problems);
        }
        
        // Lấy danh sách người tham gia
        const participantsResponse = await axios.get(`${API_BASE_URL}/contests/${contestId}/participants`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setParticipants(participantsResponse.data);
        
        // Kiểm tra xem người dùng đã tham gia cuộc thi chưa
        const currentUser = authService.getUserInfo();
        if (currentUser) {
          const isUserParticipant = participantsResponse.data.some(
            p => p.user_id === currentUser.id
          );
          setIsParticipant(isUserParticipant);
        }
        
        // Kiểm tra xem người dùng đã gửi yêu cầu tham gia chưa
        if (currentUser) {
          const requestsResponse = await axios.get(`${API_BASE_URL}/contests/${contestId}/requests/user`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (requestsResponse.data) {
            setHasRequested(true);
            setRequestStatus(requestsResponse.data.status);
          }
        }
        
      } catch (err) {
        console.error('Lỗi khi tải thông tin cuộc thi:', err);
        setError('Không thể tải thông tin cuộc thi. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchContestData();
  }, [contestId]);
  
  // Hàm xử lý nộp yêu cầu tham gia cuộc thi
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      setSubmittingRequest(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_BASE_URL}/contests/${contestId}/request`,
        { request_message: requestMessage },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Cập nhật trạng thái
      setHasRequested(true);
      setRequestStatus('pending');
      setShowRequestForm(false);
      
      // Hiển thị thông báo thành công
      setSuccessMessage('Yêu cầu tham gia đã được gửi thành công! Vui lòng chờ người tạo cuộc thi phê duyệt.');
      
      // Tự động tắt thông báo thành công sau 5 giây
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
    } catch (err) {
      console.error('Lỗi khi gửi yêu cầu tham gia:', err);
      setError('Có lỗi xảy ra khi gửi yêu cầu tham gia. Vui lòng thử lại sau.');
    } finally {
      setSubmittingRequest(false);
    }
  };
  
  // Hàm xử lý tham gia cuộc thi (đối với cuộc thi không yêu cầu phê duyệt)
  const handleJoinContest = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      setSubmittingRequest(true);
      const token = localStorage.getItem('token');
      
      await axios.post(
        `${API_BASE_URL}/contests/${contestId}/register`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Cập nhật trạng thái
      setIsParticipant(true);
      
      // Hiển thị thông báo thành công
      setSuccessMessage('Bạn đã tham gia cuộc thi thành công!');
      
      // Tự động tắt thông báo thành công sau 5 giây
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
    } catch (err) {
      console.error('Lỗi khi tham gia cuộc thi:', err);
      setError('Có lỗi xảy ra khi tham gia cuộc thi. Vui lòng thử lại sau.');
    } finally {
      setSubmittingRequest(false);
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
  
  // Kiểm tra trạng thái cuộc thi
  const getContestStatus = () => {
    if (!contest) return {};
    
    const now = new Date();
    const start = new Date(contest.start_time);
    const end = new Date(contest.end_time);
    
    if (now < start) {
      return { text: 'Sắp diễn ra', className: 'bg-blue-100 text-blue-800' };
    } else if (now >= start && now <= end) {
      return { text: 'Đang diễn ra', className: 'bg-green-100 text-green-800' };
    } else {
      return { text: 'Đã kết thúc', className: 'bg-gray-100 text-gray-800' };
    }
  };
  
  // Kiểm tra xem người dùng có thể tham gia cuộc thi hay không
  const canJoinContest = () => {
    if (!contest) return false;
    
    const now = new Date();
    const end = new Date(contest.end_time);
    
    // Nếu đã kết thúc, không thể tham gia
    if (now > end) return false;
    
    // Nếu đã là người tham gia, không cần tham gia nữa
    if (isParticipant) return false;
    
    // Nếu đã gửi yêu cầu và đang chờ duyệt, không thể gửi lại
    if (hasRequested && requestStatus === 'pending') return false;
    
    return true;
  };
  
  // Hiển thị loading spinner khi đang tải dữ liệu
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
  
  // Hiển thị thông báo lỗi nếu không tìm thấy cuộc thi
  if (!contest) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="container mx-auto px-4 py-8 flex-grow">
          <div className="bg-red-50 p-4 rounded-md border-l-4 border-red-500">
            <p className="text-red-700">Không tìm thấy cuộc thi này hoặc bạn không có quyền truy cập.</p>
          </div>
          <div className="mt-4 flex justify-center">
            <Link
              to="/cuoc-thi"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Xem danh sách cuộc thi
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  // Lấy trạng thái cuộc thi
  const status = getContestStatus();
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        {error && (
          <div className="mb-4">
            <ErrorMessage error={error} />
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">{contest.title}</h1>
                <div className="mt-1 flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                    {status.text}
                  </span>
                  
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    contest.is_public ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {contest.is_public ? 'Công khai' : 'Giới hạn'}
                  </span>
                  
                  {contest.requires_approval && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Cần phê duyệt
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mt-2 md:mt-0 flex space-x-2">
                <Link
                  to="/cuoc-thi"
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Quay lại
                </Link>
                
                {isAdmin && (
                  <Link
                    to={`/admin/quan-ly-yeu-cau/${contestId}`}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Quản lý yêu cầu
                  </Link>
                )}
              </div>
            </div>
          </div>
          
          {/* Thông tin cuộc thi */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Thông tin chi tiết và mô tả */}
              <div className="lg:col-span-2">
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">Mô tả cuộc thi</h2>
                  <div className="prose prose-sm max-w-none text-gray-500">
                    {contest.description}
                  </div>
                </div>
                
                {/* Thời gian cuộc thi */}
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">Thời gian</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-500 mb-1">Bắt đầu</div>
                      <div className="text-base font-semibold text-gray-900">{formatDateTime(contest.start_time)}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-500 mb-1">Kết thúc</div>
                      <div className="text-base font-semibold text-gray-900">{formatDateTime(contest.end_time)}</div>
                    </div>
                  </div>
                </div>
                
                {/* Danh sách bài tập */}
                {(isParticipant || isAdmin || isContestCreator) && (
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-2">Danh sách bài tập</h2>
                    {problems.length === 0 ? (
                      <div className="bg-gray-50 p-4 rounded-md text-center text-gray-500 border border-gray-200">
                        Cuộc thi chưa có bài tập nào
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                STT
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tên bài tập
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Độ khó
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Điểm
                              </th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Hành động
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {problems.map((problem, index) => (
                              <tr key={problem.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {problem.order || index + 1}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{problem.problem ? problem.problem.title : 'Bài tập không tồn tại'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {problem.problem && (
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      problem.problem.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                      problem.problem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {problem.problem.difficulty === 'easy' ? 'Dễ' : 
                                        problem.problem.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{problem.points}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <Link
                                    to={`/problems/${problem.problem_id}?contest=${contestId}`}
                                    className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-md transition-colors"
                                  >
                                    Làm bài
                                  </Link>
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
              
              {/* Sidebar */}
              <div>
                {/* Trạng thái tham gia */}
                <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-md font-medium text-gray-900 mb-2">Trạng thái tham gia</h3>
                  
                  {!isAuthenticated ? (
                    <div>
                      <p className="text-sm text-gray-500 mb-4">Đăng nhập để tham gia cuộc thi này</p>
                      <Link
                        to={`/login?redirect=/cuoc-thi/${contestId}`}
                        className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Đăng nhập ngay
                      </Link>
                    </div>
                  ) : isParticipant ? (
                    <div className="bg-green-50 p-3 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">Bạn đã tham gia cuộc thi này</p>
                        </div>
                      </div>
                    </div>
                  ) : hasRequested ? (
                    <div className={`p-3 rounded-md ${
                      requestStatus === 'pending' ? 'bg-yellow-50' :
                      requestStatus === 'approved' ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className={`h-5 w-5 ${
                            requestStatus === 'pending' ? 'text-yellow-400' :
                            requestStatus === 'approved' ? 'text-green-400' : 'text-red-400'
                          }`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            {requestStatus === 'pending' ? (
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            ) : requestStatus === 'approved' ? (
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            ) : (
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            )}
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className={`text-sm font-medium ${
                            requestStatus === 'pending' ? 'text-yellow-800' :
                            requestStatus === 'approved' ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {requestStatus === 'pending' ? 'Yêu cầu tham gia đang chờ phê duyệt' :
                              requestStatus === 'approved' ? 'Yêu cầu tham gia đã được chấp nhận' :
                              'Yêu cầu tham gia đã bị từ chối'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : canJoinContest() ? (
                    contest.requires_approval ? (
                      <div>
                        {showRequestForm ? (
                          <form onSubmit={handleSubmitRequest}>
                            <div className="mb-3">
                              <label htmlFor="request_message" className="block text-sm font-medium text-gray-700 mb-1">
                                Lời nhắn (không bắt buộc)
                              </label>
                              <textarea
                                id="request_message"
                                name="request_message"
                                value={requestMessage}
                                onChange={(e) => setRequestMessage(e.target.value)}
                                rows={3}
                                placeholder="Giới thiệu ngắn gọn về bản thân và lý do muốn tham gia cuộc thi..."
                                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>
                            <div className="flex space-x-2">
                              
                            <button
  type="submit"
  disabled={submittingRequest}
  className={`flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
    submittingRequest ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
>
  {submittingRequest ? (
    <>
      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Đang gửi...
    </>
  ) : 'Gửi yêu cầu'}
</button>
                              <button
                                type="button"
                                onClick={() => setShowRequestForm(false)}
                                className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Hủy
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            onClick={() => setShowRequestForm(true)}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Yêu cầu tham gia
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={handleJoinContest}
                        disabled={submittingRequest}
                        className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                          submittingRequest ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                      >
                        {submittingRequest ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Đang tham gia...
                          </>
                        ) : 'Tham gia ngay'}
                      </button>
                    )
                  ) : (
                    <div className="bg-gray-100 p-3 rounded-md">
                      <p className="text-sm text-gray-600">
                        {isParticipant ? 'Bạn đã tham gia cuộc thi này.' : hasRequested && requestStatus === 'pending' ? 'Yêu cầu tham gia của bạn đang chờ được phê duyệt.' : 'Bạn không thể tham gia cuộc thi này.'}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Thông tin người tạo */}
                <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-md font-medium text-gray-900 mb-2">Thông tin người tạo</h3>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <svg className="h-10 w-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{contest.created_by_user?.name || 'Người dùng ẩn danh'}</p>
                      <p className="text-xs text-gray-500">Đã tạo vào {formatDateTime(contest.created_at)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Số lượng người tham gia */}
                <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-md font-medium text-gray-900 mb-1">Số người tham gia</h3>
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    <span className="text-xl font-semibold text-gray-900">{participants?.length || 0}</span>
                  </div>
                </div>
                
                {/* Danh sách người tham gia */}
                {(isParticipant || isAdmin || isContestCreator) && (
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-md font-medium text-gray-900 mb-3">Người tham gia</h3>
                    {participants.length === 0 ? (
                      <div className="text-sm text-gray-500 text-center py-2">
                        Chưa có người tham gia
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
                        {participants.slice(0, 10).map((participant) => (
                          <li key={participant.id} className="py-2">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <svg className="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{participant.user?.name || 'Người dùng ẩn danh'}</p>
                                <p className="text-xs text-gray-500">Tham gia: {formatDateTime(participant.joined_at)}</p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    
                    {participants.length > 10 && (
                      <div className="mt-2 text-center">
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Xem thêm
                          <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ContestDetail;
                            
                                
