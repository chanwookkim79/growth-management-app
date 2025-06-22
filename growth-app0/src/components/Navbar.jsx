import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import './Navbar.css';

const Navbar = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // 이메일로 관리자 여부 확인 (추후 role 기반으로 변경 예정)
  const isAdmin = currentUser && currentUser.email === 'chanu79@gmail.com';

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsOpen(false); // Close menu on logout
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
      alert('로그아웃에 실패했습니다.');
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" onClick={closeMenu}>성장 관리</Link>
      </div>

      <button className="hamburger" onClick={toggleMenu}>
        &#9776; {/* Hamburger Icon */}
      </button>

      <div className={`navbar-links ${isOpen ? 'active' : ''}`}>
        {currentUser ? (
          <>
            <Link to="/add-member" onClick={closeMenu}>회원 등록</Link>
            <Link to="/add-data" onClick={closeMenu}>데이터 입력</Link>
            <Link to="/manage-members" onClick={closeMenu}>회원 관리</Link>
            <Link to="/dashboard" onClick={closeMenu}>모니터링</Link>
            <Link to="/growth-prediction" onClick={closeMenu}>성장 예측</Link>
            <Link to="/data-backup" onClick={closeMenu}>데이터 백업</Link>
            {isAdmin && (
              <Link to="/manage-all-members" onClick={closeMenu}>전체 회원 관리</Link>
            )}
            <div className="user-info">
              <span>{currentUser.email}</span>
              <button onClick={handleLogout} className="logout-btn">로그아웃</button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" onClick={closeMenu}>로그인</Link>
            <Link to="/signup" onClick={closeMenu}>회원가입</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 