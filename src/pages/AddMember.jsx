import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { db } from '../firebase/config';
import { collection, addDoc } from "firebase/firestore"; 
import './AddMember.css';

const AddMember = () => {
  const { currentUser } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState('');
  const [initialHeight, setInitialHeight] = useState('');
  const [initialWeight, setInitialWeight] = useState('');
  const [bmi, setBmi] = useState(null);

  useEffect(() => {
    if (initialHeight > 0 && initialWeight > 0) {
      const heightInMeters = initialHeight / 100;
      const bmiValue = (initialWeight / (heightInMeters * heightInMeters)).toFixed(2);
      setBmi(bmiValue);
    } else {
      setBmi(null);
    }
  }, [initialHeight, initialWeight]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !birthdate || !initialHeight || !initialWeight) {
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
        birthdate,
        gender,
        initialData: {
          height: Number(initialHeight),
          weight: Number(initialWeight),
          bmi: Number(bmi),
          date: new Date()
        },
        growthData: []
      });
      console.log("Document written with ID: ", docRef.id);
      alert(`${name}님의 정보가 성공적으로 등록되었습니다.`);
      // 폼 초기화
      setName('');
      setBirthdate('');
      setInitialHeight('');
      setInitialWeight('');
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
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="birthdate">생년월일</label>
          <input
            type="date"
            id="birthdate"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
            required
          />
        </div>
        <div className="gender-select">
          <label>성별:</label>
          <input type="radio" id="male" name="gender" value="male" onChange={(e) => setGender(e.target.value)} required />
          <label htmlFor="male">남자</label>
          <input type="radio" id="female" name="gender" value="female" onChange={(e) => setGender(e.target.value)} />
          <label htmlFor="female">여자</label>
        </div>
        <div className="form-group">
          <label htmlFor="initialHeight">초기 키 (cm)</label>
          <input
            type="number"
            id="initialHeight"
            value={initialHeight}
            onChange={(e) => setInitialHeight(e.target.value)}
            placeholder="초기 키를 숫자로 입력하세요"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="initialWeight">초기 몸무게 (kg)</label>
          <input
            type="number"
            id="initialWeight"
            value={initialWeight}
            onChange={(e) => setInitialWeight(e.target.value)}
            placeholder="초기 몸무게를 숫자로 입력하세요"
            required
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