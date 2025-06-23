import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>성장 다이어리</h1>
        <p className="subtitle">
          하루하루 소중한 우리 아이의 성장을 기록하고,
          <br />
          차트로 확인하며 미래를 예측해보세요.
        </p>
        <Link to="/add-member" className="cta-button">
          내 아이 프로필 만들고 시작하기
        </Link>
      </header>

      <main className="features-section">
        <h2>주요 기능</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>✍️ 간편한 성장 기록</h3>
            <p>날짜별 키와 몸무게를 손쉽게 추가하고 BMI 변화를 자동으로 추적합니다.</p>
          </div>
          <div className="feature-card">
            <h3>📊 한눈에 보는 성장 차트</h3>
            <p>기록된 데이터를 시각적인 차트로 비교하며 성장 과정을 한눈에 파악할 수 있습니다.</p>
          </div>
          <div className="feature-card">
            <h3>📈 성장 예측</h3>
            <p>축적된 데이터를 기반으로 아이의 미래 예상 신장을 과학적으로 예측해 봅니다.</p>
          </div>
          <div className="feature-card">
            <h3>👥 여러 프로필 관리</h3>
            <p>자녀가 여러 명이어도 걱정 없이, 각 아이의 프로필을 따로 만들어 관리할 수 있습니다.</p>
          </div>
          <div className="feature-card">
            <h3>🔒 안전한 데이터 관리</h3>
            <p>소중한 성장 기록을 JSON, CSV 파일로 백업하고 언제든지 복원할 수 있습니다.</p>
          </div>
          <div className="feature-card">
            <h3>📱 반응형 디자인</h3>
            <p>PC, 태블릿, 스마트폰 등 어떤 기기에서도 최적화된 화면으로 이용하세요.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home; 