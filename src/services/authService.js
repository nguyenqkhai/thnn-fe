import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1/auth';

// Tạo instance axios với config mặc định
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
});

// Helper để chuyển đổi dữ liệu thành form data
const createFormData = (data) => {
  const formData = new URLSearchParams();
  for (const key in data) {
    formData.append(key, data[key]);
  }
  return formData;
};

const authService = {
  // Đăng nhập
  async login(username, password) {
    try {
      const formData = createFormData({ username, password });
      const response = await apiClient.post('/login', formData);
      
      if (response.data.access_token) {
        // Lưu token vào localStorage
        localStorage.setItem('token', response.data.access_token);
      }
      
      return response.data;
    } catch (error) {
      // Xử lý lỗi và ném ra để component xử lý
      throw this.handleError(error);
    }
  },
  
  // Đăng ký
  async register(userData) {
    try {
      const formData = createFormData(userData);
      const response = await apiClient.post('/register', formData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Lấy thông tin người dùng
  async getUserInfo() {
    try {
      const response = await axios.get(`${API_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng');
      throw new Error('Không thể lấy thông tin người dùng');
    }
  },

  // Lấy username của người dùng hiện tại
  async getUsername() {
    try {
      const userInfo = await this.getUserInfo();
      return userInfo.username;
    } catch (error) {
      console.error('Lỗi khi lấy username');
      return null;
    }
  },

  // Đăng xuất
  logout() {
    localStorage.removeItem('token');
  },
  
  // Kiểm tra đã đăng nhập chưa
  isAuthenticated() {
    return localStorage.getItem('token') ? true : false;
  },
  
  // Xử lý lỗi từ API
  handleError(error) {
    if (error.response) {
      // Trả về message lỗi từ API nếu có
      return new Error(error.response.data.detail || 'Đã xảy ra lỗi');
    }
    return new Error('Không thể kết nối đến server');
  }
};

export default authService;