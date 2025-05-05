import React from 'react';
import { Link } from 'react-router-dom';

const SolvedProblems = ({ problems, loading, className = '' }) => {
  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  // Get difficulty text
  const getDifficultyText = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'Dễ';
      case 'medium': return 'Trung bình';
      case 'hard': return 'Khó';
      default: return difficulty;
    }
  };
  
  return (
    <div className={`bg-white p-6 rounded-lg border border-gray-200 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Bài tập đã giải ({problems.length})
      </h3>
      
      {loading ? (
        <div className="py-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : problems.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          <p>Bạn chưa giải được bài tập nào</p>
          <Link
            to="/danh-sach-bai"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-200"
          >
            Giải bài tập ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {problems.map((problem) => (
            <div key={problem.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100">
              <div>
                <Link 
                  to={`/problems/${problem.id}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {problem.title}
                </Link>
                <p className={`text-xs ${getDifficultyColor(problem.difficulty)}`}>
                  {getDifficultyText(problem.difficulty)}
                </p>
              </div>
              <Link 
                to={`/problems/${problem.id}`}
                className="px-3 py-1 text-sm text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
              >
                Xem lại
              </Link>
            </div>
          ))}
          
          {problems.length > 5 && (
            <div className="text-center mt-4">
              <Link 
                to="/danh-sach-bai" 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Xem tất cả bài tập
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SolvedProblems;