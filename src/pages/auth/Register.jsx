import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import InputField from '../../components/ui/InputField';
import Button from '../../components/ui/Button';
import ErrorMessage from '../../components/ui/ErrorMessage';
import authService from '../../services/authService';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Vui lòng nhập tên đăng nhập');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('Vui lòng nhập email');
      return false;
    }
    
    if (!formData.full_name.trim()) {
      setError('Vui lòng nhập họ tên');
      return false;
    }
    
    if (!formData.password.trim()) {
      setError('Vui lòng nhập mật khẩu');
      return false;
    }
    
    if (formData.password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
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
      
      // Loại bỏ trường confirmPassword trước khi gửi
      const { confirmPassword, ...userData } = formData;
      
      await authService.register(userData);
      setSuccessMessage('Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.');
      
      // Chuyển hướng đến trang đăng nhập sau 2 giây
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Đăng ký tài khoản"
      subtitle="Đã có tài khoản?"
      subtitleLinkText="Đăng nhập"
      subtitleLinkTo="/login"
      imageSrc="https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <ErrorMessage message={error} />
        
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
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

        <InputField
          id="username"
          name="username"
          type="text"
          label="Tên đăng nhập"
          value={formData.username}
          onChange={handleChange}
          required
          placeholder="Nhập tên đăng nhập của bạn"
          autoComplete="username"
        />

        <InputField
          id="email"
          name="email"
          type="email"
          label="Email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="email@example.com"
          autoComplete="email"
        />

        <InputField
          id="full_name"
          name="full_name"
          type="text"
          label="Họ tên"
          value={formData.full_name}
          onChange={handleChange}
          required
          placeholder="Nhập họ tên đầy đủ của bạn"
          autoComplete="name"
        />

        <InputField
          id="password"
          name="password"
          type="password"
          label="Mật khẩu"
          value={formData.password}
          onChange={handleChange}
          required
          placeholder="Tối thiểu 8 ký tự"
          autoComplete="new-password"
        />

        <InputField
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Xác nhận mật khẩu"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          placeholder="Nhập lại mật khẩu"
          autoComplete="new-password"
        />

        <div className="flex items-center">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            required
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
            Tôi đồng ý với <a href="#" className="text-indigo-600 hover:text-indigo-500">điều khoản sử dụng</a> và <a href="#" className="text-indigo-600 hover:text-indigo-500">chính sách bảo mật</a>
          </label>
        </div>

        <div>
          <Button
            type="submit"
            fullWidth
            isLoading={loading}
            disabled={loading}
          >
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Register;