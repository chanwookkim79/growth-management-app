import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import './Navbar.css';
import { navLinks } from '../constants/navigation'; // 메뉴 데이터 가져오기

const Navbar = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null); // 메뉴 영역을 참조하기 위한 ref

  // 이메일로 관리자 여부 확인 (추후 role 기반으로 변경 예정)
  const isAdmin = currentUser && currentUser.email === 'chanu79@gmail.com';

  // 메뉴 바깥 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        // 클릭된 요소가 메뉴(menuRef)의 자식이 아니면 메뉴를 닫음
        const hamburgerButton = document.querySelector('.hamburger');
        if (hamburgerButton && hamburgerButton.contains(event.target)) {
          // 햄버거 버튼 자체를 클릭한 경우는 제외
          return;
        }
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // 메뉴가 열려있을 때만 이벤트 리스너 추가
      document.addEventListener('mousedown', handleClickOutside);
    }

    // cleanup 함수: 컴포넌트가 언마운트되거나 isOpen 상태가 바뀔 때 리스너 제거
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]); // isOpen 상태가 변경될 때마다 이 effect를 다시 실행

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
        <Link to="/" className="brand-title">쑥쑥노트</Link>
      </div>

      <button className="hamburger" onClick={toggleMenu}>
        &#9776; {/* Hamburger Icon */}
      </button>

      <div ref={menuRef} className={`navbar-links ${isOpen ? 'active' : ''}`}>
        {currentUser ? (
          <>
            {navLinks.map(link => {
              if (link.admin && !isAdmin) {
                return null;
              }
              return (
                <Link key={link.path} to={link.path} onClick={closeMenu}>
                  {link.name}
                </Link>
              );
            })}
            <div className="user-info">
              <span>{currentUser.email}</span>
              <button onClick={handleLogout} className="logout-btn">로그아웃</button>
            </div>
            <div className="app-version">v1.1.0</div>
          </>
        ) : (
          <>
            <Link to="/login" onClick={closeMenu}>로그인</Link>
            <Link to="/signup" onClick={closeMenu}>프로필 등록</Link>
            <div className="app-version">v1.1.0</div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 