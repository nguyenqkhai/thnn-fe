import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import LoadingSpinner from '../ProblemList/components/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const AddProblem = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'easy',
    tags: [],
    example_input: '',
    example_output: '',
    constraints: '',
    is_public: true,
    time_limit_ms: 1000,
    memory_limit_kb: 262144
  });
  
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Kiểm tra xem người dùng có phải là admin không
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Vui lòng đăng nhập để truy cập trang này');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
          return;
        }
        
        const response = await axios.get(`${API_BASE_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data && response.data.is_admin) {
          setIsAdmin(true);
        } else {
          setError('Bạn không có quyền truy cập trang này');
          setTimeout(() => {
            navigate('/danh-sach-bai');
          }, 2000);
        }
      } catch (err) {
        setError('Có lỗi xảy ra khi kiểm tra quyền truy cập');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    };
    
    checkAdminStatus();
  }, [navigate]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle number inputs with validation
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
    }
  };
  
  // Handle tag input
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };
  
  // Add a tag
  const addTag = () => {
    if (tagInput.trim() !== '' && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };
  
  // Handle tag input on keypress
  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };
  
  // Remove a tag
  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  // Handle submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validate form
      if (!formData.title.trim()) {
        throw new Error('Vui lòng nhập tiêu đề bài tập');
      }
      if (!formData.description.trim()) {
        throw new Error('Vui lòng nhập mô tả bài tập');
      }
      if (!formData.example_input.trim()) {
        throw new Error('Vui lòng nhập ví dụ input');
      }
      if (!formData.example_output.trim()) {
        throw new Error('Vui lòng nhập ví dụ output');
      }
      if (!formData.constraints.trim()) {
        throw new Error('Vui lòng nhập ràng buộc');
      }
      
      // Get token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Vui lòng đăng nhập để thêm bài tập');
      }
      
      // Send request
      const response = await axios.post(
        `${API_BASE_URL}/problems/`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Handle success
      setSuccess(true);
      
      // Navigate to problem detail after 2 seconds
      setTimeout(() => {
        navigate(`/problems/${response.data.id}`);
      }, 2000);
      
    } catch (err) {
      console.error('Lỗi khi thêm bài tập:', err);
      setError(err.response?.data?.detail || err.message || 'Có lỗi xảy ra khi thêm bài tập.');
    } finally {
      setLoading(false);
    }
  };
  
  // Nếu đang kiểm tra quyền admin, hiển thị loading
  if (loading && !isAdmin) {
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
  
  // Nếu không phải admin, thông báo lỗi sẽ được hiển thị
  if (!isAdmin && error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="max-w-md p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-red-600 mb-4">Không có quyền truy cập</h2>
            <p className="text-gray-700">{error}</p>
            <p className="text-gray-700 mt-2">Bạn sẽ được chuyển hướng sau vài giây...</p>
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
        <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Thêm Bài Tập Mới</h1>
          </div>
          
          <div className="p-6">
            {/* Error Message */}
            {error && <ErrorMessage error={error} />}
            
            {/* Success Message */}
            {success && (
              <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">Bài tập đã được thêm thành công! Đang chuyển hướng...</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Tiêu đề bài tập <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              
              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Mô tả bài tập <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Có thể sử dụng markdown để định dạng văn bản
                </p>
              </div>
              
              {/* Difficulty */}
              <div>
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
                  Độ khó <span className="text-red-500">*</span>
                </label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
              </div>
              
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Thẻ đánh dấu
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={handleTagInputChange}
                    onKeyPress={handleTagKeyPress}
                    placeholder="Nhập thẻ và nhấn Enter hoặc Thêm"
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 sm:text-sm hover:bg-gray-100"
                  >
                    Thêm
                  </button>
                </div>
                
                {/* Display tags */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-blue-500 hover:text-blue-800 focus:outline-none"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Example Input */}
              <div>
                <label htmlFor="example_input" className="block text-sm font-medium text-gray-700">
                  Ví dụ Input <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="example_input"
                  name="example_input"
                  value={formData.example_input}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                  required
                />
              </div>
              
              {/* Example Output */}
              <div>
                <label htmlFor="example_output" className="block text-sm font-medium text-gray-700">
                  Ví dụ Output <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="example_output"
                  name="example_output"
                  value={formData.example_output}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                  required
                />
              </div>
              
              {/* Constraints */}
              <div>
                <label htmlFor="constraints" className="block text-sm font-medium text-gray-700">
                  Ràng buộc <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="constraints"
                  name="constraints"
                  value={formData.constraints}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Các ràng buộc về input và output, giới hạn...
                </p>
              </div>
              
              {/* Time Limit */}
              <div>
                <label htmlFor="time_limit_ms" className="block text-sm font-medium text-gray-700">
                  Giới hạn thời gian (ms)
                </label>
                <input
                  type="number"
                  id="time_limit_ms"
                  name="time_limit_ms"
                  value={formData.time_limit_ms}
                  onChange={handleNumberChange}
                  min="100"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              {/* Memory Limit */}
              <div>
                <label htmlFor="memory_limit_kb" className="block text-sm font-medium text-gray-700">
                  Giới hạn bộ nhớ (KB)
                </label>
                <input
                  type="number"
                  id="memory_limit_kb"
                  name="memory_limit_kb"
                  value={formData.memory_limit_kb}
                  onChange={handleNumberChange}
                  min="1024"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              {/* Is Public */}
              <div className="flex items-center">
                <input
                  id="is_public"
                  name="is_public"
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700">
                  Công khai bài tập
                </label>
              </div>
              
              {/* Submit Button */}
              <div className="pt-5">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('/danh-sach-bai')}
                    className="mr-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                      loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang xử lý...
                      </>
                    ) : 'Thêm bài tập'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AddProblem;