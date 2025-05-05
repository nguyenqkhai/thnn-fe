import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const PasswordForm = ({ onClose, className = '' }) => {
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Get auth token
  const getAuthToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Vui lòng đăng nhập để thực hiện thao tác này');
    }
    return token;
  };
  
  // Handle input change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submit
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    setPasswordError(null);
    setPasswordSuccess(null);
    setLoading(true);
    
    // Validate passwords
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('Mật khẩu mới không khớp với mật khẩu xác nhận');
      setLoading(false);
      return;
    }
    
    if (passwordData.new_password.length < 8) {
      setPasswordError('Mật khẩu mới phải có ít nhất 8 ký tự');
      setLoading(false);
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
      
      // Close form after 2 seconds
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 2000);
      
    } catch (err) {
      console.error('Error updating password:', err);
      setPasswordError('Không thể cập nhật mật khẩu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
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
        
        <div className="flex justify-end space-x-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition duration-200"
            >
              Hủy
            </button>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 ${
              loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            } text-white font-medium rounded-md transition duration-200`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang cập nhật...
              </span>
            ) : 'Cập nhật mật khẩu'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PasswordForm;