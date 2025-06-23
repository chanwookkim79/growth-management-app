import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore"; 
import './AddMember.css';
import { useNavigate } from 'react-router-dom';
import '../styles/form-styles.css';
import { useAlert } from '../context/AlertContext';

const AddMember = () => {
  const { currentUser } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !dob || !gender || !height || !weight) {
      showAlert('모든 필드를 입력해주세요.');
      return;
    }
    setLoading(true);

    try {
      // 동일 이름 체크
      const q = query(collection(db, "members"), where("userId", "==", currentUser.uid), where("name", "==", name));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        showAlert('이미 동일한 이름의 프로필이 존재합니다.');
        setLoading(false);
        return;
      }

      const heightInMeters = Number(height) / 100;
      const bmiValue = (Number(weight) / (heightInMeters * heightInMeters)).toFixed(2);

      await addDoc(collection(db, "members"), {
        userId: currentUser.uid,
        name,
        dob,
        gender,
        initialData: {
          date: new Date(),
          height: Number(height),
          weight: Number(weight),
          bmi: Number(bmiValue)
        },
        growthData: []
      });
      showAlert('프로필이 성공적으로 추가되었습니다.');
      navigate('/manage-members');
    } catch (error) {
      console.error("Error adding member: ", error);
      showAlert('프로필 추가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-member-container">
      <form onSubmit={handleSubmit} className="add-member-form">
        <h2>프로필 추가</h2>
        <div className="form-group">
          <label htmlFor="name">이름</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="dob">생년월일</label>
          <input
            id="dob"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="form-input"
            required
          />
        </div>
        <div className="form-group">
          <label>성별</label>
          <div className="radio-buttons">
            <label>
              <input
                type="radio"
                value="male"
                checked={gender === 'male'}
                onChange={(e) => setGender(e.target.value)}
                required
              />
              남
            </label>
            <label>
              <input
                type="radio"
                value="female"
                checked={gender === 'female'}
                onChange={(e) => setGender(e.target.value)}
                required
              />
              여
            </label>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="height">키 (cm)</label>
          <input
            id="height"
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="form-input"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="weight">몸무게 (kg)</label>
          <input
            id="weight"
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="form-input"
            required
          />
        </div>
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? '등록 중...' : '등록'}
        </button>
      </form>
    </div>
  );
};

export default AddMember; 