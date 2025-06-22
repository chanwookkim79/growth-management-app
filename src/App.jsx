import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';

// Context and Components
import { AuthContext } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Breadcrumb from './components/Breadcrumb.jsx';

// Page Components
import Home from './pages/Home.jsx';
import AddMember from './pages/AddMember.jsx';
import AddData from './pages/AddData.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ManageMembers from './pages/ManageMembers.jsx';
import GrowthPrediction from './pages/GrowthPrediction.jsx';
import DataBackup from './pages/DataBackup.jsx';
import ManageAllMembers from './pages/ManageAllMembers.jsx';

// 보호된 라우트를 위한 래퍼 컴포넌트
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  if (!currentUser) {
    // 로그인하지 않았으면 로그인 페이지로 리다이렉트
    return <Navigate to="/login" />;
  }
  return children;
};

function App() {
  const { currentUser } = useContext(AuthContext);

  return (
    <BrowserRouter>
      <Navbar />
      <Breadcrumb />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={currentUser ? <Navigate to="/" /> : <Login />} />
          <Route path="/signup" element={currentUser ? <Navigate to="/" /> : <Signup />} />
          
          {/* 아래 페이지들은 로그인이 필요한 보호된 라우트입니다. */}
          <Route 
            path="/add-member" 
            element={
              <ProtectedRoute>
                <AddMember />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/add-data" 
            element={
              <ProtectedRoute>
                <AddData />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manage-members"
            element={
              <ProtectedRoute>
                <ManageMembers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/growth-prediction" 
            element={
              <ProtectedRoute>
                <GrowthPrediction />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/data-backup" 
            element={
              <ProtectedRoute>
                <DataBackup />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manage-all-members" 
            element={
              <ProtectedRoute>
                <ManageAllMembers />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
