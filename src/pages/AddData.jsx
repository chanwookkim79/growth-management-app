import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc, arrayUnion, query, where } from 'firebase/firestore';
import './AddData.css'; // AddData.css를 import 합니다.

const AddData = () => {
  const { currentUser } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState(null);
  const [loading, setLoading] = useState(true);

  // 컴포넌트가 처음 렌더링될 때 Firestore에서 회원 목록을 가져옵니다.
  useEffect(() => {
    const fetchMembers = async () => {
      if (!currentUser) return;
      try {
        const q = query(collection(db, "members"), where("userId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        const membersList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMembers(membersList);
      } catch (error) {
        console.error("Error fetching members: ", error);
        alert('회원 목록을 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [currentUser]);

  // 키 또는 몸무게가 변경될 때마다 BMI를 다시 계산합니다.
  useEffect(() => {
    if (height > 0 && weight > 0) {
      const heightInMeters = height / 100;
      const bmiValue = (weight / (heightInMeters * heightInMeters)).toFixed(2);
      setBmi(bmiValue);
    } else {
      setBmi(null);
    }
  }, [height, weight]);

  // 폼 제출 시 실행될 함수
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMember || !height || !weight) {
      alert('회원을 선택하고 키와 몸무게를 모두 입력해주세요.');
      return;
    }
    try {
      const memberDocRef = doc(db, "members", selectedMember);
      await updateDoc(memberDocRef, {
        growthData: arrayUnion({
          height: Number(height),
          weight: Number(weight),
          bmi: Number(bmi),
          date: new Date()
        })
      });
      alert('데이터가 성공적으로 추가되었습니다.');
      // 폼 초기화
      setSelectedMember('');
      setHeight('');
      setWeight('');
    } catch (error) {
      console.error("Error updating document: ", error);
      alert('데이터 업데이트에 실패했습니다.');
    }
  };

  if (loading) {
    return <p>회원 목록을 불러오는 중...</p>;
  }

  return (
    <div className="form-container">
      <h2>키/몸무게 추가 입력</h2>
      <form onSubmit={handleSubmit} className="data-form">
        <div className="form-group">
          <label htmlFor="member-select">회원 선택</label>
          <select 
            id="member-select" 
            value={selectedMember} 
            onChange={(e) => setSelectedMember(e.target.value)}
          >
            <option value="">-- 회원을 선택하세요 --</option>
            {members.map(member => (
              <option key={member.id} value={member.id}>
                {member.name} (생년월일: {member.dob})
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="height">키 (cm)</label>
          <input
            type="number"
            id="height"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="키를 숫자로 입력하세요"
          />
        </div>
        <div className="form-group">
          <label htmlFor="weight">몸무게 (kg)</label>
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
        <button type="submit" className="submit-btn">데이터 추가</button>
      </form>
    </div>
  );
};

export default AddData; 