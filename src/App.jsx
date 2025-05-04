import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import authService from './services/authService';
import ProblemList from './pages/ProblemList/ProblemList';
import ProblemDetail from './pages/ProblemDetail/ProblemDetail';
// Bảo vệ tuyến đường yêu cầu xác thực
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    // Chuyển hướng đến trang đăng nhập nếu chưa xác thực
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  
  if (isAuthenticated) {
    return <Navigate to="/danh-sach-bai" replace />;
  }
  
  return children;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          authService.isAuthenticated() ? 
            <Navigate to="/danh-sach-bai" replace /> : 
            <Navigate to="/login" replace /> // Thay đổi từ "/login" -> "/danh-sach-bai"
        } />
        
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        
        {/* Thay đổi từ ProtectedRoute sang để mọi người đều xem được */}
        <Route path="/danh-sach-bai" element={<ProblemList />} />
        
        {/* Các route được bảo vệ khác */}
        <Route path="/cac-bai-da-nop" element={
          <ProtectedRoute>
            <div>Trang các bài đã nộp</div>
          </ProtectedRoute>
        } />
        
        <Route path="/cac-ky-thi" element={
          <ProtectedRoute>
            <div>Trang kỳ thi</div>
          </ProtectedRoute>
        } />
        
        <Route path="/thong-tin-ca-nhan" element={
          <ProtectedRoute>
            <div>Trang thông tin cá nhân</div>
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/problems/:id" element={<ProblemDetail />} />
      </Routes>
    </Router>
  );
};

export default App;