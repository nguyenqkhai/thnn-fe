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
      setError(err.message);
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
      <form onSubmit={handleSubmit} className="space-y-6">
        <ErrorMessage message={error} />

        <InputField
          id="username"
          name="username"
          type="text"
          label="Tên đăng nhập"
          value={credentials.username}
          onChange={handleChange}
          required
          placeholder="Nhập tên đăng nhập của bạn"
          autoComplete="username"
        />

        <InputField
          id="password"
          name="password"
          type="password"
          label="Mật khẩu"
          value={credentials.password}
          onChange={handleChange}
          required
          placeholder="Nhập mật khẩu của bạn"
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Ghi nhớ đăng nhập
            </label>
          </div>

          <div className="text-sm">
            <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
              Quên mật khẩu?
            </a>
          </div>
        </div>

        <div>
          <Button
            type="submit"
            fullWidth
            isLoading={loading}
            disabled={loading}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;