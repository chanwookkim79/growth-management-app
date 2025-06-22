import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import './ManageMembers.css';

const ManageMembers = () => {
  const { currentUser } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    dob: '',
    height: '',
    weight: ''
  });

  const fetchMembers = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const q = query(collection(db, "members"), where("userId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      const membersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(membersList);
    } catch (error) {
      console.error("Error fetching members: ", error);
      alert('회원 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [currentUser]);

  const handleDelete = async (memberId, memberName) => {
    if (window.confirm(`'${memberName}' 회원을 정말로 삭제하시겠습니까? 모든 관련 데이터가 영구적으로 삭제됩니다.`)) {
      try {
        await deleteDoc(doc(db, "members", memberId));
        alert('회원이 성공적으로 삭제되었습니다.');
        fetchMembers();
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert('회원 삭제에 실패했습니다.');
      }
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setEditForm({
      name: member.name,
      dob: member.dob,
      height: member.initialData.height.toString(),
      weight: member.initialData.weight.toString()
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.dob || !editForm.height || !editForm.weight) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      const heightInMeters = Number(editForm.height) / 100;
      const bmiValue = (Number(editForm.weight) / (heightInMeters * heightInMeters)).toFixed(2);
      
      const memberDocRef = doc(db, "members", editingMember.id);
      await updateDoc(memberDocRef, {
        name: editForm.name,
        dob: editForm.dob,
        initialData: {
          height: Number(editForm.height),
          weight: Number(editForm.weight),
          bmi: Number(bmiValue),
          date: editingMember.initialData.date
        }
      });

      alert('회원 정보가 성공적으로 수정되었습니다.');
      setEditingMember(null);
      setEditForm({ name: '', dob: '', height: '', weight: '' });
      fetchMembers();
    } catch (error) {
      console.error("Error updating document: ", error);
      alert('회원 정보 수정에 실패했습니다.');
    }
  };

  const handleCancelEdit = () => {
    setEditingMember(null);
    setEditForm({ name: '', dob: '', height: '', weight: '' });
  };

  const getMemberStats = (member) => {
    const allData = [
      member.initialData,
      ...(member.growthData || [])
    ].sort((a, b) => a.date.toMillis() - b.date.toMillis());
    
    if (allData.length === 0) return null;
    
    const latest = allData[allData.length - 1];
    const first = allData[0];
    
    return {
      totalRecords: allData.length,
      heightChange: (latest.height - first.height).toFixed(1),
      weightChange: (latest.weight - first.weight).toFixed(1),
      latestDate: new Date(latest.date.seconds * 1000).toLocaleDateString()
    };
  };

  if (loading) {
    return <div>회원 목록을 불러오는 중...</div>;
  }

  return (
    <div className="manage-members-container">
      {members.length > 0 ? (
        <ul className="members-list">
          {members.map(member => (
            <li key={member.id} className="member-item">
              {editingMember?.id === member.id ? (
                // 수정 모드
                <form onSubmit={handleEditSubmit} className="edit-form">
                  <div className="edit-form-row">
                    <div className="form-group">
                      <label>이름</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>생년월일</label>
                      <input
                        type="date"
                        value={editForm.dob}
                        onChange={(e) => setEditForm({...editForm, dob: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="edit-form-row">
                    <div className="form-group">
                      <label>키 (cm)</label>
                      <input
                        type="number"
                        value={editForm.height}
                        onChange={(e) => setEditForm({...editForm, height: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>몸무게 (kg)</label>
                      <input
                        type="number"
                        value={editForm.weight}
                        onChange={(e) => setEditForm({...editForm, weight: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="edit-actions">
                    <button type="submit" className="action-btn save-btn">저장</button>
                    <button type="button" onClick={handleCancelEdit} className="action-btn cancel-btn">취소</button>
                  </div>
                </form>
              ) : (
                // 일반 모드
                <>
                  <div className="member-info">
                    <div className="member-basic">
                      <span className="member-name">{member.name}</span>
                      <span className="member-dob">생년월일: {member.dob}</span>
                    </div>
                    <div className="member-stats">
                      {(() => {
                        const stats = getMemberStats(member);
                        return stats ? (
                          <>
                            <span>총 기록: {stats.totalRecords}회</span>
                            <span>키 변화: {stats.heightChange}cm</span>
                            <span>몸무게 변화: {stats.weightChange}kg</span>
                            <span>최근 기록: {stats.latestDate}</span>
                          </>
                        ) : (
                          <span>기록 없음</span>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="member-actions">
                    <button onClick={() => handleEdit(member)} className="action-btn edit-btn">수정</button>
                    <button onClick={() => handleDelete(member.id, member.name)} className="action-btn delete-btn">삭제</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>등록된 회원이 없습니다. '회원 등록' 메뉴에서 새로운 회원을 추가하세요.</p>
      )}
    </div>
  );
};

export default ManageMembers; 