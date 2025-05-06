import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { headerClass } from './data'
import { FiLogOut, FiUser, FiSettings, FiMenu, FiX, FiChevronDown } from 'react-icons/fi'
import authService from '../../services/authService'

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false)
  const adminMenuRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    
    // Kiểm tra trạng thái đăng nhập và quyền admin
    checkAuthStatus()
    
    // Đóng mobile menu khi chuyển trang
    setIsMobileMenuOpen(false)
    
    // Đóng admin menu khi click outside
    const handleClickOutside = (event) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) {
        setIsAdminMenuOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [location]) // Thêm location để kiểm tra lại khi URL thay đổi

  // Hàm kiểm tra trạng thái đăng nhập và quyền admin
  const checkAuthStatus = () => {
    const status = authService.isAuthenticated()
    setIsAuthenticated(status)
    setIsAdmin(authService.isAdmin && authService.isAdmin())
  }

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    authService.logout()
    setIsAuthenticated(false)
    setIsAdmin(false)
    navigate('/login')
  }

  const isActive = path => location.pathname === path || location.pathname.startsWith(path + '/')

  // Hàm toggle admin dropdown
  const toggleAdminMenu = (e) => {
    e.stopPropagation()
    setIsAdminMenuOpen(!isAdminMenuOpen)
  }

  return (
    <>
      <header
        className={`${headerClass.header} ${
          isScrolled ? 'py-2 shadow-lg bg-white' : 'py-3 shadow-sm bg-white/95'
        } sticky top-0 left-0 w-full z-50 transition-all duration-300`}
      >
        <div className='container mx-auto px-4 flex items-center justify-between'>
          {/* Logo */}
          <Link to='/' className='flex items-center group'>
            <div className='relative'>
              <h1 className='ml-9 text-xl font-extrabold tracking-wide text-blue-700 sm:text-2xl'>
                Fla<span className='text-blue-500'>Dev</span>
              </h1>
            </div>
          </Link>

          {/* Mobile menu button */}
          <button 
            className='md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors'
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <FiX className='h-6 w-6' />
            ) : (
              <FiMenu className='h-6 w-6' />
            )}
          </button>

          {/* Desktop Navigation */}
          <nav className='hidden md:flex items-center space-x-1 lg:space-x-2'>
            <NavLink to='/danh-sach-bai' isActive={isActive('/danh-sach-bai')}>
              Danh sách bài
            </NavLink>
            
            <NavLink to='/cac-bai-da-nop' isActive={isActive('/cac-bai-da-nop')}>
              Bài đã nộp
            </NavLink>
            
            <NavLink to='/cac-ky-thi' isActive={isActive('/cac-ky-thi')}>
              Kỳ thi
            </NavLink>
            
            <NavLink to='/thong-tin-ca-nhan' isActive={isActive('/thong-tin-ca-nhan')}>
              Thông tin
            </NavLink>
            
            {isAdmin && (
              <div className="relative" ref={adminMenuRef}>
                <button 
                  onClick={toggleAdminMenu}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/admin') 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FiSettings className="h-4 w-4" />
                  <span>Quản lý</span>
                  <FiChevronDown className={`h-4 w-4 transition-transform ${isAdminMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Admin dropdown menu */}
                {isAdminMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200 transition-all duration-150 ease-in-out">
                    <AdminMenuItem
                      to="/admin/quan-ly"
                      icon="⚙️"
                      title="Trang quản lý"
                      description="Xem thống kê và quản lý hệ thống"
                    />
                    <AdminMenuItem 
                      to="/admin/quan-ly-nguoi-dung" 
                      icon="👤" 
                      title="Quản lý người dùng" 
                      description="Xem và quản lý tài khoản người dùng"
                    />
                    <AdminMenuItem 
                      to="/admin/quan-ly-bai-tap" 
                      icon="📝" 
                      title="Quản lý bài tập" 
                      description="Xem, sửa, xóa bài tập trong hệ thống"
                    />
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Authentication buttons - desktop */}
          <div className='hidden md:flex items-center space-x-2'>
            {isAuthenticated ? (
              // User profile and logout
              <div className="flex items-center space-x-2">
                <div className="hidden lg:block text-right mr-2">
                  <div className="text-sm font-medium text-gray-900">
                    {authService.getUserInfo()?.username || 'User'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {isAdmin ? 'Administrator' : 'Member'}
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                  {(authService.getUserInfo()?.username || 'U').charAt(0).toUpperCase()}
                </div>
                <button 
                  onClick={handleLogout}
                  className='flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white text-red-600 hover:bg-red-50 border border-red-200 transition-all text-sm'
                >
                  <FiLogOut className='h-3.5 w-3.5' />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            ) : (
              // Login & Register buttons
              <>
                <Link 
                  to='/login'
                  className='flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 transition-all text-sm'
                >
                  <FiUser className='h-3.5 w-3.5' />
                  <span>Đăng nhập</span>
                </Link>
                <Link 
                  to='/register'
                  className='flex items-center px-3 py-1.5 rounded-lg border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 transition-all text-sm'
                >
                  <span>Đăng ký</span>
                </Link>
              </>
            )}
          </div>
        </div>
        
        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="px-2 pt-2 pb-4 space-y-1 border-t border-gray-200 bg-white">
            <MobileNavLink to='/danh-sach-bai' isActive={isActive('/danh-sach-bai')}>
              Danh sách bài
            </MobileNavLink>
            
            <MobileNavLink to='/cac-bai-da-nop' isActive={isActive('/cac-bai-da-nop')}>
              Bài đã nộp
            </MobileNavLink>
            
            <MobileNavLink to='/cac-ky-thi' isActive={isActive('/cac-ky-thi')}>
              Kỳ thi
            </MobileNavLink>
            
            <MobileNavLink to='/thong-tin-ca-nhan' isActive={isActive('/thong-tin-ca-nhan')}>
              Thông tin
            </MobileNavLink>
            
            {isAdmin && (
              <div className="pt-2 mt-2 border-t border-gray-200">
                <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Quản trị viên
                </div>
                <div className="mt-2 space-y-1">
                  <MobileNavLink to='/admin/quan-ly-nguoi-dung' isActive={isActive('/admin/quan-ly-nguoi-dung')}>
                    Quản lý người dùng
                  </MobileNavLink>
                  
                  <MobileNavLink to='/admin/quan-ly-bai-tap' isActive={isActive('/admin/quan-ly-bai-tap')}>
                    Quản lý bài tập
                  </MobileNavLink>

                  <MobileNavLink to='/admin/quan-ly' isActive={isActive('/admin/quan-ly')}>
                    Trang quản lý
                  </MobileNavLink>

                </div>
              </div>
            )}
            
            {/* Mobile authentication */}
            <div className="pt-2 mt-2 border-t border-gray-200">
              {isAuthenticated ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium mr-2">
                      {(authService.getUserInfo()?.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {authService.getUserInfo()?.username || 'User'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {isAdmin ? 'Administrator' : 'Member'}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className='flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white text-red-600 hover:bg-red-50 border border-red-200 transition-all text-sm'
                  >
                    <FiLogOut className='h-3.5 w-3.5' />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Link 
                    to='/login'
                    className='flex-1 flex justify-center items-center space-x-1 px-3 py-2 rounded-lg border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 transition-all text-sm'
                  >
                    <FiUser className='h-3.5 w-3.5 mr-1' />
                    <span>Đăng nhập</span>
                  </Link>
                  <Link 
                    to='/register'
                    className='flex-1 flex justify-center items-center px-3 py-2 rounded-lg border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 transition-all text-sm'
                  >
                    <span>Đăng ký</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  )
}

// Desktop nav link component
const NavLink = ({ to, isActive, children }) => (
  <Link
    to={to}
    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive 
        ? 'text-blue-600 bg-blue-50' 
        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
    }`}
  >
    {children}
  </Link>
)

// Mobile nav link component
const MobileNavLink = ({ to, isActive, children }) => (
  <Link
    to={to}
    className={`block px-3 py-2 rounded-md text-base font-medium ${
      isActive 
        ? 'text-blue-600 bg-blue-50' 
        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
    }`}
  >
    {children}
  </Link>
)

// Admin menu item component
const AdminMenuItem = ({ to, icon, title, description }) => (
  <Link 
    to={to} 
    className="block px-4 py-2 hover:bg-gray-50 transition-colors"
  >
    <div className="flex items-start">
      <span className="mr-3 text-lg">{icon}</span>
      <div>
        <div className="text-sm font-medium text-gray-900">{title}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
    </div>
  </Link>
)

export default Header