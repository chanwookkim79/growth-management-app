import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import './Breadcrumb.css';

const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  const nameMapping = {
    'add-member': '회원 등록',
    'add-data': '데이터 입력',
    'manage-members': '회원 관리',
    'dashboard': '성장 모니터링',
    'growth-prediction': '성장 예측',
    'data-backup': '데이터 백업',
    'manage-all-members': '전체 회원 관리'
  };
  
  const isHomePage = location.pathname === '/';

  if (isHomePage) {
    return null; // 홈 화면에서는 보이지 않음
  }

  return (
    <nav aria-label="breadcrumb" className="breadcrumb-container">
      <ol className="breadcrumb">
        <li className="breadcrumb-item">
          <Link to="/">Home</Link>
        </li>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const name = nameMapping[value] || value;
          const isLast = index === pathnames.length - 1;

          return isLast ? (
            <li key={to} className="breadcrumb-item active" aria-current="page">
              {name}
            </li>
          ) : (
            <li key={to} className="breadcrumb-item">
              <Link to={to}>{name}</Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb; 