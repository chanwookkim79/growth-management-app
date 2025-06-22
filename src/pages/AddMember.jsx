import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { db } from '../firebase/config';
import { collection, addDoc } from "firebase/firestore"; 
import './AddMember.css';
import { useNavigate } from 'react-router-dom';

const AddMember = () => {
  const { currentUser } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !dob || !gender || !height || !weight) {
      alert('모든 필드를 입력해주세요.');
      return;
    }
    setLoading(true);

    const heightInMeters = Number(height) / 100;
    const bmiValue = (Number(weight) / (heightInMeters * heightInMeters)).toFixed(2);

    try {
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
      alert('회원이 성공적으로 등록되었습니다.');
      navigate('/manage-members');
    } catch (error) {
      console.error("Error adding member: ", error);
      alert('회원 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-member-container">
      <form onSubmit={handleSubmit} className="add-member-form">
        <h2>회원 등록</h2>
        <div className="form-group">
          <label htmlFor="name">이름</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-control"
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
            className="form-control"
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
            className="form-control"
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
            className="form-control"
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? '등록 중...' : '회원 등록'}
        </button>
      </form>
    </div>
  );
};

export default AddMember; 