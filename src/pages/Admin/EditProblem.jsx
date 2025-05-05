import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import LoadingSpinner from '../ProblemList/components/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const EditProblem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Form data state
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
  
  // Test cases state
  const [testCases, setTestCases] = useState([
    {
      input: '',
      expected_output: '',
      is_sample: true,
      order: 1
    }
  ]);
  
  // UI states
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check admin permission and load problem data
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Vui lòng đăng nhập để truy cập trang này');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        
        const userResponse = await axios.get(`${API_BASE_URL}/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (userResponse.data && userResponse.data.is_admin) {
          setIsAdmin(true);
          fetchProblemData(token);
        } else {
          setError('Bạn không có quyền truy cập trang này');
          setTimeout(() => navigate('/danh-sach-bai'), 2000);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        setError('Có lỗi xảy ra khi kiểm tra quyền truy cập');
        setTimeout(() => navigate('/login'), 2000);
      }
    };
    
    checkAdmin();
  }, [id, navigate]);
  
  // Fetch problem data
  const fetchProblemData = async (token) => {
    try {
      setLoading(true);
      
      const response = await axios.get(`${API_BASE_URL}/problems/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const problem = response.data;
      
      // Update form data
      setFormData({
        title: problem.title || '',
        description: problem.description || '',
        difficulty: problem.difficulty || 'easy',
        tags: problem.tags || [],
        example_input: problem.example_input || '',
        example_output: problem.example_output || '',
        constraints: problem.constraints || '',
        is_public: problem.is_public !== undefined ? problem.is_public : true,
        time_limit_ms: problem.time_limit_ms || 1000,
        memory_limit_kb: problem.memory_limit_kb || 262144
      });
      
      // Update test cases
      if (problem.test_cases && problem.test_cases.length > 0) {
        // Sort test cases by order
        const sortedTestCases = [...problem.test_cases].sort((a, b) => a.order - b.order);
        
        setTestCases(sortedTestCases.map(tc => ({
          id: tc.id, // Keep track of existing test case ID
          input: tc.input || '',
          expected_output: tc.expected_output || '',
          is_sample: tc.is_sample || false,
          order: tc.order || 0
        })));
      }
    } catch (err) {
      console.error('Error fetching problem data:', err);
      setError('Không thể tải thông tin bài tập');
    } finally {
      setLoading(false);
    }
  };
  
  // Sync example input/output with the first test case
  useEffect(() => {
    // Update the first test case when example input/output changes
    if (testCases.length > 0 && testCases[0].is_sample) {
      const updatedTestCases = [...testCases];
      updatedTestCases[0] = {
        ...updatedTestCases[0],
        input: formData.example_input,
        expected_output: formData.example_output
      };
      setTestCases(updatedTestCases);
    }
  }, [formData.example_input, formData.example_output]);
  
  // Form input handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
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
  
  // Tag handlers
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };
  
  const addTag = () => {
    if (tagInput.trim() !== '' && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };
  
  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };
  
  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  // Test case handlers
  const handleTestCaseChange = (index, field, value) => {
    const updatedTestCases = [...testCases];
    updatedTestCases[index] = {
      ...updatedTestCases[index],
      [field]: value
    };
    
    // If this is the first sample test case, update the example input/output
    if (index === 0 && updatedTestCases[0].is_sample) {
      if (field === 'input') {
        setFormData(prev => ({ ...prev, example_input: value }));
      } else if (field === 'expected_output') {
        setFormData(prev => ({ ...prev, example_output: value }));
      }
    }
    
    setTestCases(updatedTestCases);
  };
  
  const addTestCase = () => {
    setTestCases([
      ...testCases,
      {
        input: '',
        expected_output: '',
        is_sample: false,
        order: testCases.length + 1
      }
    ]);
  };
  
  const removeTestCase = (index) => {
    // Prevent removing the first sample test case
    if (index === 0 && testCases[0].is_sample) {
      return;
    }
    
    const updatedTestCases = testCases.filter((_, i) => i !== index);
    
    // Update order of remaining test cases
    for (let i = 0; i < updatedTestCases.length; i++) {
      updatedTestCases[i].order = i + 1;
    }
    
    setTestCases(updatedTestCases);
  };
  
  // Form validation
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Vui lòng nhập tiêu đề bài tập');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Vui lòng nhập mô tả bài tập');
      return false;
    }
    if (!formData.example_input.trim()) {
      setError('Vui lòng nhập ví dụ input');
      return false;
    }
    if (!formData.example_output.trim()) {
      setError('Vui lòng nhập ví dụ output');
      return false;
    }
    if (!formData.constraints.trim()) {
      setError('Vui lòng nhập ràng buộc');
      return false;
    }
    
    // Validate test cases
    if (testCases.length === 0) {
      setError('Vui lòng thêm ít nhất một test case');
      return false;
    }
    
    for (const testCase of testCases) {
      if (!testCase.input.trim() || !testCase.expected_output.trim()) {
        setError('Tất cả test cases phải có cả input và expected output');
        return false;
      }
    }
    
    return true;
  };
  
  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Vui lòng đăng nhập để cập nhật bài tập');
      }
      
      // Update problem
      await axios.put(
        `${API_BASE_URL}/problems/${id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Handle test cases
      // For existing test cases, update them; for new ones, create them
      for (const testCase of testCases) {
        const testCaseData = {
          input: testCase.input,
          expected_output: testCase.expected_output,
          is_sample: testCase.is_sample,
          order: testCase.order
        };
        
        if (testCase.id) {
          // Update existing test case
          await axios.put(
            `${API_BASE_URL}/problems/${id}/test-cases/${testCase.id}`,
            testCaseData,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
        } else {
          // Create new test case
          await axios.post(
            `${API_BASE_URL}/problems/${id}/test-cases`,
            testCaseData,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
        }
      }
      
      // Show success message
      setSuccess(true);
      
      // Navigate back to problem detail after 2 seconds
      setTimeout(() => {
        navigate(`/problems/${id}`);
      }, 2000);
    } catch (err) {
      console.error('Error updating problem:', err);
      setError(err.response?.data?.detail || err.message || 'Có lỗi xảy ra khi cập nhật bài tập.');
    } finally {
      setLoading(false);
    }
  };
  
  // Render test cases section
  const renderTestCasesSection = () => {
    return (
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Test Cases <span className="text-red-500">*</span>
        </h3>
        
        <div className="space-y-6">
          {testCases.map((testCase, index) => (
            <div key={index} className="p-6 border border-gray-300 rounded-lg bg-white shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium flex items-center">
                  {testCase.is_sample ? (
                    <span className="flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      Test Case Mẫu (Sample)
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                      Test Case #{index + 1}
                    </span>
                  )}
                </h4>
                
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => removeTestCase(index)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Input
                  </label>
                  <textarea
                    value={testCase.input}
                    onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                    rows={6}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                    placeholder="Nhập input cho test case"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Output
                  </label>
                  <textarea
                    value={testCase.expected_output}
                    onChange={(e) => handleTestCaseChange(index, 'expected_output', e.target.value)}
                    rows={6}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                    placeholder="Nhập output mong đợi"
                    required
                  />
                </div>
              </div>
              
              {!testCase.is_sample && (
                <div className="mt-4">
                  <div className="flex items-center">
                    <input
                      id={`is_sample_${index}`}
                      name={`is_sample_${index}`}
                      type="checkbox"
                      checked={testCase.is_sample}
                      onChange={(e) => handleTestCaseChange(index, 'is_sample', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`is_sample_${index}`} className="ml-2 block text-sm text-gray-700">
                      Hiển thị cho người dùng (sample test case)
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Nếu được chọn, test case này sẽ hiển thị cho người dùng trong trang bài tập.
                  </p>
                </div>
              )}
            </div>
          ))}
          
          <button
            type="button"
            onClick={addTestCase}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Thêm test case mới
          </button>
        </div>
      </div>
    );
  };
  
  // Loading, error and permission checking
  if (loading && !formData.title) {
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
          <div className="bg-gradient-to-r from-blue-500 to-blue-700 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Chỉnh Sửa Bài Tập</h1>
          </div>
          
          <div className="p-6">
            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
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
                    <p className="text-sm text-green-700">Bài tập đã được cập nhật thành công! Đang chuyển hướng...</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h2>
                
                {/* Title */}
                <div className="mb-4">
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
                <div className="mb-4">
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
                <div className="mb-4">
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
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                    {formData.tags.length === 0 && (
                      <span className="text-xs text-gray-500">Chưa có thẻ nào được thêm</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Examples and Constraints */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Ví dụ và ràng buộc</h2>
                
                {/* Example Input */}
                <div className="mb-4">
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
                <div className="mb-4">
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
              </div>
              
              {/* Settings */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Cài đặt</h2>
                
                {/* Time Limit */}
                <div className="mb-4">
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
                <div className="mb-4">
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
              </div>
              
              {/* Test Cases Section */}
              {renderTestCasesSection()}
              
              {/* Submit Button */}
              <div className="pt-5">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/quan-ly-bai-tap')}
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
                    ) : 'Cập nhật bài tập'}
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

export default EditProblem;