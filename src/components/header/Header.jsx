import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { headerClass } from './data'
import { FiLogOut, FiUser } from 'react-icons/fi'
import authService from '../../services/authService'

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    
    // Kiểm tra trạng thái đăng nhập
    checkAuthStatus()
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [location]) // Thêm location để kiểm tra lại khi URL thay đổi

  // Hàm kiểm tra trạng thái đăng nhập
  const checkAuthStatus = () => {
    const status = authService.isAuthenticated()
    setIsAuthenticated(status)
  }

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    authService.logout()
    setIsAuthenticated(false)
    navigate('/login')
  }

  const isActive = path => location.pathname === path

  return (
    <>
      <header
        className={`${headerClass.header} ${isScrolled ? 'py-3 shadow-lg' : 'py-5 shadow-sm'} relative z-20 transition-all duration-300`}
      >
        <div className='container mx-auto flex items-center justify-between'>
          {/* logo */}
          <Link to='/' className='flex items-center'>
            <div className='relative'>
              <span className='absolute -top-2 -left-1 text-4xl'>🥛</span>
              <h1 className='ml-9 text-2xl font-extrabold tracking-wide text-blue-700 sm:text-3xl'>
                Milk<span className='text-blue-500'>Store</span>
              </h1>
            </div>
          </Link>

          {/* navigation */}
          <nav className='flex items-center space-x-8'>
            <Link
              to='/danh-sach-bai'
              className={`${headerClass.nav} ${isActive('/danh-sach-bai') ? 'font-semibold text-blue-600' : ''}`}
            >
              Danh sách bài
            </Link>
            <Link
              to='/cac-bai-da-nop'
              className={`${headerClass.nav} ${isActive('/cac-bai-da-nop') ? 'font-semibold text-blue-600' : ''}`}
            >
              Các bài đã nộp
            </Link>
            <Link
              to='/cac-ky-thi'
              className={`${headerClass.nav} ${isActive('/cac-ky-thi') ? 'font-semibold text-blue-600' : ''}`}
            >
              Các kỳ thi
            </Link>
            <Link
              to='/thong-tin-ca-nhan'
              className={`${headerClass.nav} ${isActive('/thong-tin-ca-nhan') ? 'font-semibold text-blue-600' : ''}`}
            >
              Thông tin
            </Link>
          </nav>

          {/* buttons */}
          <div className='flex items-center space-x-4'>
            {isAuthenticated ? (
              // Nếu đã đăng nhập, hiển thị nút đăng xuất
              <button 
                onClick={handleLogout}
                className='flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all'
              >
                <FiLogOut className='h-4 w-4' />
                <span>Đăng xuất</span>
              </button>
            ) : (
              // Nếu chưa đăng nhập, hiển thị nút đăng nhập và đăng ký
              <>
                <Link 
                  to='/login'
                  className='flex items-center space-x-1 px-4 py-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all'
                >
                  <FiUser className='h-4 w-4' />
                  <span>Đăng nhập</span>
                </Link>
                <Link 
                  to='/register'
                  className='flex items-center px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all'
                >
                  <span>Đăng ký</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  )
}

export default Header