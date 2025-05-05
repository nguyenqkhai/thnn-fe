import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import LoadingSpinner from '../ProblemList/components/LoadingSpinner';
import ErrorMessage from '../ProblemList/components/ErrorMessage';
import authService from '../../services/authService';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const ContestDetail = () => {
  // Lấy contestId từ URL params
  const { contestId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Contest data state
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
  const [apiError, setApiError] = useState(null);

  // Debug - Log contestId và URL hiện tại  
  useEffect(() => {
    console.log('Current URL:', location.pathname);
    console.log('ContestId from URL:', contestId);
  }, [location, contestId]);
  
  // Check authentication state
  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
    setIsAdmin(authService.isAdmin());
  }, []);
  
  // Thêm timeout để tránh loading vô hạn
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log("Timeout - buộc kết thúc loading");
        setLoading(false);
        setError("Không thể tải dữ liệu sau thời gian chờ. Vui lòng làm mới trang.");
      }
    }, 10000); // 10 giây

    return () => clearTimeout(loadingTimeout);
  }, [loading]);
  
  // Kiểm tra ID và chuyển hướng nếu không có ID
  useEffect(() => {
    if (!contestId) {
      console.log('No contestId detected, redirecting to contest list');
      navigate('/cac-ky-thi');
      return;
    }
  }, [contestId, navigate]);
  
  // Fetch contest data
  useEffect(() => {
    const fetchContestData = async () => {
      // Kiểm tra contestId trước khi gọi API
      if (!contestId) {
        console.log('fetchContestData: No contestId detected');
        setError('ID cuộc thi không tồn tại. Vui lòng quay lại danh sách cuộc thi.');
        setLoading(false);
        return;
      }
      
      try {
        console.log('Fetching contest data for ID:', contestId);
        const token = localStorage.getItem('token');
        
        // API URL
        const contestUrl = `${API_BASE_URL}/contests/${contestId}`;
        console.log('API URL:', contestUrl);
        
        // Thực hiện các yêu cầu API trong khối try-catch
        let contestResponse;
        
        try {
          if (!token) {
            // Vẫn có thể xem thông tin cơ bản về cuộc thi mà không cần đăng nhập
            console.log('Fetching without token');
            contestResponse = await axios.get(contestUrl);
          } else {
            // Lấy thông tin cuộc thi với chi tiết
            console.log('Fetching with token');
            contestResponse = await axios.get(contestUrl, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
          }
          
          console.log('Contest response:', contestResponse.data);
          
          // Kiểm tra nếu phản hồi không có dữ liệu hợp lệ
          if (!contestResponse.data || Object.keys(contestResponse.data).length === 0) {
            throw new Error('Không tìm thấy thông tin cuộc thi');
          }
          
          // Thêm thông tin mô phỏng nếu API bị lỗi
          // *** Sử dụng tạm thời cho đến khi API được sửa ***
          if (!contestResponse.data.id) {
            // Thêm thông tin giả định
            contestResponse.data = {
              ...contestResponse.data,
              id: contestId,
              created_at: new Date().toISOString(),
              title: contestResponse.data.title || "Cuộc thi",
              start_time: contestResponse.data.start_time || new Date().toISOString(),
              end_time: contestResponse.data.end_time || new Date(Date.now() + 7*24*60*60*1000).toISOString(),
              is_public: contestResponse.data.is_public !== undefined ? contestResponse.data.is_public : true,
              requires_approval: contestResponse.data.requires_approval !== undefined ? contestResponse.data.requires_approval : false,
              problems: contestResponse.data.problems || []
            }
          }
          
          setContest(contestResponse.data);
          
          // Kiểm tra xem người dùng có phải là người tạo cuộc thi không
          const userId = authService.getUserInfo()?.id;
          if (userId && contestResponse.data.created_by === userId) {
            setIsContestCreator(true);
          }
          
          // Lấy các bài tập trong cuộc thi
          if (contestResponse.data.problems && Array.isArray(contestResponse.data.problems)) {
            setProblems(contestResponse.data.problems);
          } else {
            // Nếu không có sẵn trong phản hồi, gọi API riêng để lấy bài tập
            try {
              const problemsResponse = await axios.get(`${API_BASE_URL}/contests/${contestId}/problems`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              setProblems(problemsResponse.data || []);
            } catch (problemsErr) {
              console.error('Lỗi khi lấy danh sách bài tập:', problemsErr);
              // Không đặt lỗi chính tại đây để vẫn có thể hiển thị thông tin cuộc thi
            }
          }
          
          // Lấy danh sách người tham gia
          try {
            const participantsResponse = await axios.get(`${API_BASE_URL}/contests/${contestId}/participants`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            setParticipants(participantsResponse.data || []);
            
            // Kiểm tra xem người dùng có phải là người tham gia không
            const currentUser = authService.getUserInfo();
            if (currentUser) {
              const isUserParticipant = participantsResponse.data.some(
                p => p.user_id === currentUser.id
              );
              setIsParticipant(isUserParticipant);
            }
          } catch (participantsErr) {
            console.error('Lỗi khi lấy danh sách người tham gia:', participantsErr);
            // Không đặt lỗi chính tại đây để vẫn có thể hiển thị thông tin cuộc thi
            setParticipants([]);
          }
          
          // Kiểm tra xem người dùng đã yêu cầu tham gia chưa
          try {
            const currentUser = authService.getUserInfo();
            if (currentUser) {
              const requestsResponse = await axios.get(`${API_BASE_URL}/contests/${contestId}/requests/user`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              
              if (requestsResponse.data) {
                setHasRequested(true);
                setRequestStatus(requestsResponse.data.status || 'pending');
              }
            }
          } catch (requestErr) {
            // Chỉ ghi log lỗi nhưng tiếp tục - người dùng có thể chưa gửi yêu cầu
            console.log('Không tìm thấy yêu cầu hoặc lỗi khi kiểm tra trạng thái yêu cầu:', requestErr);
          }
        
        } catch (apiErr) {
          // Xử lý lỗi API
          console.error('API Error:', apiErr);
          
          // Lưu thông tin lỗi API để hiển thị cho người phát triển
          if (apiErr.response) {
            setApiError({
              status: apiErr.response.status,
              data: apiErr.response.data,
              headers: apiErr.response.headers
            });
          } else {
            setApiError({
              message: apiErr.message || 'Unknown API error'
            });
          }
          
          // Tạo dữ liệu cuộc thi mẫu để tránh lỗi UI
          const mockContest = {
            id: contestId,
            title: "Thông tin cuộc thi (Mẫu)",
            description: "Backend API đang gặp lỗi. Dữ liệu này chỉ là mẫu. Vui lòng thử lại sau.",
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
            is_public: true,
            requires_approval: false,
            created_by: "system",
            created_at: new Date().toISOString()
          };
          
          setContest(mockContest);
          setProblems([]);
          setParticipants([]);
          setError('Đã xảy ra lỗi khi tải thông tin cuộc thi từ server. Đây chỉ là dữ liệu mẫu.');
        }
        
      } catch (err) {
        console.error('Lỗi khi lấy dữ liệu cuộc thi:', err);
        if (err.response && err.response.status === 404) {
          setError('Không tìm thấy cuộc thi. Cuộc thi có thể đã bị xóa hoặc bạn không có quyền truy cập.');
        } else {
          setError('Không thể tải thông tin cuộc thi. Vui lòng thử lại sau.');
        }
      } finally {
        // Luôn đảm bảo loading được tắt dù có lỗi hay không
        setLoading(false);
      }
    };
    
    // Chỉ gọi API khi contestId hợp lệ
    if (contestId) {
      // Đặt loading = true khi bắt đầu fetch dữ liệu
      setLoading(true);
      fetchContestData();
    } else {
      // Nếu không có contestId hợp lệ, dừng loading ngay lập tức
      setLoading(false);
    }
  }, [contestId]); // Thêm contestId như một dependency
  
  // Handle join request submission
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/login', { state: { returnUrl: `/cac-ky-thi/${contestId}` } });
      return;
    }
    
    if (!contestId) {
      setError('Không tìm thấy ID cuộc thi. Vui lòng thử lại.');
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
      setSuccessMessage('Yêu cầu tham gia của bạn đã được gửi thành công! Vui lòng chờ phê duyệt từ người tạo cuộc thi.');
      
      // Tự động ẩn thông báo thành công sau 5 giây
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
    } catch (err) {
      console.error('Lỗi khi gửi yêu cầu tham gia:', err);
      setError('Đã xảy ra lỗi khi gửi yêu cầu tham gia của bạn. Vui lòng thử lại sau.');
    } finally {
      setSubmittingRequest(false);
    }
  };
  
  // Handle join contest (for contests without approval required)
  const handleJoinContest = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnUrl: `/cac-ky-thi/${contestId}` } });
      return;
    }
    
    if (!contestId) {
      setError('Không tìm thấy ID cuộc thi. Vui lòng thử lại.');
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
      
      // Cập nhật danh sách người tham gia
      try {
        const participantsResponse = await axios.get(`${API_BASE_URL}/contests/${contestId}/participants`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setParticipants(participantsResponse.data || []);
      } catch (participantsErr) {
        console.error('Lỗi khi làm mới danh sách người tham gia:', participantsErr);
      }
      
      // Hiển thị thông báo thành công
      setSuccessMessage('Bạn đã tham gia cuộc thi thành công!');
      
      // Tự động ẩn thông báo thành công sau 5 giây
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
    } catch (err) {
      console.error('Lỗi khi tham gia cuộc thi:', err);
      setError('Đã xảy ra lỗi khi tham gia cuộc thi. Vui lòng thử lại sau.');
    } finally {
      setSubmittingRequest(false);
    }
  };
  
  // Format datetime
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    
    try {
      const date = new Date(dateTimeStr);
      
      // Kiểm tra ngày hợp lệ
      if (isNaN(date.getTime())) {
        return '';
      }
      
      // Format date
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      // Format time
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      console.error('Lỗi khi định dạng ngày tháng:', error);
      return '';
    }
  };
  
  // Check contest status
  const getContestStatus = () => {
    if (!contest) return { text: 'Unknown', className: 'bg-gray-100 text-gray-800' };
    
    try {
      const now = new Date();
      const start = new Date(contest.start_time);
      const end = new Date(contest.end_time);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { text: 'Unknown', className: 'bg-gray-100 text-gray-800' };
      }
      
      if (now < start) {
        return { text: 'Upcoming', className: 'bg-blue-100 text-blue-800' };
      } else if (now >= start && now <= end) {
        return { text: 'Ongoing', className: 'bg-green-100 text-green-800' };
      } else {
        return { text: 'Finished', className: 'bg-gray-100 text-gray-800' };
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra trạng thái cuộc thi:', error);
      return { text: 'Unknown', className: 'bg-gray-100 text-gray-800' };
    }
  };
  
  // Check if user can join the contest
  const canJoinContest = () => {
    if (!contest) return false;
    if (!isAuthenticated) return true; // Cho phép hiển thị nút đăng nhập/tham gia
    
    try {
      const now = new Date();
      const end = new Date(contest.end_time);
      
      if (isNaN(end.getTime())) {
        return false;
      }
      
      // Không thể tham gia nếu cuộc thi đã kết thúc
      if (now > end) return false;
      
      // Không thể tham gia nếu đã là người tham gia
      if (isParticipant) return false;
      
      // Không thể tham gia nếu yêu cầu đang chờ xử lý
      if (hasRequested && requestStatus === 'pending') return false;
      
      return true;
    } catch (error) {
      console.error('Lỗi khi kiểm tra quyền tham gia cuộc thi:', error);
      return false;
    }
  };
  
  // Loading spinner while loading data
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">Đang tải thông tin cuộc thi {contestId}...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  // Error message if contest not found or contestId is missing
  if (error && !contest) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="container mx-auto px-4 py-8 flex-grow">
          <div className="bg-red-50 p-4 rounded-md border-l-4 border-red-500">
            <p className="text-red-700">
              {error || 'Không tìm thấy cuộc thi hoặc bạn không có quyền truy cập.'}
            </p>
            <p className="mt-2 text-gray-600">Contest ID: {contestId}</p>
            {apiError && (
              <div className="mt-4 p-4 bg-white rounded border border-red-200">
                <p className="font-semibold text-gray-700">Thông tin lỗi API (dành cho nhà phát triển):</p>
                <pre className="mt-2 text-xs overflow-auto max-h-40 p-2 bg-gray-100 rounded">
                  {JSON.stringify(apiError, null, 2)}
                </pre>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-center">
            <Link
              to="/cac-ky-thi"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Xem tất cả cuộc thi
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  // Get contest status
  const status = getContestStatus();
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-grow">
        {error && (
          <div className="mb-4">
            <ErrorMessage error={error} />
            {apiError && isAdmin && (
              <div className="mt-2 p-3 bg-white rounded border border-red-200">
                <p className="font-semibold text-gray-700 text-sm">Thông tin lỗi API (chỉ hiển thị cho admin):</p>
                <pre className="mt-1 text-xs overflow-auto max-h-20 p-2 bg-gray-100 rounded">
                  {JSON.stringify(apiError, null, 2)}
                </pre>
              </div>
            )}
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
        
        {/* Thông tin cuộc thi */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">{contest.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.className}`}>
                  {status.text === 'Upcoming' ? 'Sắp diễn ra' : status.text === 'Ongoing' ? 'Đang diễn ra' : 'Đã kết thúc'}
                </span>
                <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                  {contest.is_public ? 'Công khai' : 'Riêng tư'}
                </span>
                {contest.requires_approval && (
                  <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                    Yêu cầu phê duyệt
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex flex-col md:items-end">
              <div className="text-sm text-white">
                <span className="font-semibold">Bắt đầu:</span> {formatDateTime(contest.start_time)}
              </div>
              <div className="text-sm text-white">
                <span className="font-semibold">Kết thúc:</span> {formatDateTime(contest.end_time)}
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-4 text-gray-700 whitespace-pre-line">{contest.description}</div>
            {/* Các nút thao tác */}
            <div className="flex flex-wrap gap-3 mb-4">
              {canJoinContest() && (
                !isAuthenticated ? (
                  <Link
                    to={`/login?redirect=/cac-ky-thi/${contestId}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    Đăng nhập để tham gia
                  </Link>
                ) : contest.requires_approval ? (
                  !hasRequested ? (
                    <button
                      onClick={() => setShowRequestForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                      disabled={submittingRequest}
                    >
                      Gửi yêu cầu tham gia
                    </button>
                  ) : (
                    <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md">
                      Đã gửi yêu cầu ({requestStatus === 'pending' ? 'Đang chờ duyệt' : requestStatus})
                    </span>
                  )
                ) : (
                  <button
                    onClick={handleJoinContest}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    disabled={submittingRequest}
                  >
                    Tham gia cuộc thi
                  </button>
                )
              )}
              {isContestCreator && (
                <Link
                  to={`/admin/sua-cuoc-thi/${contest.id}`}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                >
                  Quản lý cuộc thi
                </Link>
              )}
              {isAdmin && (
                <Link
                  to={`/admin/quan-ly-yeu-cau/${contest.id}`}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition"
                >
                  Quản lý yêu cầu tham gia
                </Link>
              )}
            </div>
            {/* Form gửi yêu cầu tham gia */}
            {showRequestForm && (
              <form onSubmit={handleSubmitRequest} className="mb-4 bg-gray-50 p-4 rounded-md border border-gray-200">
                <label className="block mb-2 font-medium text-gray-700">Lời nhắn gửi đến người tạo cuộc thi:</label>
                <textarea
                  className="w-full border border-gray-300 rounded-md p-2 mb-2"
                  rows={3}
                  value={requestMessage}
                  onChange={e => setRequestMessage(e.target.value)}
                  required
                  placeholder="Nhập lời nhắn của bạn..."
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    disabled={submittingRequest}
                  >
                    {submittingRequest ? 'Đang gửi...' : 'Gửi yêu cầu'}
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                    onClick={() => setShowRequestForm(false)}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Danh sách bài tập */}
        {/* Danh sách bài tập */}
<div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
  <div className="bg-gradient-to-r from-blue-100 to-blue-200 px-6 py-3">
    <h2 className="text-lg font-semibold text-blue-800">Danh sách bài tập</h2>
  </div>
  <div className="p-6">
    {problems.length === 0 ? (
      <div className="text-gray-500">Chưa có bài tập nào trong cuộc thi này.</div>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bài tập
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Độ khó
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Danh mục
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Điểm
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {problems.map((problem, idx) => {
              // Kiểm tra xem bài này đã giải chưa (giả định có trường solved hoặc cần kiểm tra từ submissions)
              const isSolved = problem.solved || false; // Thay bằng logic thực tế của bạn
              
              return (
                <tr key={problem.id || idx}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {problem.problem?.title || problem.title || `Bài tập ${idx + 1}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${problem.difficulty === 'easy' ? 'bg-green-100 text-green-800' : 
                      problem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'}`}>
                      {problem.difficulty === 'easy' ? 'Dễ' : 
                       problem.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {problem.problem?.category || problem.category || 'Chưa phân loại'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {problem.points || 100}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${isSolved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {isSolved ? 'Đã giải' : 'Chưa giải'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/problems/${problem.problem_id || problem.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Giải bài
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
</div>

        {/* Danh sách người tham gia */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-green-100 to-green-200 px-6 py-3">
            <h2 className="text-lg font-semibold text-green-800">Người tham gia ({participants.length})</h2>
          </div>
          <div className="p-6">
            {participants.length === 0 ? (
              <div className="text-gray-500">Chưa có ai tham gia cuộc thi này.</div>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {participants.map((p, idx) => (
                  <li key={p.id || idx} className="flex items-center gap-2 bg-gray-50 rounded-md px-3 py-2">
                    <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                      {(p.username || p.full_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{p.username || p.full_name || 'Người dùng'}</div>
                      {p.is_admin && <span className="text-xs text-yellow-600 ml-1">(Admin)</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <Link
            to="/cac-ky-thi"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Quay lại danh sách cuộc thi
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContestDetail;