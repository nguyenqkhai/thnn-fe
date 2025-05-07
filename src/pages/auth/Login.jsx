import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import InputField from '../../components/ui/InputField';
import Button from '../../components/ui/Button';
import ErrorMessage from '../../components/ui/ErrorMessage';
import authService from '../../services/authService';

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!credentials.username.trim()) {
      setError('Vui lòng nhập tên đăng nhập');
      return false;
    }
    
    if (!credentials.password.trim()) {
      setError('Vui lòng nhập mật khẩu');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setError('');
      
      await authService.login(credentials.username, credentials.password);
      navigate('/danh-sach-bai');
    } catch (err) {
      console.error('Login error:', err);
      
      // Hiển thị thông báo lỗi từ authService
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      
      // Nếu là lỗi sai mật khẩu, đặt focus vào ô mật khẩu
      if (err.message === 'Tên đăng nhập hoặc mật khẩu không đúng') {
        // Highlight mật khẩu input
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
          setTimeout(() => {
            passwordInput.focus();
            passwordInput.select();
          }, 100);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Đăng nhập"
      subtitle="Hoặc"
      subtitleLinkText="đăng ký tài khoản mới"
      subtitleLinkTo="/register"
    >
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Chào mừng trở lại</h2>
          <p className="text-gray-500 text-sm">Đăng nhập để tiếp tục với tài khoản của bạn</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <ErrorMessage 
              message={error} 
              className={error === 'Tên đăng nhập hoặc mật khẩu không đúng' ? 'bg-red-50 border-red-500' : ''}
            />
          )}

          <InputField
            id="username"
            name="username"
            type="text"
            label="Tên đăng nhập"
            value={credentials.username}
            onChange={handleChange}
            required
            placeholder="Nhập tên đăng nhập"
            autoComplete="username"
            className={`focus:ring-blue-500 focus:border-blue-500 rounded-lg ${
              error === 'Tên đăng nhập hoặc mật khẩu không đúng' ? 'border-red-300' : ''
            }`}
          />

          <InputField
            id="password"
            name="password"
            type="password"
            label="Mật khẩu"
            value={credentials.password}
            onChange={handleChange}
            required
            placeholder="Nhập mật khẩu"
            autoComplete="current-password"
            className={`focus:ring-blue-500 focus:border-blue-500 rounded-lg ${
              error === 'Tên đăng nhập hoặc mật khẩu không đúng' ? 'border-red-300' : ''
            }`}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Ghi nhớ đăng nhập
              </label>
            </div>

            <a href="/quen-mat-khau" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Quên mật khẩu?
            </a>
          </div>

          <Button
            type="submit"
            fullWidth
            isLoading={loading}
            disabled={loading}
            className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>

          <div className="text-center text-sm text-gray-500 mt-4">
            Chưa có tài khoản?{' '}
            <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Đăng ký ngay
            </a>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Login;