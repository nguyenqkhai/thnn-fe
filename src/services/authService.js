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
        
        // Lấy thông tin người dùng và lưu vào localStorage
        await this.storeUserInfo();
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

  // Lấy thông tin người dùng và lưu vào localStorage
  async storeUserInfo() {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/users/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Lưu thông tin người dùng vào localStorage
      localStorage.setItem('user_info', JSON.stringify(response.data));
      
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng');
      throw new Error('Không thể lấy thông tin người dùng');
    }
  },

  // Lấy username của người dùng hiện tại
  getUsername() {
    const userInfo = this.getUserInfo();
    return userInfo ? userInfo.username : null;
  },

  // Lấy thông tin người dùng từ localStorage
  getUserInfo() {
    const userInfo = localStorage.getItem('user_info');
    return userInfo ? JSON.parse(userInfo) : null;
  },

  // Kiểm tra xem người dùng có phải là admin không
  isAdmin() {
    const userInfo = this.getUserInfo();
    return userInfo ? userInfo.is_admin : false;
  },

  // Đăng xuất
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user_info');
  },
  
  // Kiểm tra đã đăng nhập chưa
  isAuthenticated() {
    // Kiểm tra xem có token trong localStorage hay không
    const token = localStorage.getItem('token');
    
    // Nếu không có token, người dùng chưa đăng nhập
    if (!token) {
      return false;
    }
    
    // Kiểm tra có thông tin người dùng không
    const userInfo = this.getUserInfo();
    
    // Nếu có token nhưng không có thông tin người dùng, thử lấy thông tin người dùng
    if (!userInfo) {
      try {
        // Cố gắng lấy thông tin người dùng một cách bất đồng bộ
        // Điều này có thể không hoạt động tốt trong một hàm đồng bộ
        // nên chúng ta sẽ trả về true và để lần gọi API tiếp theo xác thực token
        this.storeUserInfo().catch(() => {
          // Nếu có lỗi, xóa token
          this.logout();
        });
        return true;
      } catch (error) {
        this.logout();
        return false;
      }
    }
    
    // Nếu có token và thông tin người dùng, coi như đã đăng nhập
    return true;
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