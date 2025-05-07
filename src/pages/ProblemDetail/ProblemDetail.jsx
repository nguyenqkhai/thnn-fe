import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import LoadingSpinner from '../ProblemList/components/LoadingSpinner';
import ErrorMessage from '../ProblemList/components/ErrorMessage';
import CodeEditor from './components/CodeEditor';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Component hiển thị thông báo thành công
const SuccessMessage = ({ message }) => {
  return (
    <div className="bg-green-50 p-4 rounded-md border-l-4 border-green-400">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-green-800">{message}</p>
        </div>
      </div>
    </div>
  );
};

const ProblemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // States cơ bản
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // States cho code editor
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [customOutput, setCustomOutput] = useState('');
  
  // State cho trạng thái đã giải
  const [isAlreadySolved, setIsAlreadySolved] = useState(false);

  // Xóa thông báo lỗi sau một khoảng thời gian
  useEffect(() => {
    let timer;
    if (error) {
      timer = setTimeout(() => {
        setError(null);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [error]);

  // Xóa thông báo thành công sau một khoảng thời gian
  useEffect(() => {
    let timer;
    if (successMessage) {
      timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [successMessage]);

  // Hàm lấy token từ localStorage
  const getAuthToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Vui lòng đăng nhập để xem chi tiết bài tập');
    }
    return token;
  };

  // Kiểm tra xem người dùng đã giải bài này chưa dựa trên submissions
  const checkIfProblemSolved = async (problemId) => {
    try {
      const token = getAuthToken();
      
      // Lấy tất cả submissions của người dùng hiện tại
      const response = await axios.get(`${API_BASE_URL}/submissions/`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { problem_id: problemId }
      });
      
      // Kiểm tra xem có submission nào có status 'accepted' không
      if (response.data && Array.isArray(response.data)) {
        return response.data.some(submission => 
          submission.problem_id === parseInt(problemId) && 
          submission.status === 'accepted'
        );
      }
      
      return false;
    } catch (err) {
      console.error('Không thể kiểm tra trạng thái bài đã giải:', err);
      return false;
    }
  };

  // Lấy thông tin bài toán và kiểm tra trạng thái đã giải
  useEffect(() => {
    const fetchProblemAndStatus = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        
        // Lấy thông tin bài toán
        const problemResponse = await axios.get(`${API_BASE_URL}/problems/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('Thông tin bài tập:', problemResponse.data);
        console.log('Test cases:', problemResponse.data.test_cases);
        
        setProblem(problemResponse.data);
        
        // Cập nhật code dựa trên ngôn ngữ đã chọn
        if (problemResponse.data.starter_code && problemResponse.data.starter_code[language]) {
          setCode(problemResponse.data.starter_code[language]);
        } else {
          setDefaultCodeTemplate(language);
        }
        
        // Thiết lập input mẫu
        if (problemResponse.data.example_input) {
          setCustomInput(problemResponse.data.example_input);
        }

        // Kiểm tra trạng thái đã giải
        const solved = await checkIfProblemSolved(id);
        setIsAlreadySolved(solved);
        
      } catch (err) {
        console.error('Lỗi khi tải thông tin bài tập:', err);
        handleApiError(err, 'Không thể tải thông tin bài tập');
        
        // Nếu lỗi là do chưa đăng nhập, chuyển hướng đến trang đăng nhập
        if (err.message === 'Vui lòng đăng nhập để xem chi tiết bài tập' || 
            (err.response && err.response.status === 401)) {
          navigate('/login', { state: { returnUrl: `/problems/${id}` } });
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchProblemAndStatus();
  }, [id, navigate, language]);
  
  // Thiết lập template code mặc định dựa trên ngôn ngữ
  const setDefaultCodeTemplate = (selectedLanguage) => {
    const templates = {
      python: `# Viết code của bạn ở đây\n\ndef solve(input_str):\n    # Xử lý input\n    lines = input_str.strip().split('\\n')\n    \n    # Code xử lý\n    \n    # Trả về kết quả\n    return "Kết quả của bạn"\n\n# Đọc input\ninput_str = input()\n# Gọi hàm xử lý\nresult = solve(input_str)\n# In kết quả\nprint(result)`,
      java: `// Viết code của bạn ở đây\nimport java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        \n        // Đọc input\n        \n        // Xử lý\n        \n        // In kết quả\n        System.out.println("Kết quả của bạn");\n    }\n}`,
      cpp: `// Viết code của bạn ở đây\n#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    // Đọc input\n    \n    // Xử lý\n    \n    // In kết quả\n    cout << "Kết quả của bạn" << endl;\n    return 0;\n}`,
      javascript: `// Viết code của bạn ở đây\nfunction solve(input) {\n    // Xử lý input\n    const lines = input.trim().split('\\n');\n    \n    // Code xử lý\n    \n    // Trả về kết quả\n    return "Kết quả của bạn";\n}\n\n// Đọc input từ stdin\nlet input = '';\nprocess.stdin.on('data', data => {\n    input += data;\n});\n\nprocess.stdin.on('end', () => {\n    const result = solve(input);\n    console.log(result);\n});`
    };
    
    setCode(templates[selectedLanguage] || `# Viết code của bạn ở đây\n# Ngôn ngữ: ${selectedLanguage}`);
  };

  // Xử lý lỗi API
  const handleApiError = (err, defaultMessage) => {
    if (err.response) {
      if (err.response.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
      } else if (err.response.status === 404) {
        setError('Không tìm thấy bài tập này');
      } else if (err.response.data && err.response.data.detail) {
        setError(`Lỗi: ${err.response.data.detail}`);
      } else {
        setError(defaultMessage);
      }
    } else if (err.request) {
      setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    } else {
      setError(defaultMessage);
    }
  };

  // Xử lý nộp bài
  // Xử lý nộp bài
const handleSubmit = async () => {
  if (!code.trim()) {
    setError('Vui lòng nhập code trước khi nộp bài');
    return;
  }

  setIsSubmitting(true);
  setSubmissionResult(null);
  setSuccessMessage(null);
  
  try {
    const token = getAuthToken();
    
    // Đảm bảo problem_id được truyền đúng định dạng
    // Nếu problem_id trong URL là số nguyên, không cần chuyển đổi
    const submissionData = {
      problem_id: id, // Sử dụng id từ useParams()
      code: code,
      language: language,
      contest_id: null // Nếu không có cuộc thi, gửi null
    };
    
    console.log('Đang nộp bài giải:', submissionData);
    
    const response = await axios.post(
      `${API_BASE_URL}/submissions/`,
      submissionData,
      {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Kết quả nộp bài:', response.data);
    
    // Kiểm tra xem submission có được lưu thành công không
    if (response.data && response.data.id) {
      console.log('Bài nộp đã được lưu thành công với ID:', response.data.id);
      setSubmissionResult(response.data);
      
      // Nếu bài giải được chấp nhận và chưa được đánh dấu là đã giải
      if (response.data.status === 'accepted' && !isAlreadySolved) {
        setIsAlreadySolved(true);
        setSuccessMessage('Chúc mừng! Bài toán đã được giải thành công.');
      } else if (response.data.status !== 'accepted') {
        // Nếu không được accepted, hiển thị thông báo tương ứng
        setSuccessMessage(`Bài nộp đã được ghi nhận! Trạng thái: ${getStatusText(response.data.status)}`);
      }
    } else {
      console.error('Bài nộp không được lưu: Không có ID trong phản hồi');
      setError('Bài nộp không được lưu thành công. Vui lòng thử lại sau.');
    }
  } catch (err) {
    console.error('Lỗi khi nộp bài:', err);
    
    // Log chi tiết hơn về lỗi
    if (err.response) {
      console.error('Phản hồi lỗi từ server:', {
        status: err.response.status,
        data: err.response.data,
        headers: err.response.headers
      });
      
      // Kiểm tra các lỗi cụ thể từ backend
      if (err.response.status === 400) {
        setError(`Lỗi dữ liệu: ${err.response.data.detail || 'Dữ liệu không hợp lệ'}`);
      } else if (err.response.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        // Có thể chuyển hướng đến trang đăng nhập
        // navigate('/login');
      } else if (err.response.status === 404) {
        setError('Không tìm thấy bài toán này hoặc đường dẫn không chính xác.');
      } else if (err.response.status === 500) {
        setError('Lỗi máy chủ. Vui lòng thử lại sau hoặc liên hệ quản trị viên.');
      } else {
        setError(`Có lỗi xảy ra: ${err.response.data.detail || 'Không thể nộp bài'}`);
      }
    } else if (err.request) {
      console.error('Không nhận được phản hồi từ server:', err.request);
      setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    } else {
      console.error('Lỗi cấu hình request:', err.message);
      setError('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
    }
  } finally {
    setIsSubmitting(false);
  }
};

  // Xử lý test code
  const handleTest = async () => {
    if (!code.trim()) {
      setError('Vui lòng nhập code trước khi test');
      return;
    }

    if (!customInput.trim()) {
      setError('Vui lòng nhập input để test');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setCustomOutput('');
    
    try {
      const token = getAuthToken();
      
      console.log('Đang test bài giải với dữ liệu:', {
        problem_id: id,
        code,
        language,
        input: customInput
      });
      
      const response = await axios.post(
        `${API_BASE_URL}/submissions/test`,
        {
          problem_id: id,
          code,
          language,
          input: customInput
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      console.log('Kết quả test:', response.data);
      
      setTestResult(response.data);
      
      // Nếu có output, hiển thị trong khu vực kết quả
      if (response.data.output) {
        setCustomOutput(response.data.output);
      }
    } catch (err) {
      console.error('Lỗi khi test bài giải:', err);
      handleApiError(err, 'Có lỗi xảy ra khi test. Vui lòng thử lại.');
      setCustomOutput('');
    } finally {
      setIsTesting(false);
    }
  };

  // Hàm chuyển đổi text độ khó
  const getDifficultyText = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'Dễ';
      case 'medium': return 'Trung bình';
      case 'hard': return 'Khó';
      default: return 'Không xác định';
    }
  };

  // Hàm chuyển đổi trạng thái thành text dễ đọc
  const getStatusText = (status) => {
    switch (status) {
      case 'success':
      case 'accepted': 
        return 'Thành công';
      case 'compilation_error': 
        return 'Lỗi biên dịch';
      case 'runtime_error': 
        return 'Lỗi thực thi';
      case 'time_limit_exceeded': 
        return 'Quá thời gian';
      case 'memory_limit_exceeded': 
        return 'Quá bộ nhớ';
      case 'wrong_answer':
        return 'Kết quả sai';
      default: 
        return 'Thất bại';
    }
  };

  // Hiển thị/ẩn editor
  const toggleEditor = () => {
    setShowEditor(!showEditor);
    if (!showEditor) {
      setSubmissionResult(null);
      setTestResult(null);
      setCustomOutput('');
    }
  };

  // Phần render khi đang tải
  if (loading) {
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

  // Phần render khi có lỗi
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="container mx-auto px-4 py-8 flex-grow">
          <ErrorMessage error={error} />
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => navigate(`/problems:${id}`)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Quay lại
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Phần render khi không tìm thấy bài tập
  if (!problem) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="container mx-auto px-4 py-8 flex-grow">
          <div className="bg-yellow-50 p-4 rounded-md border-l-4 border-yellow-400">
            <p className="text-yellow-700">Không tìm thấy bài tập này.</p>
          </div>
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => navigate('/problems')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Quay lại danh sách bài tập
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Phần render chính
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        {/* Thông báo lỗi */}
        {error && (
          <div className="mb-4">
            <ErrorMessage error={error} />
          </div>
        )}
        
        {/* Thông báo thành công */}
        {successMessage && (
          <div className="mb-4">
            <SuccessMessage message={successMessage} />
          </div>
        )}
        
        {/* Bảng thông tin bài tập */}
        <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
          {/* Header với tiêu đề và độ khó */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">{problem.title}</h1>
              <div className="mt-1 flex items-center space-x-2">
                {/* Badge độ khó */}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white ${
                  problem.difficulty === 'easy' ? 'text-green-800' :
                  problem.difficulty === 'medium' ? 'text-yellow-800' :
                  'text-red-800'
                }`}>
                  {getDifficultyText(problem.difficulty)}
                </span>
                
                {/* Badge đã giải */}
                {isAlreadySolved && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg className="mr-1 h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Đã giải
                  </span>
                )}
              </div>
            </div>
            
            {/* Button nộp bài */}
            <button
              onClick={toggleEditor}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {isAlreadySolved ? 'Thử lại' : 'Giải bài này'}
            </button>
          </div>
          
          {/* Thân bài tập */}
          <div className="px-6 py-4">
            {/* Tags */}
            {problem.tags && problem.tags.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {problem.tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* Mô tả bài tập */}
            <div className="prose max-w-none">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Mô tả:</h3>
              <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: problem.description.replace(/\n/g, '<br/>') }} />
            </div>

            {/* Input mẫu */}
            {problem.example_input && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900">Input mẫu:</h3>
                <pre className="mt-2 bg-gray-50 p-3 rounded overflow-x-auto border border-gray-200">
                  {problem.example_input}
                </pre>
              </div>
            )}
            
            {/* Output mẫu */}
            {problem.example_output && (
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">Output mẫu:</h3>
                <pre className="mt-2 bg-gray-50 p-3 rounded overflow-x-auto border border-gray-200">
                  {problem.example_output}
                </pre>
              </div>
            )}
            
            {/* Ràng buộc */}
            {problem.constraints && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900">Ràng buộc:</h3>
                <div className="mt-2 text-gray-700 bg-gray-50 p-3 rounded border border-gray-200">
                  <div dangerouslySetInnerHTML={{ __html: problem.constraints.replace(/\n/g, '<br/>') }} />
                </div>
              </div>
            )}

            {/* Hiển thị test case mẫu từ API */}
            {problem.test_cases && problem.test_cases.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900">Test case mẫu:</h3>
                <div className="mt-2 space-y-4">
                  {problem.test_cases.filter(tc => tc.is_sample).map((testCase, index) => (
                    <div key={testCase.id} className="bg-gray-50 p-3 rounded border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Input:</h4>
                          <pre className="mt-1 bg-white p-2 rounded overflow-x-auto border border-gray-200 text-sm">
                            {testCase.input}
                          </pre>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Output mong đợi:</h4>
                          <pre className="mt-1 bg-white p-2 rounded overflow-x-auto border border-gray-200 text-sm">
                            {testCase.expected_output}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Chức năng làm bài / ẩn trình soạn thảo */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={toggleEditor}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {showEditor ? 'Ẩn trình soạn thảo' : 'Làm bài ngay'}
              </button>
            </div>

            {/* Code Editor Section */}
            {showEditor && (
              <div className="mt-6">
                {/* Thông báo đã giải */}
                {isAlreadySolved && (
                  <div className="mb-4 bg-green-50 p-4 rounded-md border border-green-200">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">Bạn đã giải bài toán này!</h3>
                        <div className="mt-1 text-sm text-green-700">
                          <p>Bạn có thể tiếp tục thử nghiệm với các giải pháp khác nhau hoặc cải thiện code của mình.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Chọn ngôn ngữ */}
                <div className="mb-4">
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                    Ngôn ngữ lập trình
                  </label>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="javascript">JavaScript</option>
                  </select>
                </div>

                {/* Code Editor */}
                <CodeEditor 
                  code={code} 
                  onChange={setCode} 
                  language={language}
                />

                {/* Test Input/Output Section */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="custom-input" className="block text-sm font-medium text-gray-700 mb-1">
                      Input để test
                    </label>
                    <textarea
                      id="custom-input"
                      rows="5"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Nhập input để test code của bạn..."
                    />
                  </div>
                  <div>
                    <label htmlFor="custom-output" className="block text-sm font-medium text-gray-700 mb-1">
                      Kết quả output
                    </label>
                    <textarea
                      id="custom-output"
                      rows="5"
                      readOnly
                      value={customOutput}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 sm:text-sm"
                      placeholder="Kết quả sẽ hiển thị ở đây..."
                    />
                  </div>
                </div>

                {/* Nút Test và Nộp bài */}
                <div className="mt-4 flex justify-between">
                  <button
                    onClick={handleTest}
                    disabled={isTesting}
                    className={`inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                      isTesting ? 'bg-gray-500' : 'bg-orange-600 hover:bg-orange-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500`}
                  >
{isTesting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang test...
                      </>
                    ) : 'Test thử'}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                      isSubmitting ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang nộp...
                      </>
                    ) : 'Nộp bài chính thức'}
                  </button>
                </div>

                {/* Kết quả Test */}
                {testResult && (
                  <div className={`mt-4 p-4 rounded-md ${
                    testResult.status === 'success' || testResult.status === 'accepted'
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    {/* Chỉ hiển thị tiêu đề khi có lỗi */}
                    {testResult.status !== 'success' && testResult.status !== 'accepted' && (
                      <h3 className="text-lg font-medium mb-2">
                        Kết quả test: 
                        <span className={`ml-2 ${
                          testResult.status === 'success' || testResult.status === 'accepted'
                            ? 'text-green-800' 
                            : 'text-red-800'
                        }`}>
                          {getStatusText(testResult.status)}
                        </span>
                      </h3>
                    )}
                    
                    {/* Chỉ hiển thị thông báo khi có lỗi */}
                    {testResult.message && testResult.status !== 'success' && testResult.status !== 'accepted' && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Thông báo lỗi:</p>
                        <pre className="mt-1 bg-white p-2 rounded overflow-x-auto border border-gray-200 text-sm">
                          {testResult.message}
                        </pre>
                      </div>
                    )}
                    
                    {/* Luôn hiển thị thông tin hiệu suất */}
                    {testResult.execution_time_ms !== undefined && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Thời gian chạy: {testResult.execution_time_ms} ms</p>
                      </div>
                    )}
                    
                    {testResult.memory_used_kb !== undefined && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Bộ nhớ sử dụng: {testResult.memory_used_kb} KB</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Kết quả nộp bài */}
                {submissionResult && (
                  <div className={`mt-4 p-4 rounded-md ${
                    submissionResult.status === 'accepted' 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <h3 className="text-lg font-medium mb-2">
                      Kết quả nộp bài: 
                      <span className={`ml-2 ${
                        submissionResult.status === 'accepted' 
                          ? 'text-green-800' 
                          : 'text-red-800'
                      }`}>
                        {getStatusText(submissionResult.status)}
                      </span>
                    </h3>
                    
                    {submissionResult.message && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Thông báo:</p>
                        <pre className="mt-1 bg-white p-2 rounded overflow-x-auto border border-gray-200 text-sm">
                          {submissionResult.message}
                        </pre>
                      </div>
                    )}
                    
                    {submissionResult.execution_time_ms !== undefined && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Thời gian chạy: {submissionResult.execution_time_ms} ms</p>
                      </div>
                    )}
                    
                    {submissionResult.memory_used_kb !== undefined && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Bộ nhớ sử dụng: {submissionResult.memory_used_kb} KB</p>
                      </div>
                    )}
                    
                    {submissionResult.details && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Chi tiết:</p>
                        <pre className="mt-1 bg-white p-2 rounded overflow-x-auto border border-gray-200 text-sm">
                          {typeof submissionResult.details === 'object' 
                            ? JSON.stringify(submissionResult.details, null, 2)
                            : submissionResult.details}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProblemDetail;