import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import './Breadcrumb.css';
import { navLinks } from '../constants/navigation';

const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  const nameMapping = navLinks.reduce((acc, link) => {
    // '/add-member' -> 'add-member'
    const key = link.path.substring(1); 
    acc[key] = link.name;
    return acc;
  }, {});
  
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