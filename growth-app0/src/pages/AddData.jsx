import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc, arrayUnion, query, where } from 'firebase/firestore';
import './AddData.css'; // AddData.css를 import 합니다.
import '../styles/form-styles.css';
import { useAlert } from '../context/AlertContext';

const AddData = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showAlert } = useAlert();

  // 컴포넌트가 처음 렌더링될 때 Firestore에서 프로필 목록을 가져옵니다.
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
        showAlert('프로필 목록을 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [currentUser]);

  // 키와 몸무게가 변경될 때마다 BMI를 다시 계산합니다.
  useEffect(() => {
    if (height > 0 && weight > 0) {
      const heightInMeters = height / 100;
      const calculatedBmi = weight / (heightInMeters * heightInMeters);
      setBmi(calculatedBmi);
    } else {
      setBmi(null);
    }
  }, [height, weight]);

  const handleFormReset = () => {
    // Reset logic for the form
    setSelectedMember('');
    setHeight('');
    setWeight('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!selectedMember || !height || !weight) {
      showAlert('프로필을 선택하고 키와 몸무게를 모두 입력해주세요.');
      setLoading(false);
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
      showAlert('성장 기록이 성공적으로 추가되었습니다.');
      setIsModalOpen(true);
      navigate('/', { state: { memberId: selectedMember } });
    } catch (error) {
      console.error("Error updating document: ", error);
      showAlert('성장 기록 추가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleModalResponse = (goToDashboard) => {
    const lastSelectedMemberId = selectedMember; // Reset 전에 ID 저장
    setIsModalOpen(false);
    handleFormReset();
    if (goToDashboard) {
      // state를 통해 대시보드로 프로필 ID 전달
      navigate('/dashboard', { state: { memberId: lastSelectedMemberId } });
    }
  };

  if (loading) {
    return <p>프로필 목록을 불러오는 중...</p>;
  }

  return (
    <div className="add-data-container">
      <form className="add-data-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="member-select">프로필 선택</label>
          <select id="member-select" value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)} className="form-control" required>
            <option value="">-- 프로필을 선택하세요 --</option>
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
            name="height"
            className="form-input"
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
            name="weight"
            className="form-input"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="몸무게를 숫자로 입력하세요"
          />
        </div>
        {bmi !== null && (
          <div className="bmi-display">
            <p>BMI: {bmi.toFixed(1)}</p>
          </div>
        )}
        <div className="button-container">
          <button type="submit" className="submit-btn" disabled={!selectedMember || !height || !weight || loading}>
            {loading ? '입력 중...' : '데이터 입력'}
          </button>
        </div>
      </form>
      
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>데이터 입력 완료</h3>
            <p>모니터링 화면으로 이동하시겠습니까?</p>
            <div className="modal-actions">
              <button onClick={() => handleModalResponse(true)} className="action-btn save-btn">Yes</button>
              <button onClick={() => handleModalResponse(false)} className="action-btn cancel-btn">No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddData; 