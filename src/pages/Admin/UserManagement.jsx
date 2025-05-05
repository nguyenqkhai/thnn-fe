import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Component cho spinner loading
const LoadingSpinner = () => (
  <div className="flex justify-center items-center">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
  </div>
);

// Component hiển thị thông báo lỗi
const ErrorMessage = ({ error }) => (
  <div className="bg-red-50 p-4 rounded-md border-l-4 border-red-500">
    <div className="flex">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-4.707-7.293a1 1 0 00-1.414 1.414L7.586 10l-3.293-3.293a1 1 0 111.414-1.414L9 8.586l3.293-3.293a1 1 0 111.414 1.414L10.414 10l3.293 3.293a1 1 0 01-1.414 1.414L9 11.414l-3.293 3.293a1 1 0 01-1.414-1.414L7.586 10 4.293 6.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium text-red-800">{error}</p>
      </div>
    </div>
  </div>
);

// Component hiển thị thông báo thành công
const SuccessMessage = ({ message }) => (
  <div className="bg-green-50 p-4 rounded-md border-l-4 border-green-500">
    <div className="flex">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium text-green-800">{message}</p>
      </div>
    </div>
  </div>
);

// Modal thêm/sửa người dùng
const UserFormModal = ({ showModal, onClose, onSubmit, formData, setFormData, title, submitText }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  if (!showModal) return null;

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-xl w-full" onClick={stopPropagation}>
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {title}
                </h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">Tên người dùng</label>
                    <input
                      type="text"
                      name="username"
                      id="username"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.username || ''}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.email || ''}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">Họ tên</label>
                    <input
                      type="text"
                      name="full_name"
                      id="full_name"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.full_name || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      {title === 'Thêm người dùng mới' ? 'Mật khẩu' : 'Mật khẩu mới (để trống nếu không thay đổi)'}
                    </label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.password || ''}
                      onChange={handleChange}
                      required={title === 'Thêm người dùng mới'}
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      id="is_active"
                      name="is_active"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={formData.is_active || false}
                      onChange={handleChange}
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                      Hoạt động
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="is_admin"
                      name="is_admin"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={formData.is_admin || false}
                      onChange={handleChange}
                    />
                    <label htmlFor="is_admin" className="ml-2 block text-sm text-gray-900">
                      Quản trị viên
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 flex flex-row-reverse">
            <button
              type="button"
              className="ml-3 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={onSubmit}
            >
              {submitText}
            </button>
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={onClose}
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal xác nhận xóa người dùng
const DeleteConfirmModal = ({ showModal, onClose, onConfirm, username }) => {
  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  if (!showModal) return null;

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full" onClick={stopPropagation}>
          <div className="px-4 pt-5 pb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Xác nhận xóa người dùng
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Bạn có chắc chắn muốn xóa người dùng <strong>{username}</strong> không? Hành động này không thể hoàn tác.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 flex flex-row-reverse">
            <button
              type="button"
              className="ml-3 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              onClick={onConfirm}
            >
              Xóa
            </button>
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={onClose}
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserManagement = () => {
  const navigate = useNavigate();
  
  // States
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    full_name: '',
    password: '',
    is_active: true,
    is_admin: false
  });

  // Xóa thông báo lỗi/thành công sau một khoảng thời gian
  useEffect(() => {
    let timer;
    if (error) {
      timer = setTimeout(() => setError(null), 5000);
    }
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    let timer;
    if (successMessage) {
      timer = setTimeout(() => setSuccessMessage(null), 5000);
    }
    return () => clearTimeout(timer);
  }, [successMessage]);

  // Hàm lấy token từ localStorage
  const getAuthToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Vui lòng đăng nhập để sử dụng tính năng này');
    }
    return token;
  };

  // Xử lý lỗi API
  const handleApiError = (err, defaultMessage) => {
    console.error('API Error:', err);
    
    if (err.response) {
      if (err.response.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
        setTimeout(() => navigate('/login', { state: { returnUrl: '/admin/users' } }), 2000);
      } else if (err.response.data && err.response.data.detail) {
        setError(`Lỗi: ${err.response.data.detail}`);
      } else {
        setError(defaultMessage);
      }
    } else if (err.request) {
      setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    } else {
      setError(defaultMessage);
    }
  };

  // Lấy thông tin người dùng hiện tại
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = getAuthToken();
        const response = await axios.get(`${API_BASE_URL}/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setCurrentUser(response.data);
        
        // Nếu không phải admin, chuyển hướng về trang chủ
        if (!response.data.is_admin) {
          setError('Bạn không có quyền truy cập vào trang này');
          setTimeout(() => navigate('/'), 2000);
        }
      } catch (err) {
        console.error('Lỗi khi lấy thông tin người dùng:', err);
        handleApiError(err, 'Không thể lấy thông tin người dùng');
      }
    };
    
    fetchCurrentUser();
  }, [navigate]);

  // Lấy danh sách người dùng
  const fetchUsers = async () => {
    if (!currentUser || !currentUser.is_admin) return;
    
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/users/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách người dùng:', err);
      handleApiError(err, 'Không thể lấy danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };
  
  // Gọi fetchUsers khi currentUser thay đổi
  useEffect(() => {
    if (currentUser && currentUser.is_admin) {
      fetchUsers();
    }
  }, [currentUser]);

  // Hàm xử lý thêm người dùng mới
  const handleAddUser = async () => {
    try {
      // Kiểm tra dữ liệu trước khi gửi
      if (!formData.username || !formData.email || !formData.password) {
        setError('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }
      
      const token = getAuthToken();
      
      // Gửi request thêm user
      const response = await axios({
        method: 'post',
        url: `${API_BASE_URL}/users/`,
        data: formData,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Cập nhật danh sách người dùng
      setUsers(prevUsers => [...prevUsers, response.data]);
      setSuccessMessage('Thêm người dùng mới thành công!');
      setShowAddModal(false);
      
      // Reset form data
      setFormData({
        email: '',
        username: '',
        full_name: '',
        password: '',
        is_active: true,
        is_admin: false
      });
      
      // Làm mới danh sách
      fetchUsers();
    } catch (err) {
      console.error('Lỗi khi thêm người dùng:', err);
      handleApiError(err, 'Có lỗi xảy ra khi thêm người dùng mới');
    }
  };

  // Hàm xử lý cập nhật người dùng
  const handleUpdateUser = async () => {
    try {
      if (!selectedUser || !selectedUser.id) {
        console.error('Không có người dùng được chọn để cập nhật');
        setError('Không thể cập nhật: Người dùng không hợp lệ');
        return;
      }
      
      console.log('Đang cập nhật người dùng:', selectedUser.id);
      console.log('Dữ liệu gửi đi:', formData);
      
      const token = getAuthToken();
      
      // Loại bỏ trường password nếu nó trống
      const dataToSend = { ...formData };
      if (!dataToSend.password) {
        delete dataToSend.password;
      }
      
      // Gửi request cập nhật
      const response = await axios({
        method: 'put',
        url: `${API_BASE_URL}/users/${selectedUser.id}`,
        data: dataToSend,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Phản hồi từ server:', response.data);

      // Cập nhật danh sách người dùng trong state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === selectedUser.id ? { ...user, ...response.data } : user
        )
      );
      
      setSuccessMessage('Cập nhật người dùng thành công!');
      setShowEditModal(false);
      
      // Làm mới danh sách để đảm bảo dữ liệu được cập nhật
      fetchUsers();
    } catch (err) {
      console.error('Lỗi khi cập nhật người dùng:', err);
      handleApiError(err, 'Có lỗi xảy ra khi cập nhật người dùng');
    }
  };

  // Hàm xử lý xóa người dùng
  const handleDeleteUser = async () => {
    if (!selectedUser || !selectedUser.id) return;
    
    try {
      const token = getAuthToken();
      
      await axios({
        method: 'delete',
        url: `${API_BASE_URL}/users/${selectedUser.id}`,
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Cập nhật danh sách người dùng
      setUsers(prevUsers => prevUsers.filter(user => user.id !== selectedUser.id));
      setSuccessMessage('Xóa người dùng thành công!');
      setShowDeleteModal(false);
      
      // Làm mới danh sách
      fetchUsers();
    } catch (err) {
      console.error('Lỗi khi xóa người dùng:', err);
      handleApiError(err, 'Có lỗi xảy ra khi xóa người dùng');
    }
  };

  // Hàm mở modal sửa và điền dữ liệu
  const openEditModal = (user) => {
    if (!user || !user.id) {
      console.error('Không thể mở modal sửa: Người dùng không hợp lệ');
      return;
    }
    
    console.log('Mở modal sửa cho user:', user);
    
    // Lưu người dùng được chọn vào state
    setSelectedUser({...user});
    
    // Đặt lại form data với thông tin người dùng
    setFormData({
      email: user.email || '',
      username: user.username || '',
      full_name: user.full_name || '',
      password: '', // Để trống vì không muốn đổi mật khẩu mặc định
      is_active: typeof user.is_active === 'boolean' ? user.is_active : true,
      is_admin: typeof user.is_admin === 'boolean' ? user.is_admin : false
    });
    
    // Hiển thị modal
    setShowEditModal(true);
  };

  // Hàm mở modal xóa
  const openDeleteModal = (user) => {
    if (!user || !user.id) return;
    setSelectedUser({...user});
    setShowDeleteModal(true);
  };

  // Hàm lọc người dùng theo từ khóa tìm kiếm
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Nếu đang tải
  if (loading && !currentUser) {
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

  // Nếu không phải admin
  if (currentUser && !currentUser.is_admin) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="container mx-auto px-4 py-8 flex-grow">
          <div className="bg-red-50 p-4 rounded-md border-l-4 border-red-500">
            <p className="text-red-700">Bạn không có quyền truy cập vào trang này.</p>
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
        <div className="max-w-7xl mx-auto">
          {/* Tiêu đề */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
            <p className="mt-1 text-sm text-gray-500">
              Quản lý tất cả người dùng trong hệ thống
            </p>
          </div>
          
          {/* Thông báo lỗi và thành công */}
          {error && (
            <div className="mb-4">
              <ErrorMessage error={error} />
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4">
              <SuccessMessage message={successMessage} />
            </div>
          )}
          
          {/* Phần tìm kiếm và nút thêm mới */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
            <div className="w-full md:w-1/3">
              <label htmlFor="search" className="sr-only">Tìm kiếm</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Tìm kiếm người dùng..."
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => {
                setFormData({
                  email: '',
                  username: '',
                  full_name: '',
                  password: '',
                  is_active: true,
                  is_admin: false
                });
                setShowAddModal(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Thêm người dùng mới
            </button>
          </div>
          
          {/* Bảng người dùng */}
          <div className="overflow-x-auto bg-white shadow rounded-lg">
            {loading ? (
              <div className="py-10 flex justify-center">
                <LoadingSpinner />
              </div>
            ) : filteredUsers.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên người dùng
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Họ tên
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vai trò
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.full_name || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Hoạt động' : 'Bị khóa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.is_admin 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.is_admin ? 'Quản trị viên' : 'Người dùng'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => openDeleteModal(user)}
                            className="text-red-600 hover:text-red-900"
                            disabled={user.id === currentUser?.id}
                          >
                            {user.id === currentUser?.id ? 'Không thể xóa' : 'Xóa'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-10 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy người dùng nào</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm 
                    ? 'Không có người dùng nào phù hợp với từ khóa tìm kiếm.' 
                    : 'Bắt đầu bằng cách thêm người dùng mới.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal thêm người dùng */}
      <UserFormModal
        showModal={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddUser}
        formData={formData}
        setFormData={setFormData}
        title="Thêm người dùng mới"
        submitText="Thêm"
      />

      {/* Modal sửa người dùng */}
      <UserFormModal
        showModal={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdateUser}
        formData={formData}
        setFormData={setFormData}
        title="Sửa thông tin người dùng"
        submitText="Cập nhật"
      />

      {/* Modal xóa người dùng */}
      <DeleteConfirmModal
        showModal={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteUser}
        username={selectedUser?.username}
      />

      <Footer />
    </div>
  );
};

export default UserManagement;