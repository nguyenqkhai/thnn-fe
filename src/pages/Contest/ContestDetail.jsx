import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import authService from '../../services/authService';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const ContestDetail = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  
  const [contest, setContest] = useState(null);
  const [problems, setProblems] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [participantDetails, setParticipantDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Check if user is admin
  useEffect(() => {
    setIsAdmin(authService.isAdmin());
  }, []);
  
  // Fetch contest data
  useEffect(() => {
    const fetchContestData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        // Fetch current user profile if logged in
        if (token) {
          try {
            const userResponse = await axios.get(
              `${API_BASE_URL}/users/profile`,
              { headers }
            );
            setCurrentUserId(userResponse.data.id);
          } catch (userErr) {
            console.error('Error fetching user profile:', userErr);
          }
        }
        
        // Fetch contest details
        const contestResponse = await axios.get(
          `${API_BASE_URL}/contests/${contestId}`, 
          { headers }
        );
        setContest(contestResponse.data);
        
        // Process problems
        if (contestResponse.data?.problems) {
          const processedProblems = contestResponse.data.problems.map(item => ({
            id: item.id || item.problem_id,
            problem_id: item.problem_id || item.problem?.id,
            title: item.problem?.title || item.title || "No title",
            difficulty: item.problem?.difficulty || item.difficulty || "medium",
            points: item.points || 100
          }));
          setProblems(processedProblems);
        }
        
        // Fetch participants only if admin
        if (isAdmin && token) {
          try {
            const participantsResponse = await axios.get(
              `${API_BASE_URL}/contests/${contestId}/participants`,
              { headers }
            );
            
            const participantsData = participantsResponse.data || [];
            setParticipants(participantsData);
            
            // Check if current user is a participant
            if (currentUserId) {
              setIsParticipant(participantsData.some(p => p.user_id === currentUserId));
            }
            
            // Fetch participant details
            const details = {};
            for (const participant of participantsData) {
              if (participant.user_id) {
                try {
                  const userResponse = await axios.get(
                    `${API_BASE_URL}/users/${participant.user_id}`,
                    { headers }
                  );
                  details[participant.user_id] = userResponse.data;
                } catch (err) {
                  details[participant.user_id] = {
                    id: participant.user_id,
                    username: `User ${participant.user_id}`,
                    email: participant.email || ''
                  };
                }
              }
            }
            setParticipantDetails(details);
          } catch (err) {
            console.error('Error fetching participants:', err);
          }
        }
      } catch (err) {
        console.error('Error fetching contest data:', err);
        setError('Failed to load contest data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchContestData();
  }, [contestId, currentUserId, isAdmin]);
  
  const handleRegistration = async (register) => {
    try {
      setIsProcessing(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate(`/login?redirect=/ky-thi/${contestId}`);
        return;
      }
      
      const endpoint = register ? 'register' : 'unregister';
      await axios[register ? 'post' : 'delete'](
        `${API_BASE_URL}/contests/${contestId}/${endpoint}`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      setSuccessMessage(register ? 'Successfully registered!' : 'Successfully unregistered!');
      setIsParticipant(register);
      
      // Refresh participants list if admin
      if (isAdmin) {
        const res = await axios.get(
          `${API_BASE_URL}/contests/${contestId}/participants`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        setParticipants(res.data || []);
      }
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Helper functions
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? '' : 
      `${date.getDate()} Tháng ${date.getMonth() + 1}, ${date.getFullYear()}, ` +
      `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };
  
  const formatDuration = (start, end) => {
    const diff = new Date(end) - new Date(start);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours >= 24) return `${Math.floor(hours / 24)} ngày`;
    if (hours > 0 && minutes > 0) return `${hours} giờ, ${minutes} phút`;
    if (hours > 0) return `${hours} giờ`;
    return `${minutes} phút`;
  };
  
  const getContestStatus = () => {
    if (!contest) return { text: 'Unknown', class: 'bg-gray-100 text-gray-800' };
    
    const now = new Date();
    const start = new Date(contest.start_time);
    const end = new Date(contest.end_time);
    
    if (now < start) return { text: 'Sắp diễn ra', class: 'bg-blue-100 text-blue-800' };
    if (now <= end) return { text: 'Đang diễn ra', class: 'bg-green-100 text-green-800' };
    return { text: 'Đã kết thúc', class: 'bg-gray-100 text-gray-800' };
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
          <ErrorMessage message={error || 'Contest not found'} />
          <Link to="/cac-ky-thi" className="text-blue-600 hover:text-blue-800">
            ← Quay lại danh sách kỳ thi
          </Link>
        </div>
        <Footer />
      </div>
    );
  }
  
  const status = getContestStatus();
  const isActive = status.text !== 'Đã kết thúc';

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-4 flex justify-between items-center">
          <Link to="/cac-ky-thi" className="text-blue-600 hover:text-blue-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Quay lại danh sách kỳ thi
          </Link>
          
          {isAdmin && (
            <Link 
              // to={`/quanlycuocthi/${contestId}`} 
              to={`/admin/sua-ky-thi/${contestId}`}
              className="text-white bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded-md flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Chỉnh sửa kỳ thi
            </Link>
          )}
        </div>
        
        {successMessage && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{successMessage}</span>
            </div>
          </div>
        )}
        
        {/* Contest Info */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-blue-600 text-white p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">{contest.title}</h1>
                <div className="mt-2 flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.class}`}>
                    {status.text}
                  </span>
                  <span className="mx-2 text-blue-200">•</span>
                  <span className="text-blue-100">{formatDate(contest.start_time)}</span>
                </div>
                <div className="text-blue-100 mt-1">
                  Thời gian làm bài: {formatDuration(contest.start_time, contest.end_time)}
                </div>
              </div>
              
              {isActive && currentUserId && (
                <button
                  onClick={() => handleRegistration(!isParticipant)}
                  disabled={isProcessing}
                  className={`${
                    isParticipant 
                      ? "bg-red-50 text-red-600 hover:bg-red-100" 
                      : "bg-white text-blue-600 hover:bg-blue-50"
                  } font-bold py-2 px-6 rounded-md shadow-md transition-colors disabled:opacity-50`}
                >
                  {isProcessing 
                    ? 'Đang xử lý...'
                    : isParticipant 
                      ? 'Thoát khỏi kỳ thi' 
                      : 'Tham gia kỳ thi'
                  }
                </button>
              )}
            </div>
          </div>
          
          <div className="p-6">
            {contest.description && (
              <div className="prose max-w-none mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Mô tả kỳ thi</h2>
                <div className="text-gray-700 whitespace-pre-line">
                  {contest.description}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Thời gian bắt đầu</h3>
                <p className="text-gray-700">{formatDate(contest.start_time)}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Thời gian kết thúc</h3>
                <p className="text-gray-700">{formatDate(contest.end_time)}</p>
              </div>
              
              {isAdmin && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Số người tham gia</h3>
                  <p className="text-gray-700">{participants.length}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Problems List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="flex items-center justify-between bg-gray-800 text-white p-4">
            <h2 className="text-lg font-bold">Danh sách bài tập ({problems.length})</h2>
            <div className="text-white font-bold">Điểm</div>
          </div>
          
          {problems.length === 0 ? (
            <div className="p-6 text-gray-500 text-center">
              Không có bài tập nào trong kỳ thi này.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bài</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Độ khó</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Điểm</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {problems.map((problem, index) => (
                    <tr key={problem.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {problem.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          problem.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          problem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {problem.difficulty === 'easy' ? 'Dễ' : 
                           problem.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {problem.points}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link 
                          to={`/problems/${problem.problem_id}`}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md"
                        >
                          Giải bài
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Participants - Only visible to admin */}
        {isAdmin && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-green-600 text-white p-4">
              <h2 className="text-lg font-bold">Người tham gia ({participants.length})</h2>
            </div>
            
            <div className="p-4">
              {participants.length === 0 ? (
                <div className="text-gray-500 text-center p-4">
                  Chưa có ai tham gia kỳ thi này.
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {participants.map((participant) => (
                    <Link 
                      key={participant.id || participant.user_id}
                      to={`/nguoi-dung/${participant.user_id}`}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                        {(participantDetails[participant.user_id]?.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-grow">
                        <div className="font-medium text-gray-900">
                          {participantDetails[participant.user_id]?.username || `User ${participant.user_id}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {participantDetails[participant.user_id]?.email || participant.email || ''}
                        </div>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default ContestDetail;