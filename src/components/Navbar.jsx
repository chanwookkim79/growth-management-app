import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import './Navbar.css';

const Navbar = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
      alert('로그아웃에 실패했습니다.');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">성장 관리</Link>
      </div>
      <div className="navbar-links">
        {currentUser ? (
          <>
            <Link to="/add-member">회원 등록</Link>
            <Link to="/add-data">데이터 입력</Link>
            <Link to="/manage-members">회원 관리</Link>
            <Link to="/dashboard">모니터링</Link>
            <Link to="/growth-prediction">성장 예측</Link>
            <Link to="/data-backup">데이터 백업</Link>
            <div className="user-info">
              <span>{currentUser.email}</span>
              <button onClick={handleLogout} className="logout-btn">로그아웃</button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login">로그인</Link>
            <Link to="/signup">회원가입</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 