import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const ContestDetail = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  
  const [contest, setContest] = useState(null);
  const [problems, setProblems] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isParticipant, setIsParticipant] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Fetch contest data
  useEffect(() => {
    const fetchContestData = async () => {
      try {
        setLoading(true);
        
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        // Fetch contest details
        const contestResponse = await axios.get(
          `${API_BASE_URL}/contests/${contestId}`, 
          { headers }
        );
        
        setContest(contestResponse.data);
        
        // Fetch problems in the contest
        try {
          const problemsResponse = await axios.get(
            `${API_BASE_URL}/contests/${contestId}/problems`,
            { headers }
          );
          
          setProblems(problemsResponse.data || []);
        } catch (problemsErr) {
          console.error('Lỗi khi lấy danh sách bài tập:', problemsErr);
        }
        
        // Check if user is participant
        if (token) {
          try {
            const participantResponse = await axios.get(
              `${API_BASE_URL}/contests/${contestId}/participant-status`,
              { headers }
            );
            
            setIsParticipant(participantResponse.data?.is_participant || false);
          } catch (participantErr) {
            console.error('Lỗi khi kiểm tra trạng thái tham gia:', participantErr);
          }
          
          // Fetch participants list
          try {
            const participantsResponse = await axios.get(
              `${API_BASE_URL}/contests/${contestId}/participants`,
              { headers }
            );
            
            setParticipants(participantsResponse.data || []);
          } catch (participantsErr) {
            console.error('Lỗi khi lấy danh sách người tham gia:', participantsErr);
            setParticipants([]);
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu kỳ thi:', err);
        setError('Không thể tải thông tin kỳ thi. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchContestData();
  }, [contestId]);
  
  // Register for contest
  const handleRegister = async () => {
    try {
      setIsRegistering(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate(`/login?redirect=/ky-thi/${contestId}`);
        return;
      }
      
      await axios.post(
        `${API_BASE_URL}/contests/${contestId}/register`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      setIsParticipant(true);
      setSuccessMessage('Đăng ký tham gia thành công!');
      
      // Cập nhật danh sách người tham gia
      try {
        const participantsResponse = await axios.get(
          `${API_BASE_URL}/contests/${contestId}/participants`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        setParticipants(participantsResponse.data || []);
      } catch (err) {
        console.error('Lỗi khi cập nhật danh sách người tham gia:', err);
      }
      
      // Hiển thị thông báo trong 3 giây
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Lỗi khi đăng ký tham gia:', err);
      setError('Không thể đăng ký tham gia. Vui lòng thử lại sau.');
    } finally {
      setIsRegistering(false);
    }
  };
  
  // Format date
  const formatDate = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    
    try {
      const date = new Date(dateTimeStr);
      
      if (isNaN(date.getTime())) {
        return '';
      }
      
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${day} Tháng ${month}, ${year}, ${hours}:${minutes}`;
    } catch (error) {
      console.error('Lỗi khi định dạng ngày:', error);
      return '';
    }
  };
  
  // Format duration
  const formatDuration = (hours, minutes) => {
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days} ngày`;
    }
    
    if (hours > 0 && minutes > 0) {
      return `${hours} giờ, ${minutes} phút`;
    } else if (hours > 0) {
      return `${hours} giờ`;
    } else {
      return `${minutes} phút`;
    }
  };
  
  // Check contest status
  const getContestStatus = () => {
    if (!contest) return { text: 'Unknown', className: 'bg-gray-100 text-gray-800' };
    
    try {
      const now = new Date();
      const start = new Date(contest.start_time);
      const end = new Date(contest.end_time);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { text: 'Unknown', className: 'bg-gray-100 text-gray-800' };
      }
      
      if (now < start) {
        return { text: 'Sắp diễn ra', className: 'bg-blue-100 text-blue-800' };
      } else if (now >= start && now <= end) {
        return { text: 'Đang diễn ra', className: 'bg-green-100 text-green-800' };
      } else {
        return { text: 'Đã kết thúc', className: 'bg-gray-100 text-gray-800' };
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra trạng thái kỳ thi:', error);
      return { text: 'Unknown', className: 'bg-gray-100 text-gray-800' };
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }
  
  if (error || !contest) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Header />
        <div className="flex-grow container mx-auto px-4 py-8">
          <div className="bg-red-50 p-4 rounded-md border-l-4 border-red-500 mb-4">
            <p className="text-red-700">{error || 'Không tìm thấy kỳ thi.'}</p>
          </div>
          <Link to="/ky-thi" className="text-blue-600 hover:text-blue-800">
            ← Quay lại danh sách kỳ thi
          </Link>
        </div>
        <Footer />
      </div>
    );
  }
  
  const status = getContestStatus();
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-4">
          <Link to="/ky-thi" className="text-blue-600 hover:text-blue-800">
            ← Quay lại danh sách kỳ thi
          </Link>
        </div>
        
        {successMessage && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
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
        
        {/* Thông tin kỳ thi */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-blue-600 text-white p-4">
            <h1 className="text-2xl font-bold">{contest.title}</h1>
            <div className="mt-2 flex items-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                {status.text}
              </span>
              <span className="mx-2 text-blue-200">•</span>
              <span className="text-blue-100">{formatDate(contest.start_time)}</span>
            </div>
            <div className="text-blue-100">
              Thời gian làm bài: {formatDuration(contest.duration_hours || 0, contest.duration_minutes || 0)}
            </div>
          </div>
          
          <div className="p-4">
            {contest.description && (
              <div className="mb-4 text-gray-700 whitespace-pre-line">
                {contest.description}
              </div>
            )}
            
            {!isParticipant && (
              <button
                onClick={handleRegister}
                disabled={isRegistering}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
              >
                {isRegistering ? 'Đang đăng ký...' : 'Tham gia ảo'}
              </button>
            )}
          </div>
        </div>
        
        {/* Danh sách bài tập */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="flex items-center justify-between bg-gray-800 text-white p-4">
            <h2 className="text-lg font-bold">Danh sách bài</h2>
            <div className="text-white font-bold">Điểm</div>
          </div>
          
          {problems.length === 0 ? (
            <div className="p-6 text-gray-500 text-center">
              Không có bài tập nào trong kỳ thi này.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ✓
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bài
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Điểm
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {problems.map((problem, index) => (
                  <tr key={problem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {problem.solved ? (
                        <span className="text-green-500">✓</span>
                      ) : (
                        <span></span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        to={`/ky-thi/${contestId}/bai/${problem.id}`} 
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {problem.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {problem.score || problem.points || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Danh sách người tham gia */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-green-600 text-white p-4">
            <h2 className="text-lg font-bold">Người tham gia ({participants.length})</h2>
          </div>
          
          <div className="p-4">
            {participants.length === 0 ? (
              <div className="text-gray-500 text-center">
                Chưa có ai tham gia kỳ thi này.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {participants.map((participant) => (
                  <div 
                    key={participant.id} 
                    className="flex items-center gap-3 bg-gray-50 rounded-md p-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                      {participant.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="font-medium">{participant.username || participant.full_name || 'Người dùng'}</div>
                      <div className="text-xs text-gray-500">{participant.email || ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ContestDetail;