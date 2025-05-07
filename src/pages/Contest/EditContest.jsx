import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import authService from '../../services/authService';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const EditContest = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    is_public: true,
    requires_approval: false
  });
  
  // Problems state
  const [availableProblems, setAvailableProblems] = useState([]);
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [problemsLoading, setProblemsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Check if user is admin
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (!authService.isAdmin()) {
      navigate('/danh-sach-bai');
    }
  }, [navigate]);
  
  // Fetch contest data
  useEffect(() => {
    const fetchContestData = async () => {
      try {
        setInitialLoading(true);
        const token = localStorage.getItem('token');
        
        // Fetch contest details
        const contestResponse = await axios.get(`${API_BASE_URL}/contests/${contestId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const contestData = contestResponse.data;
        
        // Format datetime for input
        const formatDateTimeForInput = (dateTimeStr) => {
          if (!dateTimeStr) return '';
          const date = new Date(dateTimeStr);
          return date.toISOString().slice(0, 16);
        };
        
        // Update form data
        setFormData({
          title: contestData.title || '',
          description: contestData.description || '',
          start_time: formatDateTimeForInput(contestData.start_time),
          end_time: formatDateTimeForInput(contestData.end_time),
          is_public: contestData.is_public !== undefined ? contestData.is_public : true,
          requires_approval: contestData.requires_approval !== undefined ? contestData.requires_approval : false
        });
        
        // Process contest problems
        if (contestData.problems && Array.isArray(contestData.problems)) {
          const sortedProblems = [...contestData.problems].sort((a, b) => a.order - b.order);
          
          const formattedProblems = sortedProblems.map(problem => ({
            id: problem.problem_id,
            problem_id: problem.problem_id,
            title: problem.problem ? problem.problem.title : 'Không tìm thấy bài tập',
            difficulty: problem.problem ? problem.problem.difficulty : 'easy',
            order: problem.order || 0,
            points: problem.points || 100,
            contest_problem_id: problem.id // For updating existing problems
          }));
          
          setSelectedProblems(formattedProblems);
        }
        
      } catch (err) {
        console.error('Lỗi khi tải thông tin cuộc thi:', err);
        setError('Không thể tải thông tin cuộc thi. Vui lòng thử lại sau.');
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchContestData();
  }, [contestId]);
  
  // Fetch available problems
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setProblemsLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await axios.get(`${API_BASE_URL}/problems/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Filter out problems that are already selected
        const selectedProblemIds = selectedProblems.map(p => p.id);
        const availableProbs = response.data.filter(problem => 
          !selectedProblemIds.includes(problem.id)
        );
        
        setAvailableProblems(availableProbs);
      } catch (err) {
        console.error('Lỗi khi tải danh sách bài tập:', err);
        setError('Không thể tải danh sách bài tập. Vui lòng thử lại sau.');
      } finally {
        setProblemsLoading(false);
        setLoading(false);
      }
    };
    
    if (!initialLoading) {
      fetchProblems();
    }
  }, [initialLoading, selectedProblems]);
  
  // Handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleProblemSelect = (problem) => {
    if (selectedProblems.some(p => p.id === problem.id)) return;
    
    setSelectedProblems(prev => [
      ...prev,
      {
        ...problem,
        order: prev.length + 1,
        points: 100
      }
    ]);
  };
  
  const handleRemoveProblem = (problemId) => {
    setSelectedProblems(prev => {
      const filtered = prev.filter(p => p.id !== problemId);
      return filtered.map((p, idx) => ({
        ...p,
        order: idx + 1
      }));
    });
  };
  
  const handleOrderChange = (problemId, newOrder) => {
    const numericOrder = parseInt(newOrder);
    if (isNaN(numericOrder)) return;
    
    setSelectedProblems(prev => {
      const updated = prev.map(p => 
        p.id === problemId ? { ...p, order: Math.max(1, numericOrder) } : p
      );
      return updated.sort((a, b) => a.order - b.order);
    });
  };
  
  const handlePointsChange = (problemId, newPoints) => {
    const numericPoints = parseInt(newPoints);
    if (isNaN(numericPoints)) return;
    
    setSelectedProblems(prev => 
      prev.map(p => 
        p.id === problemId ? { ...p, points: Math.max(0, numericPoints) } : p
      )
    );
  };
  
  const moveProblemUp = (problemId) => {
    setSelectedProblems(prev => {
      const index = prev.findIndex(p => p.id === problemId);
      if (index <= 0) return prev;
      
      const newProblems = [...prev];
      [newProblems[index].order, newProblems[index-1].order] = [newProblems[index-1].order, newProblems[index].order];
      [newProblems[index], newProblems[index-1]] = [newProblems[index-1], newProblems[index]];
      return newProblems;
    });
  };
  
  const moveProblemDown = (problemId) => {
    setSelectedProblems(prev => {
      const index = prev.findIndex(p => p.id === problemId);
      if (index === -1 || index === prev.length - 1) return prev;
      
      const newProblems = [...prev];
      [newProblems[index].order, newProblems[index+1].order] = [newProblems[index+1].order, newProblems[index].order];
      [newProblems[index], newProblems[index+1]] = [newProblems[index+1], newProblems[index]];
      return newProblems;
    });
  };

  const filteredProblems = availableProblems.filter(problem => 
    problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (problem.tags && problem.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );
  
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Vui lòng nhập tiêu đề cuộc thi');
      return false;
    }
    
    if (!formData.description.trim()) {
      setError('Vui lòng nhập mô tả cuộc thi');
      return false;
    }
    
    if (!formData.start_time || !formData.end_time) {
      setError('Vui lòng chọn đầy đủ thời gian');
      return false;
    }
    
    if (new Date(formData.end_time) <= new Date(formData.start_time)) {
      setError('Thời gian kết thúc phải sau thời gian bắt đầu');
      return false;
    }
    
    if (selectedProblems.length === 0) {
      setError('Vui lòng chọn ít nhất một bài tập');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      // Update contest details
      await axios.put(
        `${API_BASE_URL}/contests/${contestId}`,
        formData,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Get current contest problems
      const currentProblemsRes = await axios.get(`${API_BASE_URL}/contests/${contestId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const currentProblems = currentProblemsRes.data.problems || [];
      
      // Update existing problems or add new ones
      for (const problem of selectedProblems) {
        const existing = currentProblems.find(p => p.problem_id === problem.id);
        
        if (existing) {
          // Update if order or points changed
          if (existing.order !== problem.order || existing.points !== problem.points) {
            await axios.put(
              `${API_BASE_URL}/contests/${contestId}/problems/${existing.id}`,
              { order: problem.order, points: problem.points },
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
          }
        } else {
          // Add new problem to contest
          await axios.post(
            `${API_BASE_URL}/contests/${contestId}/problems`,
            { problem_id: problem.id, order: problem.order, points: problem.points },
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
        }
      }
      
      // Remove problems that were deleted from selection
      for (const existing of currentProblems) {
        if (!selectedProblems.some(p => p.id === existing.problem_id)) {
          await axios.delete(
            `${API_BASE_URL}/contests/${contestId}/problems/${existing.id}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
        }
      }
      
      setSuccess(true);
      setTimeout(() => navigate(`/quanlycuocthi/${contestId}`), 1500);
      
    } catch (err) {
      console.error('Lỗi khi cập nhật cuộc thi:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật cuộc thi');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <LoadingSpinner />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Chỉnh sửa cuộc thi</h1>
          </div>
          
          <div className="p-6">
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
            
            {success && (
              <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">Cập nhật cuộc thi thành công! Đang chuyển hướng...</p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Basic information */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Thông tin cuộc thi</h2>
                  
                  {/* Title */}
                  <div className="mb-4">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Tiêu đề <span className="text-red-500">*</span>
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
                      Mô tả <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  
                  {/* Time settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
                        Thời gian bắt đầu <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        id="start_time"
                        name="start_time"
                        value={formData.start_time}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">
                        Thời gian kết thúc <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        id="end_time"
                        name="end_time"
                        value={formData.end_time}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Access settings */}
                  <div className="mt-4 space-y-4">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="is_public"
                          name="is_public"
                          type="checkbox"
                          checked={formData.is_public}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="is_public" className="font-medium text-gray-700">Công khai cuộc thi</label>
                        <p className="text-gray-500">Cuộc thi sẽ hiển thị trong danh sách cho tất cả người dùng</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="requires_approval"
                          name="requires_approval"
                          type="checkbox"
                          checked={formData.requires_approval}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="requires_approval" className="font-medium text-gray-700">Yêu cầu phê duyệt tham gia</label>
                        <p className="text-gray-500">Người dùng phải gửi yêu cầu và được chấp nhận trước khi tham gia cuộc thi</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Problems section */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Bài tập cuộc thi</h2>
                  
                  {/* Search problems */}
                  <div className="mb-4">
                    <label htmlFor="search-problems" className="block text-sm font-medium text-gray-700">
                      Tìm kiếm bài tập
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="text"
                        id="search-problems"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
                        placeholder="Nhập tên bài tập hoặc tag..."
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Available problems */}
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Bài tập có sẵn</h3>
                    <div className="border border-gray-300 rounded-md h-64 overflow-y-auto">
                      {problemsLoading ? (
                        <div className="flex justify-center items-center h-full">
                          <LoadingSpinner />
                        </div>
                      ) : filteredProblems.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          Không tìm thấy bài tập phù hợp
                        </div>
                      ) : (
                        <ul className="divide-y divide-gray-200">
                          {filteredProblems.map(problem => (
                            <li 
                              key={problem.id} 
                              className="p-3 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                              onClick={() => handleProblemSelect(problem)}
                            >
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {problem.title}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Độ khó: {problem.difficulty === 'easy' ? 'Dễ' : problem.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                                </div>
                                {problem.tags && problem.tags.length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {problem.tags.map((tag, idx) => (
                                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  
                  {/* Selected problems */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Bài tập đã chọn ({selectedProblems.length})</h3>
                    {selectedProblems.length === 0 ? (
                      <div className="bg-gray-100 p-4 rounded-md text-center text-gray-500">
                        Chưa có bài tập nào được chọn
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Thứ tự
                              </th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tên bài tập
                              </th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Độ khó
                              </th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Điểm
                              </th>
                              <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Thao tác
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedProblems.map(problem => (
                              <tr key={problem.id}>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <input
                                      type="number"
                                      min="1"
                                      value={problem.order}
                                      onChange={(e) => handleOrderChange(problem.id, e.target.value)}
                                      className="w-16 border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                    <div className="ml-2 flex flex-col space-y-1">
                                      <button
                                        type="button"
                                        onClick={() => moveProblemUp(problem.id)}
                                        className="text-gray-500 hover:text-blue-600"
                                      >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                        </svg>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => moveProblemDown(problem.id)}
                                        className="text-gray-500 hover:text-blue-600"
                                      >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{problem.title}</div>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    problem.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                    problem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {problem.difficulty === 'easy' ? 'Dễ' : problem.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                                  </span>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <input
                                    type="number"
                                    min="0"
                                    value={problem.points}
                                    onChange={(e) => handlePointsChange(problem.id, e.target.value)}
                                    className="w-20 border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                  />
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveProblem(problem.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Xóa
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Submit buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/quanlycuocthi/${contestId}`)}
                    className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Hủy bỏ
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
                        Đang lưu...
                      </>
                    ) : 'Lưu thay đổi'}
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

export default EditContest;