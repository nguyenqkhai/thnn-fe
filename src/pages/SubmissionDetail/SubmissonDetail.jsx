import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import LoadingSpinner from '../ProblemList/components/LoadingSpinner';
import ErrorMessage from '../ProblemList/components/ErrorMessage';
import CodeEditor from '../ProblemDetail/components/CodeEditor';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const SubmissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [submission, setSubmission] = useState(null);
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Hàm kiểm tra ID hợp lệ
  const isValidId = (submissionId) => {
    if (!submissionId || 
        submissionId === 'undefined' || 
        submissionId === 'null' || 
        submissionId.trim() === '') {
      return false;
    }
    
    // Kiểm tra định dạng UUID - không bắt buộc nhưng có thể giúp tránh các request không cần thiết
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(submissionId);
  };
  
  // Hàm lấy token xác thực
  const getAuthToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Vui lòng đăng nhập để xem chi tiết bài nộp');
    }
    return token;
  };
  
  // Lấy thông tin bài nộp
  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        // Kiểm tra ID hợp lệ trước khi thực hiện request
        if (!isValidId(id)) {
          console.error('ID bài nộp không hợp lệ:', id);
          setError('ID bài nộp không hợp lệ hoặc không đúng định dạng. Vui lòng kiểm tra lại đường dẫn.');
          setLoading(false);
          return;
        }
        
        setLoading(true);
        const token = getAuthToken();
        
        // Lấy thông tin bài nộp
        const response = await axios.get(`${API_BASE_URL}/submissions/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.data || !response.data.id) {
          console.error('Phản hồi từ server không chứa thông tin bài nộp hợp lệ');
          setError('Không tìm thấy thông tin bài nộp');
          setLoading(false);
          return;
        }
        
        console.log('Thông tin bài nộp:', response.data);
        setSubmission(response.data);
        
        // Lấy thông tin bài tập
        if (response.data?.problem_id) {
          const problemResponse = await axios.get(`${API_BASE_URL}/problems/${response.data.problem_id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          setProblem(problemResponse.data);
        }
      } catch (err) {
        console.error('Lỗi khi lấy thông tin bài nộp:', err);
        
        // Xử lý các lỗi cụ thể
        if (err.response) {
          if (err.response.status === 400) {
            setError(`ID bài nộp không hợp lệ: ${err.response.data.detail || 'Vui lòng kiểm tra lại'}`);
          } else if (err.response.status === 401) {
            setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
            // Chuyển hướng đến trang đăng nhập sau 3 giây
            setTimeout(() => {
              navigate('/login', { state: { returnUrl: `/submissions/${id}` } });
            }, 3000);
          } else if (err.response.status === 403) {
            setError('Bạn không có quyền xem bài nộp này');
          } else if (err.response.status === 404) {
            setError('Không tìm thấy bài nộp này');
          } else {
            setError(`Có lỗi xảy ra: ${err.response.data.detail || 'Không thể tải thông tin bài nộp'}`);
          }
        } else if (err.request) {
          setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
        } else {
          setError('Có lỗi xảy ra khi tải thông tin bài nộp');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubmission();
  }, [id, navigate]);
  
  // Hàm chuyển đổi trạng thái thành text dễ đọc
  const getStatusText = (status) => {
    switch (status) {
      case 'accepted': return 'Thành công';
      case 'wrong_answer': return 'Kết quả sai';
      case 'time_limit_exceeded': return 'Quá thời gian';
      case 'memory_limit_exceeded': return 'Quá bộ nhớ';
      case 'runtime_error': return 'Lỗi thực thi';
      case 'compilation_error': return 'Lỗi biên dịch';
      case 'pending': return 'Đang chờ';
      default: return status || 'Không xác định';
    }
  };
  
  // Hàm lấy màu sắc dựa trên trạng thái
  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'text-green-800 bg-green-100';
      case 'wrong_answer': return 'text-red-800 bg-red-100';
      case 'time_limit_exceeded': return 'text-yellow-800 bg-yellow-100';
      case 'memory_limit_exceeded': return 'text-orange-800 bg-orange-100';
      case 'runtime_error': return 'text-red-800 bg-red-100';
      case 'compilation_error': return 'text-purple-800 bg-purple-100';
      case 'pending': return 'text-gray-800 bg-gray-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };
  
  // Hàm định dạng thời gian
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'N/A';
    
    try {
      const date = new Date(dateTimeStr);
      
      // Định dạng ngày tháng
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      // Định dạng giờ phút
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (e) {
      console.error('Lỗi định dạng thời gian:', e);
      return 'N/A';
    }
  };
  
  // Hàm chuyển đổi language code thành tên ngôn ngữ
  const getLanguageName = (code) => {
    if (!code) return 'N/A';
    
    const languages = {
      'cpp': 'C++',
      'python': 'Python',
      'c': 'C',
      'pascal': 'Pascal',
      'java': 'Java',
      'javascript': 'JavaScript'
    };
    return languages[code] || code;
  };

  // Hiển thị spinner khi đang tải dữ liệu
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  // Hiển thị thông báo lỗi
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto px-4 py-8 flex-grow">
          <ErrorMessage error={error} />
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => navigate('/cac-bai-da-nop')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Quay lại danh sách bài nộp
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Hiển thị thông báo khi không tìm thấy bài nộp
  if (!submission) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto px-4 py-8 flex-grow">
          <div className="bg-yellow-50 p-4 rounded-md border-l-4 border-yellow-400">
            <p className="text-yellow-700">Không tìm thấy bài nộp này.</p>
          </div>
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => navigate('/cac-bai-da-nop')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Quay lại danh sách bài nộp
            </button>
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
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              <h1 className="text-2xl font-bold text-white">Chi Tiết Bài Nộp</h1>
              
              {/* Nút quay lại */}
              <div className="mt-2 md:mt-0">
                <button
                  onClick={() => navigate('/cac-bai-da-nop')}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Quay lại danh sách
                </button>
              </div>
            </div>
          </div>
          
          {/* Thông tin bài nộp */}
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cột trái - Thông tin chi tiết */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Thông tin bài nộp</h2>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <dl className="space-y-3">
                    {/* ID bài nộp */}
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">ID bài nộp:</dt>
                      <dd className="text-sm text-gray-900 col-span-2 break-all">
                        {submission.id || 'N/A'}
                      </dd>
                    </div>
                    
                    {/* Bài tập */}
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Bài tập:</dt>
                      <dd className="text-sm text-gray-900 col-span-2">
                        {problem ? (
                          <Link to={`/problems/${problem.id}`} className="text-blue-600 hover:text-blue-800">
                            {problem.title}
                          </Link>
                        ) : (
                          submission.problem_id ? `Bài #${submission.problem_id}` : 'N/A'
                        )}
                      </dd>
                    </div>
                    
                    {/* Trạng thái */}
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Trạng thái:</dt>
                      <dd className="text-sm text-gray-900 col-span-2">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                          {getStatusText(submission.status)}
                        </span>
                      </dd>
                    </div>
                    
                    {/* Ngôn ngữ */}
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Ngôn ngữ:</dt>
                      <dd className="text-sm text-gray-900 col-span-2">
                        {getLanguageName(submission.language)}
                      </dd>
                    </div>
                    
                    {/* Thời gian chạy */}
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Thời gian chạy:</dt>
                      <dd className="text-sm text-gray-900 col-span-2">
                        {submission.execution_time_ms !== null && submission.execution_time_ms !== undefined 
                          ? `${submission.execution_time_ms} ms` 
                          : 'N/A'}
                      </dd>
                    </div>
                    
                    {/* Bộ nhớ */}
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Bộ nhớ:</dt>
                      <dd className="text-sm text-gray-900 col-span-2">
                        {submission.memory_used_kb !== null && submission.memory_used_kb !== undefined
                          ? `${submission.memory_used_kb} KB` 
                          : 'N/A'}
                      </dd>
                    </div>
                    
                    {/* Thời gian nộp */}
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Thời gian nộp:</dt>
                      <dd className="text-sm text-gray-900 col-span-2">
                        {formatDateTime(submission.submitted_at)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              {/* Cột phải - Thông tin chi tiết kết quả */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Kết quả test</h2>
                
                {submission.details ? (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {/* Tổng quan */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Số test case đã chạy:</span> {submission.details.total_test_cases || '-'}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Số test case đạt:</span> {submission.details.passed_test_cases || '-'}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Số test case lỗi:</span> {submission.details.failed_test_cases || '-'}
                      </p>
                    </div>
                    
                    {/* Chi tiết từng test case */}
                    {submission.details.test_results && submission.details.test_results.length > 0 && (
                      <div>
                        <h3 className="font-medium text-sm text-gray-700 mb-2">Chi tiết từng test case:</h3>
                        <div className="space-y-2">
                          {submission.details.test_results.map((result, idx) => (
                            <div key={idx} className={`p-2 rounded-md text-xs ${
                              result.status === 'accepted' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                            }`}>
                              <p><span className="font-medium">Test case #{idx+1}:</span> {getStatusText(result.status)}</p>
                              <p><span className="font-medium">Thời gian:</span> {result.execution_time_ms}ms</p>
                              <p><span className="font-medium">Bộ nhớ:</span> {result.memory_used_kb}KB</p>
                              {result.output_diff && (
                                <details className="mt-1">
                                  <summary className="cursor-pointer">Xem sự khác biệt</summary>
                                  <pre className="mt-1 bg-white p-2 rounded text-xs overflow-x-auto">
                                    {result.output_diff}
                                  </pre>
                                </details>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Thông báo lỗi nếu có */}
                    {submission.details.error && (
                      <div className="mt-4 p-3 bg-red-50 rounded-md border border-red-200">
                        <h3 className="font-medium text-sm text-red-700 mb-1">Lỗi:</h3>
                        <pre className="text-xs text-red-600 overflow-x-auto whitespace-pre-wrap">
                          {submission.details.error}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-500 text-sm">
                    Không có thông tin chi tiết kết quả
                  </div>
                )}
              </div>
            </div>
            
            {/* Code editor */}
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Mã nguồn</h2>
              
              <div className="border border-gray-300 rounded-md overflow-hidden">
                {submission.code ? (
                  <CodeEditor 
                    code={submission.code} 
                    onChange={() => {}} // Readonly mode
                    language={submission.language}
                  />
                ) : (
                  <div className="p-4 bg-gray-50 text-gray-500">
                    Không có mã nguồn
                  </div>
                )}
              </div>
            </div>
            
            {/* Nút thao tác */}
            <div className="mt-6 flex justify-end space-x-4">
              {submission.problem_id && (
                <Link
                  to={`/problems/${submission.problem_id}`} 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Giải lại bài này
                </Link>
              )}
              <Link
                to="/cac-bai-da-nop"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Trở về danh sách
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SubmissionDetail;