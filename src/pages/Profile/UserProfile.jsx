import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import LoadingSpinner from '../ProblemList/components/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const UserProfile = () => {
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
  
  // Solved problems states
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [loadingSolved, setLoadingSolved] = useState(true);
  
  // Stats states
  const [userStats, setUserStats] = useState({
    totalSubmissions: 0,
    acceptedSubmissions: 0,
    totalProblems: 0,
    solvedProblems: 0
  });
  
  // Get auth token
  const getAuthToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Vui lòng đăng nhập để xem trang cá nhân');
    }
    return token;
  };
  
  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        
        const response = await axios.get(`${API_BASE_URL}/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setUserData(response.data);
        
        // Initialize form data
        setFormData({
          full_name: response.data.full_name || '',
          email: response.data.email || '',
          bio: response.data.bio || ''
        });
        
        // Fetch solved problems
        await fetchSolvedProblems();
        
        // Fetch user stats
        await fetchUserStats();
        
      } catch (err) {
        console.error('Error fetching user data:', err);
        
        if (err.message === 'Vui lòng đăng nhập để xem trang cá nhân' || 
            (err.response && err.response.status === 401)) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError('Không thể tải thông tin cá nhân. Vui lòng thử lại sau.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [navigate]);
  
  // Fetch solved problems
  const fetchSolvedProblems = async () => {
    try {
      setLoadingSolved(true);
      const token = getAuthToken();
      
      const response = await axios.get(`${API_BASE_URL}/submissions/solved-problems`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Get solved problem details
      if (response.data && response.data.solved_problems) {
        const solvedIds = response.data.solved_problems;
        
        if (solvedIds.length > 0) {
          // Fetch problem details for each solved problem
          const problemsResponse = await axios.get(`${API_BASE_URL}/problems`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          const allProblems = problemsResponse.data;
          const solvedProblemsWithDetails = allProblems.filter(
            problem => solvedIds.includes(problem.id)
          );
          
          setSolvedProblems(solvedProblemsWithDetails);
        }
      }
      
    } catch (err) {
      console.error('Error fetching solved problems:', err);
    } finally {
      setLoadingSolved(false);
    }
  };
  
  // Fetch user stats
  const fetchUserStats = async () => {
    try {
      const token = getAuthToken();
      
      // Get all submissions
      const submissionsResponse = await axios.get(`${API_BASE_URL}/submissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const submissions = submissionsResponse.data;
      
      // Calculate stats
      const totalSubmissions = submissions.length;
      const acceptedSubmissions = submissions.filter(sub => sub.status === 'accepted').length;
      
      // Get solved problem count
      const solvedProblemIds = new Set();
      for (const sub of submissions) {
        if (sub.status === 'accepted') {
          solvedProblemIds.add(sub.problem_id);
        }
      }
      
      // Get total problem count
      const problemsResponse = await axios.get(`${API_BASE_URL}/problems`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const totalProblems = problemsResponse.data.length;
      
      setUserStats({
        totalSubmissions,
        acceptedSubmissions,
        totalProblems,
        solvedProblems: solvedProblemIds.size
      });
      
    } catch (err) {
      console.error('Error fetching user stats:', err);
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
      day: '2-digit'
    }).format(date);
  };
  
  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
      default: return 'text-gray-600';
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
            <p className="text-yellow-700">Không tìm thấy thông tin người dùng.</p>
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
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <h1 className="text-2xl font-bold text-white">Thông Tin Cá Nhân</h1>
            </div>
            
            <div className="p-6">
              {/* Profile Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left column - Avatar and basic info */}
                <div className="space-y-4">
                  {/* Avatar */}
                  <div className="flex flex-col items-center">
                    <div className="h-32 w-32 rounded-full bg-blue-600 text-white flex items-center justify-center text-5xl font-medium mb-2">
                      {userData.username ? userData.username.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <h2 className="text-xl font-semibold">{userData.username}</h2>
                    <p className="text-sm text-gray-500">{userData.is_admin ? 'Administrator' : 'Thành viên'}</p>
                    
                    {/* Joined date */}
                    <p className="text-xs text-gray-500 mt-1">
                      Tham gia: {formatDate(userData.created_at)}
                    </p>
                  </div>
                  
                  {/* Stats */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-md font-semibold text-blue-800 mb-2">Thống kê</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tổng số bài nộp:</span>
                        <span className="font-medium">{userStats.totalSubmissions}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Số bài nộp đúng:</span>
                        <span className="font-medium text-green-600">{userStats.acceptedSubmissions}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tỷ lệ đúng:</span>
                        <span className="font-medium">
                          {userStats.totalSubmissions > 0 
                            ? `${Math.round((userStats.acceptedSubmissions / userStats.totalSubmissions) * 100)}%` 
                            : '0%'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Bài tập đã giải:</span>
                        <span className="font-medium">
                          {userStats.solvedProblems}/{userStats.totalProblems}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={toggleEditMode}
                      className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-200"
                    >
                      {editMode ? 'Hủy Chỉnh Sửa' : 'Chỉnh Sửa Thông Tin'}
                    </button>
                    
                    <button
                      onClick={() => setShowPasswordForm(!showPasswordForm)}
                      className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition duration-200"
                    >
                      {showPasswordForm ? 'Hủy Đổi Mật Khẩu' : 'Đổi Mật Khẩu'}
                    </button>
                  </div>
                </div>
                
                {/* Right column - Profile details */}
                <div className="md:col-span-2">
                  {/* Profile editor */}
                  {editMode ? (
                    <div className="bg-blue-50 p-6 rounded-lg mb-6">
                      <h3 className="text-lg font-semibold text-blue-800 mb-4">Chỉnh sửa thông tin</h3>
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            rows="4"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          ></textarea>
                        </div>
                        
                        <div className="flex justify-end">
                          <button
                            onClick={handleUpdateProfile}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition duration-200"
                          >
                            Lưu Thay Đổi
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-6 rounded-lg mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin chi tiết</h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Họ tên</h4>
                          <p className="text-gray-800">{userData.full_name || '(Chưa cập nhật)'}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Email</h4>
                          <p className="text-gray-800">{userData.email}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Giới thiệu</h4>
                          <p className="text-gray-800 whitespace-pre-line">
                            {userData.bio || '(Chưa cập nhật)'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Password change form */}
                  {showPasswordForm && (
                    <div className="bg-gray-50 p-6 rounded-lg mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Đổi mật khẩu</h3>
                      
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition duration-200"
                          >
                            Cập Nhật Mật Khẩu
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                  
                  {/* Solved problems */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Bài tập đã giải ({solvedProblems.length})
                    </h3>
                    
                    {loadingSolved ? (
                      <div className="py-8 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    ) : solvedProblems.length === 0 ? (
                      <div className="py-8 text-center text-gray-500">
                        <p>Bạn chưa giải được bài tập nào</p>
                        <button
                          onClick={() => navigate('/danh-sach-bai')}
                          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-200"
                        >
                          Giải bài tập ngay
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {solvedProblems.map((problem) => (
                          <div key={problem.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100">
                            <div>
                              <a 
                                href={`/problems/${problem.id}`}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {problem.title}
                              </a>
                              <p className={`text-xs ${getDifficultyColor(problem.difficulty)}`}>
                                {problem.difficulty === 'easy' ? 'Dễ' : 
                                 problem.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                              </p>
                            </div>
                            <a 
                              href={`/problems/${problem.id}`}
                              className="px-3 py-1 text-sm text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                            >
                              Xem lại
                            </a>
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

export default UserProfile;