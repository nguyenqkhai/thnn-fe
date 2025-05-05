import React from 'react';

const ProfileStats = ({ stats, className = '' }) => {
  return (
    <div className={`bg-blue-50 p-4 rounded-lg ${className}`}>
      <h3 className="text-md font-semibold text-blue-800 mb-2">Thống kê</h3>
      <div className="space-y-2">
        {stats.totalSubmissions !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tổng số bài nộp:</span>
            <span className="font-medium">{stats.totalSubmissions}</span>
          </div>
        )}
        
        {stats.acceptedSubmissions !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Số bài nộp đúng:</span>
            <span className="font-medium text-green-600">{stats.acceptedSubmissions}</span>
          </div>
        )}
        
        {stats.totalSubmissions !== undefined && stats.acceptedSubmissions !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tỷ lệ đúng:</span>
            <span className="font-medium">
              {stats.totalSubmissions > 0 
                ? `${Math.round((stats.acceptedSubmissions / stats.totalSubmissions) * 100)}%` 
                : '0%'}
            </span>
          </div>
        )}
        
        {stats.solvedProblems !== undefined && stats.totalProblems !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Bài tập đã giải:</span>
            <span className="font-medium">
              {stats.solvedProblems}/{stats.totalProblems}
            </span>
          </div>
        )}
        
        {stats.rating !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Điểm xếp hạng:</span>
            <span className="font-medium">{stats.rating}</span>
          </div>
        )}
        
        {stats.rank !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Xếp hạng:</span>
            <span className="font-medium">{stats.rank}</span>
          </div>
        )}
        
        {/* Admin specific stats */}
        {stats.totalUsers !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tổng số người dùng:</span>
            <span className="font-medium">{stats.totalUsers}</span>
          </div>
        )}
        
        {stats.totalProblems !== undefined && stats.totalUsers === undefined && stats.solvedProblems === undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tổng số bài tập:</span>
            <span className="font-medium">{stats.totalProblems}</span>
          </div>
        )}
        
        {stats.activeContests !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Cuộc thi đang diễn ra:</span>
            <span className="font-medium">{stats.activeContests}</span>
          </div>
        )}
        
        {stats.pendingSubmissions !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Bài nộp đang chờ:</span>
            <span className="font-medium">{stats.pendingSubmissions}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileStats;