import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import LoadingSpinner from '../ProblemList/components/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import authService from '../../services/authService';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const EditContest = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  
  // State cho form
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    is_public: true,
    requires_approval: false
  });
  
  // State cho problems
  const [availableProblems, setAvailableProblems] = useState([]);
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State cho loading và error
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [problemsLoading, setProblemsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Kiểm tra quyền admin
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (!authService.isAdmin()) {
      navigate('/danh-sach-bai');
    }
  }, [navigate]);
  
  // Lấy thông tin cuộc thi
  useEffect(() => {
    const fetchContestData = async () => {
      try {
        setInitialLoading(true);
        const token = localStorage.getItem('token');
        
        // Lấy thông tin cuộc thi
        const contestResponse = await axios.get(`${API_BASE_URL}/contests/${contestId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const contestData = contestResponse.data;
        
        // Format lại thời gian để hiển thị trong input datetime-local
        const formatDateTimeForInput = (dateTimeStr) => {
          if (!dateTimeStr) return '';
          const date = new Date(dateTimeStr);
          return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
        };
        
        // Cập nhật form data
        setFormData({
          title: contestData.title || '',
          description: contestData.description || '',
          start_time: formatDateTimeForInput(contestData.start_time),
          end_time: formatDateTimeForInput(contestData.end_time),
          is_public: contestData.is_public !== undefined ? contestData.is_public : true,
          requires_approval: contestData.requires_approval !== undefined ? contestData.requires_approval : false
        });
        
        // Lấy danh sách bài tập của cuộc thi
        if (contestData.problems && Array.isArray(contestData.problems)) {
          // Sắp xếp theo thứ tự
          const sortedProblems = [...contestData.problems].sort((a, b) => a.order - b.order);
          
          // Chuyển định dạng để phù hợp với state selectedProblems
          const formattedProblems = sortedProblems.map(problem => ({
            id: problem.problem_id,
            problem_id: problem.problem_id,
            title: problem.problem ? problem.problem.title : 'Không tìm thấy bài tập',
            difficulty: problem.problem ? problem.problem.difficulty : 'easy',
            order: problem.order || 0,
            points: problem.points || 100,
            // Lưu lại contest_problem_id để cập nhật
            contest_problem_id: problem.id
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
  
  // Lấy danh sách bài tập
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setProblemsLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await axios.get(`${API_BASE_URL}/problems/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Lọc ra các bài tập chưa được chọn
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
  
  // Các hàm xử lý form
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Xử lý chọn bài tập
  const handleProblemSelect = (problem) => {
    // Kiểm tra xem bài đã được chọn chưa
    const alreadySelected = selectedProblems.some(p => p.id === problem.id);
    
    if (alreadySelected) {
      return; // Không thêm lại bài đã chọn
    }
    
    setSelectedProblems(prev => [
      ...prev,
      {
        ...problem,
        order: prev.length + 1,
        points: 100 // Điểm mặc định
      }
    ]);
  };
  
  // Xử lý xóa bài tập đã chọn
  const handleRemoveProblem = (problemId) => {
    setSelectedProblems(prev => {
      const filtered = prev.filter(p => p.id !== problemId);
      
      // Cập nhật lại order
      return filtered.map((p, idx) => ({
        ...p,
        order: idx + 1
      }));
    });
  };
  
  // Xử lý thay đổi thứ tự bài tập
  const handleOrderChange = (problemId, newOrder) => {
    const numericOrder = parseInt(newOrder);
    
    if (isNaN(numericOrder) || numericOrder < 1) {
      return; // Không cập nhật nếu giá trị không hợp lệ
    }
    
    setSelectedProblems(prev => {
      const updatedProblems = prev.map(p => 
        p.id === problemId ? { ...p, order: numericOrder } : p
      );
      
      // Sắp xếp lại theo thứ tự
      return updatedProblems.sort((a, b) => a.order - b.order);
    });
  };
  
  // Xử lý thay đổi điểm
  const handlePointsChange = (problemId, newPoints) => {
    const numericPoints = parseInt(newPoints);
    
    if (isNaN(numericPoints) || numericPoints < 0) {
      return; // Không cập nhật nếu giá trị không hợp lệ
    }
    
    setSelectedProblems(prev => 
      prev.map(p => 
        p.id === problemId ? { ...p, points: numericPoints } : p
      )
    );
  };
  
  // Lọc bài tập theo từ khóa tìm kiếm
  const filteredProblems = availableProblems.filter(problem => 
    problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (problem.tags && problem.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );
  
  // Validate form trước khi submit
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Vui lòng nhập tiêu đề cuộc thi');
      return false;
    }
    
    if (!formData.description.trim()) {
      setError('Vui lòng nhập mô tả cuộc thi');
      return false;
    }
    
    if (!formData.start_time) {
      setError('Vui lòng chọn thời gian bắt đầu');
      return false;
    }
    
    if (!formData.end_time) {
      setError('Vui lòng chọn thời gian kết thúc');
      return false;
    }
    
    const startTime = new Date(formData.start_time);
    const endTime = new Date(formData.end_time);
    
    if (endTime <= startTime) {
      setError('Thời gian kết thúc phải sau thời gian bắt đầu');
      return false;
    }
    
    if (selectedProblems.length === 0) {
      setError('Vui lòng chọn ít nhất một bài tập cho cuộc thi');
      return false;
    }
    
    return true;
  };
  
  // Submit form cập nhật cuộc thi
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      // Cập nhật thông tin cuộc thi
      await axios.put(
        `${API_BASE_URL}/contests/${contestId}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Lấy danh sách bài tập hiện tại của cuộc thi
      const currentProblemsResponse = await axios.get(`${API_BASE_URL}/contests/${contestId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const currentProblems = currentProblemsResponse.data.problems || [];
      
      // Xử lý từng bài tập đã chọn
      for (const problem of selectedProblems) {
        // Kiểm tra xem bài tập đã có trong cuộc thi chưa
        const existingProblem = currentProblems.find(p => p.problem_id === problem.id);
        
        if (existingProblem) {
          // Cập nhật bài tập đã có
          if (existingProblem.order !== problem.order || existingProblem.points !== problem.points) {
            await axios.put(
              `${API_BASE_URL}/contests/${contestId}/problems/${existingProblem.id}`,
              {
                order: problem.order,
                points: problem.points
              },
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
          }
        } else {
          // Thêm bài tập mới
          await axios.post(
            `${API_BASE_URL}/contests/${contestId}/problems`,
            {
              problem_id: problem.id,
              order: problem.order,
              points: problem.points
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
        }
      }
      
      // Xóa các bài tập đã bị loại bỏ
      for (const currentProblem of currentProblems) {
        const stillExists = selectedProblems.some(p => p.id === currentProblem.problem_id);
        
        if (!stillExists) {
          await axios.delete(
            `${API_BASE_URL}/contests/${contestId}/problems/${currentProblem.id}`,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
        }
      }
      
      setSuccess(true);
      
      // Chuyển hướng sau 2 giây
      setTimeout(() => {
        navigate('/admin/quan-ly-cuoc-thi');
      }, 2000);
      
    } catch (err) {
      console.error('Lỗi khi cập nhật cuộc thi:', err);
      setError(err.response?.data?.detail || 'Có lỗi xảy ra khi cập nhật cuộc thi. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  // Hiển thị loading
  if (initialLoading) {
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
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Chỉnh Sửa Cuộc Thi</h1>
          </div>
          
          <div className="p-6">
            {/* Thông báo lỗi */}
            {error && (
              <div className="mb-4">
                <ErrorMessage error={error} />
              </div>
            )}
            
            {/* Thông báo thành công */}
            {success && (
              <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">Cuộc thi đã được cập nhật thành công! Đang chuyển hướng...</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Form chỉnh sửa cuộc thi */}
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Thông tin cơ bản */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Thông tin cuộc thi</h2>
                  
                  {/* Tiêu đề */}
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
                  
                  {/* Mô tả */}
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
                    <p className="mt-1 text-xs text-gray-500">
                      Mô tả về nội dung, mục đích và các quy định của cuộc thi
                    </p>
                  </div>
                  
                  {/* Thời gian */}
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
                  
                  {/* Cài đặt quyền truy cập */}
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
                
                {/* Chọn bài tập */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Bài tập cuộc thi</h2>
                  
                  {/* Tìm kiếm bài tập */}
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
                  
                  {/* Danh sách bài tập có sẵn */}
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Bài tập có sẵn</h3>
                    <div className="border border-gray-300 rounded-md h-64 overflow-y-auto">
                      {problemsLoading ? (
                        <div className="flex justify-center items-center h-full">
                          <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
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
                    <p className="mt-1 text-xs text-gray-500">Nhấp vào bài tập để thêm vào cuộc thi</p>
                  </div>
                  
                  {/* Danh sách bài tập đã chọn */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Bài tập đã chọn</h3>
                    {selectedProblems.length === 0 ? (
                      <div className="bg-gray-100 p-4 rounded-md text-center text-gray-500">
                        Chưa có bài tập nào được chọn
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tên bài tập</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Độ khó</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Thứ tự</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Điểm</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Hành động</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedProblems.map(problem => (
                              <tr key={problem.id}>
                                <td className="px-4 py-2">{idx + 1}</td>
                                <td className="px-4 py-2">{problem.title}</td>
                                <td className="px-4 py-2">
                                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    problem.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                    problem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {problem.difficulty === 'easy' ? 'Dễ' : problem.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    type="number"
                                    min={1}
                                    value={problem.order}
                                    onChange={e => handleOrderChange(problem.id, e.target.value)}
                                    className="w-16 border rounded px-2 py-1 text-sm"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    type="number"
                                    min={0}
                                    value={problem.points}
                                    onChange={e => handlePointsChange(problem.id, e.target.value)}
                                    className="w-16 border rounded px-2 py-1 text-sm"
                                  />
                                </td>
                                <td className="px-4 py-2 text-right">
                                  <button
                                    type="button"
                                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                    onClick={() => handleRemoveProblem(problem.id)}
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
                {/* Kết thúc chọn bài tập */}
              </div>
              {/* Nút submit */}
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
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