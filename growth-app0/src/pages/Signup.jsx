import { useState } from 'react';
import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './AuthForm.css'; // 공통 스타일 사용
import { useAlert } from '../context/AlertContext';
import '../styles/form-styles.css';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // 비밀번호 일치 확인
      if (password !== confirmPassword) {
        showAlert('비밀번호가 일치하지 않습니다.');
        return;
      }
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const user = res.user;

      // Firestore의 'users' 컬렉션에 사용자 정보 저장
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        createdAt: new Date(),
      });

      // 프로필 등록 성공 시 홈으로 이동
      showAlert('프로필 등록이 완료되었습니다.');
      navigate('/');
    } catch (err) {
      console.error("Signup Error:", err);
      setError('프로필 등록에 실패했습니다. 이메일 또는 비밀번호를 확인해주세요.');
      showAlert('프로필 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="common-card-container" style={{maxWidth: '1050px', padding: '4.5rem'}}>
      <form className="common-card-content" onSubmit={handleSubmit} style={{fontSize: '1.65rem'}}>
        <h2 style={{fontSize: '2.25rem', marginBottom: '3rem'}}>프로필 등록</h2>
        <div className="common-form-group">
          <label htmlFor="email" className="common-form-label" style={{fontSize: '1.2rem'}}>이메일</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="common-form-input"
            style={{fontSize: '1.5rem', padding: '18px'}}
            required
          />
        </div>
        <div className="common-form-group">
          <label htmlFor="password" className="common-form-label" style={{fontSize: '1.2rem'}}>비밀번호 (6자리 이상)</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="common-form-input"
            style={{fontSize: '1.5rem', padding: '18px'}}
            required
          />
        </div>
        <div className="common-form-group">
          <label htmlFor="confirm-password" className="common-form-label" style={{fontSize: '1.2rem'}}>비밀번호 확인</label>
          <input
            type="password"
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="common-form-input"
            style={{fontSize: '1.5rem', padding: '18px'}}
            required
          />
        </div>
        {error && <p className="error-message" style={{fontSize: '1.2rem'}}>{error}</p>}
        <button type="submit" className="common-form-button" style={{fontSize: '1.65rem', padding: '18px'}} disabled={loading}>가입하기</button>
      </form>
    </div>
  );
};

export default Signup; 