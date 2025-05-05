import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import authService from './services/authService';
import ProblemList from './pages/ProblemList/ProblemList';
import ProblemDetail from './pages/ProblemDetail/ProblemDetail';
import SubmissionList from './pages/Submission/SubmissionList';
import AddProblem from './pages/Admin/AddProblem';
import ManageProblems from './pages/Admin/ManageProblems';
import EditProblem from './pages/Admin/EditProblem';
import UserManagement from './pages/Admin/UserManagement';
import UserProfile from './pages/Profile/UserProfile';
import AdminProfile from './pages/Profile/AdminProfile';

// Bảo vệ tuyến đường chỉ dành cho người dùng đã đăng nhập
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    // Chuyển hướng đến trang đăng nhập nếu chưa xác thực
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Bảo vệ tuyến đường chỉ dành cho admin
const AdminRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  const isAdmin = authService.isAdmin();
  
  if (!isAuthenticated) {
    // Chuyển hướng đến trang đăng nhập nếu chưa xác thực
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin) {
    // Chuyển hướng đến trang danh sách bài tập nếu không phải admin
    return <Navigate to="/danh-sach-bai" replace />;
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
            <Navigate to="/login" replace />
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
        
        {/* Route thêm bài tập - chỉ admin mới thêm được */}
        <Route path="/admin/them-bai-tap" element={
          <AdminRoute>
            <AddProblem />
          </AdminRoute>
        } />
        
        {/* Các route khác */}
        <Route path="/problems/:id" element={<ProblemDetail />} />
        
        <Route path="/bai-nop" element={
          <ProtectedRoute>
            <SubmissionList />
          </ProtectedRoute>
        } />
        
        <Route path="/cac-bai-da-nop" element={<SubmissionList />} />
        
        <Route path="/cac-ky-thi" element={
          <ProtectedRoute>
            <div>Trang kỳ thi</div>
          </ProtectedRoute>
        } />
        
        {/* Updated User Profile Routes */}
        <Route path="/thong-tin-ca-nhan" element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/thong-tin-ca-nhan" element={
          <AdminRoute>
            <AdminProfile />
          </AdminRoute>
        } />
        
        <Route path="/admin/quan-ly-bai-tap" element={
          <AdminRoute>
            <ManageProblems />
          </AdminRoute>
        } />
        
        <Route path="/admin/quan-ly-nguoi-dung" element={
          <AdminRoute>
            <UserManagement />
          </AdminRoute>
        } />
        
        <Route path="/admin/sua-bai-tap/:id" element={
          <AdminRoute>
            <EditProblem />
          </AdminRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;