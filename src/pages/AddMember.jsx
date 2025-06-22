import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { db } from '../firebase/config';
import { collection, addDoc } from "firebase/firestore"; 
import './AddMember.css';

const AddMember = () => {
  const { currentUser } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState(null);

  useEffect(() => {
    if (height > 0 && weight > 0) {
      const heightInMeters = height / 100;
      const bmiValue = (weight / (heightInMeters * heightInMeters)).toFixed(2);
      setBmi(bmiValue);
    } else {
      setBmi(null);
    }
  }, [height, weight]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !dob || !height || !weight) {
      alert('모든 필드를 입력해주세요.');
      return;
    }
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }
    try {
      const docRef = await addDoc(collection(db, "members"), {
        userId: currentUser.uid,
        name,
        dob,
        initialData: {
          height: Number(height),
          weight: Number(weight),
          bmi: Number(bmi),
          date: new Date()
        },
        growthData: []
      });
      console.log("Document written with ID: ", docRef.id);
      alert(`${name}님의 정보가 성공적으로 등록되었습니다.`);
      // 폼 초기화
      setName('');
      setDob('');
      setHeight('');
      setWeight('');
    } catch (error) {
      console.error("Error adding document: ", error);
      alert('데이터 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="form-container">
      <h2>회원 정보 등록</h2>
      <form onSubmit={handleSubmit} className="member-form">
        <div className="form-group">
          <label htmlFor="name">이름</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력하세요"
          />
        </div>
        <div className="form-group">
          <label htmlFor="dob">생년월일</label>
          <input
            type="date"
            id="dob"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="height">현재 키 (cm)</label>
          <input
            type="number"
            id="height"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="키를 숫자로 입력하세요"
          />
        </div>
        <div className="form-group">
          <label htmlFor="weight">현재 몸무게 (kg)</label>
          <input
            type="number"
            id="weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="몸무게를 숫자로 입력하세요"
          />
        </div>
        {bmi && (
          <div className="form-group">
            <label>BMI</label>
            <p className="bmi-result">{bmi}</p>
          </div>
        )}
        <button type="submit" className="submit-btn">등록하기</button>
      </form>
    </div>
  );
};

export default AddMember; 