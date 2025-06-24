import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="main-image-wrapper">
        <img src="/suksuknote-main.png" alt="쑥쑥노트 대표 이미지" className="main-image" />
      </div>
    </div>
  );
};

export default Home; 