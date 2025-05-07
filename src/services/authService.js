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
        return response.data;
      }
      
      throw new Error('Đăng nhập thất bại');
    } catch (error) {
      console.error('Login error:', error);
      
      // Xử lý lỗi cụ thể
      if (error.response) {
        if (error.response.status === 400) {
          // Kiểm tra thông báo lỗi từ backend
          if (error.response.data?.detail === "Incorrect username or password") {
            throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
          } else if (error.response.data?.detail === "Inactive user") {
            throw new Error('Tài khoản đã bị vô hiệu hóa');
          } else if (error.response.data?.detail) {
            throw new Error(error.response.data.detail);
          }
        } else if (error.response.status === 401) {
          throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
        } 
      }
      
      // Xử lý lỗi và ném ra để component xử lý
      throw this.handleError(error);
    }
  },
  
  // Đăng ký
  async register(userData) {
    try {
      // Xác thực dữ liệu trước khi gửi
      if (!userData.username || !userData.email || !userData.password || !userData.full_name) {
        throw new Error('Vui lòng điền đầy đủ thông tin');
      }
      
      // Đối với endpoint này, cần gửi dữ liệu dưới dạng JSON
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      // Gửi request đăng ký với dữ liệu JSON
      const response = await axios.post(`${API_URL}/register`, userData, config);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      
      // Xử lý lỗi cụ thể cho đăng ký
      if (error.response) {
        // Lỗi 400 - Bad Request (username hoặc email đã tồn tại)
        if (error.response.status === 400 && error.response.data?.detail) {
          throw new Error(error.response.data.detail);
        } 
        // Lỗi 422 - Validation Error
        else if (error.response.status === 422) {
          const validationErrors = error.response.data?.detail || [];
          if (Array.isArray(validationErrors) && validationErrors.length > 0) {
            const firstError = validationErrors[0];
            throw new Error(`${firstError.loc[1]}: ${firstError.msg}`);
          }
          throw new Error('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
        }
      }
      
      throw this.handleError(error);
    }
  },

  // Lấy thông tin người dùng và lưu vào localStorage
  async storeUserInfo() {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Không tìm thấy token');
      }
      
      const response = await axios.get('http://localhost:8000/api/v1/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Lưu thông tin người dùng vào localStorage
      localStorage.setItem('user_info', JSON.stringify(response.data));
      
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng:', error);
      
      // Nếu token hết hạn hoặc không hợp lệ
      if (error.response && error.response.status === 401) {
        this.logout();
      }
      
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
    // Chuyển hướng đến trang đăng nhập
    window.location.href = '/login';
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
      // Trường hợp lỗi 401 - Unauthorized
      if (error.response.status === 401) {
        this.logout();
        return new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      
      // Trường hợp lỗi 403 - Forbidden
      if (error.response.status === 403) {
        return new Error('Bạn không có quyền thực hiện hành động này');
      }
      
      // Trường hợp lỗi 404 - Not Found
      if (error.response.status === 404) {
        return new Error('Không tìm thấy tài nguyên yêu cầu');
      }
      
      // Trường hợp lỗi 422 - Validation Error
      if (error.response.status === 422) {
        const validationErrors = error.response.data?.detail || [];
        if (Array.isArray(validationErrors) && validationErrors.length > 0) {
          const firstError = validationErrors[0];
          return new Error(`${firstError.loc[1]}: ${firstError.msg}`);
        }
        return new Error('Dữ liệu không hợp lệ');
      }
      
      // Trả về message lỗi từ API nếu có
      if (error.response.data?.detail) {
        return new Error(error.response.data.detail);
      }
      
      // Trường hợp lỗi khác
      return new Error(`Lỗi ${error.response.status}: ${error.response.statusText || 'Đã xảy ra lỗi'}`);
    }
    
    // Lỗi kết nối
    if (error.request) {
      return new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet.');
    }
    
    // Lỗi khác
    return new Error(error.message || 'Đã xảy ra lỗi không xác định');
  }
};

export default authService;