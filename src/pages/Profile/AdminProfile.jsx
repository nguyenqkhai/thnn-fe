import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import LoadingSpinner from '../ProblemList/components/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const AdminProfile = () => {
  const navigate = useNavigate();
  
  // User data state
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form data states
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    bio: ''
  });
  
  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  
  // Admin stats states
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    totalProblems: 0,
    totalSubmissions: 0,
    activeContests: 0,
    pendingSubmissions: 0
  });
  
  // Recent activity states
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [recentProblems, setRecentProblems] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  
  // System status
  const [systemStatus, setSystemStatus] = useState({
    apiStatus: 'online',
    judgeStatus: 'online',
    databaseStatus: 'online'
  });
  
  // Get auth token
  const getAuthToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Vui lòng đăng nhập để xem trang quản trị');
    }
    return token;
  };
  
  // Fetch user data
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        
        const response = await axios.get(`${API_BASE_URL}/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Check if user is admin
        if (!response.data.is_admin) {
          setError('Bạn không có quyền truy cập trang quản trị');
          setTimeout(() => navigate('/thong-tin-ca-nhan'), 2000);
          return;
        }
        
        setUserData(response.data);
        
        // Initialize form data
        setFormData({
          full_name: response.data.full_name || '',
          email: response.data.email || '',
          bio: response.data.bio || ''
        });
        
        // Fetch admin stats
        await fetchAdminStats();
        
        // Fetch recent activity
        await fetchRecentActivity();
        
      } catch (err) {
        console.error('Error fetching admin data:', err);
        
        if (err.message === 'Vui lòng đăng nhập để xem trang quản trị' || 
            (err.response && err.response.status === 401)) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError('Không thể tải thông tin quản trị. Vui lòng thử lại sau.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminData();
  }, [navigate]);
  
  // Fetch admin stats
  const fetchAdminStats = async () => {
    try {
      const token = getAuthToken();
      
      // Fetch users count
      const usersResponse = await axios.get(`${API_BASE_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const totalUsers = usersResponse.data.length;
      
      // Fetch problems count
      const problemsResponse = await axios.get(`${API_BASE_URL}/problems`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const totalProblems = problemsResponse.data.length;
      
      // Fetch submissions count
      const submissionsResponse = await axios.get(`${API_BASE_URL}/submissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const totalSubmissions = submissionsResponse.data.length;
      const pendingSubmissions = submissionsResponse.data.filter(sub => sub.status === 'pending').length;
      
      // Fetch contests count
      const contestsResponse = await axios.get(`${API_BASE_URL}/contests?status=ongoing`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const activeContests = contestsResponse.data.length;
      
      setAdminStats({
        totalUsers,
        totalProblems,
        totalSubmissions,
        activeContests,
        pendingSubmissions
      });
      
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    }
  };
  
  // Fetch recent activity
  const fetchRecentActivity = async () => {
    try {
      setLoadingActivity(true);
      const token = getAuthToken();
      
      // Fetch recent submissions
      const submissionsResponse = await axios.get(`${API_BASE_URL}/submissions?limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setRecentSubmissions(submissionsResponse.data);
      
      // Fetch recent problems
      const problemsResponse = await axios.get(`${API_BASE_URL}/problems?limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setRecentProblems(problemsResponse.data);
      
    } catch (err) {
      console.error('Error fetching recent activity:', err);
    } finally {
      setLoadingActivity(false);
    }
  };
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle password input change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    if (editMode) {
      // Reset form data when canceling
      setFormData({
        full_name: userData.full_name || '',
        email: userData.email || '',
        bio: userData.bio || ''
      });
    }
    setEditMode(!editMode);
  };
  
  // Update profile
  const handleUpdateProfile = async () => {
    try {
      const token = getAuthToken();
      
      // Prepare data to update
      const dataToUpdate = {};
      
      if (formData.full_name !== userData.full_name) {
        dataToUpdate.full_name = formData.full_name;
      }
      
      if (formData.email !== userData.email) {
        dataToUpdate.email = formData.email;
      }
      
      if (formData.bio !== userData.bio) {
        dataToUpdate.bio = formData.bio;
      }
      
      // Only update if there are changes
      if (Object.keys(dataToUpdate).length > 0) {
        const response = await axios.put(
          `${API_BASE_URL}/users/me`,
          dataToUpdate,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        // Update user data
        setUserData(response.data);
        
        // Show success message
        setError(null);
        setTimeout(() => {
          setEditMode(false);
        }, 1000);
      } else {
        // No changes to update
        setEditMode(false);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Không thể cập nhật thông tin cá nhân. Vui lòng thử lại sau.');
    }
  };
  
  // Update password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    setPasswordError(null);
    setPasswordSuccess(null);
    
    // Validate passwords
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('Mật khẩu mới không khớp với mật khẩu xác nhận');
      return;
    }
    
    if (passwordData.new_password.length < 8) {
      setPasswordError('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }
    
    try {
      const token = getAuthToken();
      
      // Send password update request
      await axios.put(
        `${API_BASE_URL}/users/me`,
        { password: passwordData.new_password },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Show success message
      setPasswordSuccess('Mật khẩu đã được cập nhật thành công');
      
      // Reset form
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      // Hide password form after 2 seconds
      setTimeout(() => {
        setShowPasswordForm(false);
        setPasswordSuccess(null);
      }, 2000);
      
    } catch (err) {
      console.error('Error updating password:', err);
      setPasswordError('Không thể cập nhật mật khẩu. Vui lòng thử lại sau.');
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };
  
  // Get submission status color
  const getSubmissionStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'wrong_answer': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'time_limit_exceeded': return 'bg-orange-100 text-orange-800';
      case 'memory_limit_exceeded': return 'bg-orange-100 text-orange-800';
      case 'runtime_error': return 'bg-red-100 text-red-800';
      case 'compilation_error': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get submission status text
  const getSubmissionStatusText = (status) => {
    switch (status) {
      case 'accepted': return 'Đúng';
      case 'wrong_answer': return 'Sai';
      case 'pending': return 'Đang chờ';
      case 'time_limit_exceeded': return 'TLE';
      case 'memory_limit_exceeded': return 'MLE';
      case 'runtime_error': return 'RE';
      case 'compilation_error': return 'CE';
      default: return status;
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto px-4 py-8 flex-grow">
          <ErrorMessage error={error} />
        </div>
        <Footer />
      </div>
    );
  }
  
  // No user data
  if (!userData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto px-4 py-8 flex-grow">
          <div className="bg-yellow-50 p-4 rounded-md border-l-4 border-yellow-400">
            <p className="text-yellow-700">Không tìm thấy thông tin quản trị viên.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
              <h1 className="text-2xl font-bold text-white">Bảng Điều Khiển Quản Trị</h1>
            </div>
            
            <div className="p-6">
              {/* Admin stats */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg shadow-sm flex flex-col items-center">
                  <span className="text-blue-800 font-semibold text-lg">{adminStats.totalUsers}</span>
                  <span className="text-gray-600 text-sm">Người dùng</span>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg shadow-sm flex flex-col items-center">
                  <span className="text-green-800 font-semibold text-lg">{adminStats.totalProblems}</span>
                  <span className="text-gray-600 text-sm">Bài tập</span>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg shadow-sm flex flex-col items-center">
                  <span className="text-yellow-800 font-semibold text-lg">{adminStats.totalSubmissions}</span>
                  <span className="text-gray-600 text-sm">Bài nộp</span>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg shadow-sm flex flex-col items-center">
                  <span className="text-purple-800 font-semibold text-lg">{adminStats.activeContests}</span>
                  <span className="text-gray-600 text-sm">Cuộc thi đang diễn ra</span>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg shadow-sm flex flex-col items-center">
                  <span className="text-red-800 font-semibold text-lg">{adminStats.pendingSubmissions}</span>
                  <span className="text-gray-600 text-sm">Bài nộp đang chờ</span>
                </div>
              </div>
              
              {/* Quick access */}
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm mb-8">
                <h2 className="text-lg font-semibold mb-4">Truy cập nhanh</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Link to="/admin/them-bai-tap" className="bg-green-100 hover:bg-green-200 p-3 rounded-lg text-center">
                    Thêm bài tập mới
                  </Link>
                  <Link to="/admin/quan-ly-bai-tap" className="bg-blue-100 hover:bg-blue-200 p-3 rounded-lg text-center">
                    Quản lý bài tập
                  </Link>
                  <Link to="/admin/quan-ly-nguoi-dung" className="bg-purple-100 hover:bg-purple-200 p-3 rounded-lg text-center">
                    Quản lý người dùng
                  </Link>
                  <Link to="/cac-bai-da-nop" className="bg-yellow-100 hover:bg-yellow-200 p-3 rounded-lg text-center">
                    Xem bài nộp
                  </Link>
                </div>
              </div>
              
              {/* Recent activity and system status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column - System Status */}
                <div className="lg:col-span-1">
                  {/* Profile */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
                    <div className="flex items-center mb-4">
                      <div className="h-16 w-16 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-medium mr-4">
                        {userData.username ? userData.username.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{userData.username}</h3>
                        <p className="text-indigo-600 font-medium">Administrator</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Email:</span> {userData.email}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Họ tên:</span> {userData.full_name || '(Chưa cập nhật)'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Tham gia:</span> {formatDate(userData.created_at)}
                      </p>
                    </div>
                    
                    <div className="mt-4">
                      <button
                        onClick={toggleEditMode}
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        Chỉnh sửa thông tin
                      </button>
                      <span className="text-gray-300 mx-2">|</span>
                      <button
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        Đổi mật khẩu
                      </button>
                    </div>
                  </div>
                  
                  {/* System status */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
                    <h3 className="text-lg font-semibold mb-4">Trạng thái hệ thống</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">API Server</span>
                        <span className={getStatusColor(systemStatus.apiStatus)}>
                          ● {systemStatus.apiStatus.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Judge Server</span>
                        <span className={getStatusColor(systemStatus.judgeStatus)}>
                          ● {systemStatus.judgeStatus.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Database</span>
                        <span className={getStatusColor(systemStatus.databaseStatus)}>
                          ● {systemStatus.databaseStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Edit Profile */}
                  {editMode && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
                      <h3 className="text-lg font-semibold mb-4">Chỉnh sửa thông tin</h3>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                            Họ tên
                          </label>
                          <input
                            type="text"
                            id="full_name"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                            Giới thiệu
                          </label>
                          <textarea
                            id="bio"
                            name="bio"
                            value={formData.bio || ''}
                            onChange={handleInputChange}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          ></textarea>
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={toggleEditMode}
                            className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={handleUpdateProfile}
                            className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                          >
                            Lưu
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Password Form */}
                  {showPasswordForm && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold mb-4">Đổi mật khẩu</h3>
                      
                      {passwordError && (
                        <div className="mb-4 bg-red-50 p-3 rounded-md border-l-4 border-red-500">
                          <p className="text-sm text-red-700">{passwordError}</p>
                        </div>
                      )}
                      
                      {passwordSuccess && (
                        <div className="mb-4 bg-green-50 p-3 rounded-md border-l-4 border-green-500">
                          <p className="text-sm text-green-700">{passwordSuccess}</p>
                        </div>
                      )}
                      
                      <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div>
                          <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
                            Mật khẩu hiện tại
                          </label>
                          <input
                            type="password"
                            id="current_password"
                            name="current_password"
                            value={passwordData.current_password}
                            onChange={handlePasswordChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
                            Mật khẩu mới
                          </label>
                          <input
                            type="password"
                            id="new_password"
                            name="new_password"
                            value={passwordData.new_password}
                            onChange={handlePasswordChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">Mật khẩu phải có ít nhất 8 ký tự</p>
                        </div>
                        
                        <div>
                          <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                            Xác nhận mật khẩu mới
                          </label>
                          <input
                            type="password"
                            id="confirm_password"
                            name="confirm_password"
                            value={passwordData.confirm_password}
                            onChange={handlePasswordChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setShowPasswordForm(false)}
                            className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                          >
                            Cập nhật
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
                
                {/* Right column - Recent Activity */}
                <div className="lg:col-span-2">
                  {/* Recent problems */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Bài tập gần đây</h3>
                      <Link to="/admin/quan-ly-bai-tap" className="text-sm text-indigo-600 hover:text-indigo-800">
                        Xem tất cả
                      </Link>
                    </div>
                    
                    {loadingActivity ? (
                      <div className="py-8 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                      </div>
                    ) : recentProblems.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">Không có bài tập nào</p>
                    ) : (
                      <div className="space-y-2">
                        {recentProblems.map((problem) => (
                          <div key={problem.id} className="bg-gray-50 p-3 rounded-md">
                            <div className="flex justify-between items-center">
                              <Link 
                                to={`/problems/${problem.id}`}
                                className="font-medium text-indigo-600 hover:text-indigo-800"
                              >
                                {problem.title}
                              </Link>
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-200">
                                {problem.difficulty === 'easy' ? 'Dễ' : 
                                 problem.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                              </span>
                            </div>
                            <div className="flex items-center mt-1 text-xs text-gray-500 space-x-2">
                              <span>{problem.is_public ? 'Public' : 'Private'}</span>
                              <span>•</span>
                              <span>{formatDate(problem.created_at)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Recent submissions */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Bài nộp gần đây</h3>
                      <Link to="/cac-bai-da-nop" className="text-sm text-indigo-600 hover:text-indigo-800">
                        Xem tất cả
                      </Link>
                    </div>
                    
                    {loadingActivity ? (
                      <div className="py-8 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                      </div>
                    ) : recentSubmissions.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">Không có bài nộp nào</p>
                    ) : (
                      <div className="space-y-2">
                        {recentSubmissions.map((submission) => (
                          <div key={submission.id} className="bg-gray-50 p-3 rounded-md">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium">{submission.username || 'Người dùng'}</span>
                                <span className="mx-2">•</span>
                                <Link 
                                  to={`/problems/${submission.problem_id}`}
                                  className="text-indigo-600 hover:text-indigo-800"
                                >
                                  {submission.problem_title || 'Bài tập'}
                                </Link>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full ${getSubmissionStatusColor(submission.status)}`}>
                                {getSubmissionStatusText(submission.status)}
                              </span>
                            </div>
                            <div className="flex items-center mt-1 text-xs text-gray-500 space-x-2">
                              <span>{submission.language}</span>
                              <span>•</span>
                              <span>{formatDate(submission.submitted_at)}</span>
                              <span>•</span>
                              <Link 
                                to={`/submissions/${submission.id}`}
                                className="text-indigo-600 hover:text-indigo-800"
                              >
                                Xem chi tiết
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AdminProfile;