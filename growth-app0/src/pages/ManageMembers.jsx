import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { format, differenceInMonths, parseISO } from 'date-fns';
import './ManageMembers.css';
import { useAlert } from '../context/AlertContext';

const ManageMembers = () => {
  const { currentUser } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 수정 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', dob: '', gender: '' });

  // 삭제 모달 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchMembers = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const q = query(collection(db, "members"), where("userId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      const membersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(membersList.sort((a, b) => a.name.localeCompare(b.name))); // 이름순으로 정렬
    } catch (error) {
      console.error("Error fetching members: ", error);
      showAlert('회원 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, [currentUser]);

  // 삭제 버튼 클릭 시 모달 오픈
  const handleDeleteClick = (member) => {
    setDeleteTarget(member);
    setShowDeleteModal(true);
  };

  // 삭제 확인
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, "members", deleteTarget.id));
      showAlert('회원이 삭제되었습니다.');
      fetchMembers();
    } catch (error) {
      console.error("Error deleting document: ", error);
      showAlert('회원 삭제에 실패했습니다.');
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  // 삭제 취소
  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };
  
  // 수정 버튼 클릭 시 모달 열기
  const handleEditClick = (member) => {
    setSelectedMember(member);
    setEditForm({ name: member.name, dob: member.dob, gender: member.gender });
    setIsModalOpen(true);
  };
  
  // 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMember(null);
  };

  // 정보 수정 제출
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const memberDocRef = doc(db, "members", selectedMember.id);
      await updateDoc(memberDocRef, {
        name: editForm.name,
        dob: editForm.dob,
        gender: editForm.gender,
      });
      showAlert('회원 정보가 수정되었습니다.');
      closeModal();
      fetchMembers();
    } catch (error) {
      console.error("Error updating document: ", error);
      showAlert('정보 수정에 실패했습니다.');
    }
  };

  // 성장 기록 데이터 가공 (변화량 계산)
  const getProcessedGrowthData = (member) => {
    if (!member) return [];
    const allData = [...[member.initialData], ...(member.growthData || [])]
      .sort((a, b) => a.date.toMillis() - b.date.toMillis());

    return allData.map((data, index) => {
      let heightChange = '-';
      let weightChange = '-';
      if (index > 0) {
        heightChange = (data.height - allData[index - 1].height).toFixed(1);
        weightChange = (data.weight - allData[index - 1].weight).toFixed(1);
      }
      return { ...data, heightChange, weightChange };
    });
  };

  // 인라인 기록 삭제
  const handleRecordDelete = async (recordToDelete) => {
    if (!window.confirm(`${format(recordToDelete.date.toDate(), 'yyyy-MM-dd')}일자 기록을 삭제하시겠습니까?`)) {
      return;
    }
    
    try {
      const updatedGrowthData = selectedMember.growthData.filter(
        record => record.date.toMillis() !== recordToDelete.date.toMillis()
      );
      
      const memberDocRef = doc(db, "members", selectedMember.id);
      await updateDoc(memberDocRef, {
        growthData: updatedGrowthData
      });

      // Update the state locally to reflect changes immediately
      const updatedMember = { ...selectedMember, growthData: updatedGrowthData };
      setSelectedMember(updatedMember);
      
      // Update the main members list as well
      setMembers(prevMembers => prevMembers.map(m => m.id === updatedMember.id ? updatedMember : m));

      showAlert('기록이 삭제되었습니다.');
    } catch (error) {
      console.error("Error deleting record: ", error);
      showAlert('기록 삭제에 실패했습니다.');
    }
  };

  // 변화량 렌더링 함수
  const renderChange = (value, type) => {
    if (value === '-' || value === null || isNaN(parseFloat(value))) return <span>-</span>;
    const num = parseFloat(value);
    if (num === 0) return <span>-</span>;

    const isIncrease = num > 0;
    const symbol = isIncrease ? '▲' : '▼';
    
    let className = '';
    if (type === 'height') {
      // 키: 증가는 녹색(up), 감소는 빨간색(down)
      className = isIncrease ? 'change-up' : 'change-down';
    } else if (type === 'weight') {
      // 몸무게: 증가는 빨간색(down), 감소는 녹색(up)
      className = isIncrease ? 'change-down' : 'change-up';
    }

    return <span className={className}>{symbol} {Math.abs(num)}</span>;
  };

  if (loading) return <div>회원 목록을 불러오는 중...</div>;

  return (
    <div className="manage-members-container">
      {/* 삭제 확인 모달 */}
      {showDeleteModal && deleteTarget && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ marginBottom: '1.5rem', fontWeight: 500 }}>
              '{deleteTarget.name}' 회원을 정말로 삭제하시겠습니까?
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="action-btn delete-btn" onClick={handleDeleteConfirm}>예</button>
              <button className="action-btn cancel-btn" onClick={handleDeleteCancel}>아니오</button>
            </div>
          </div>
        </div>
      )}
      {/* 회원 정보 수정 모달 */}
      {isModalOpen && selectedMember && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{selectedMember.name}님 정보 수정</h2>
            
            <form onSubmit={handleEditSubmit} className="modal-form-container">
              <div className="modal-section">
                
                <div className="edit-form-grid">
                  <div className="form-group">
                    <label>이름</label>
                    <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>생년월일</label>
                    <input type="date" value={editForm.dob} onChange={(e) => setEditForm({...editForm, dob: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>성별</label>
                    <div className="radio-buttons">
                      <label><input type="radio" value="male" checked={editForm.gender === 'male'} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })} /> 남</label>
                      <label><input type="radio" value="female" checked={editForm.gender === 'female'} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })} /> 여</label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <h3>전체 성장 기록</h3>
                <div className="growth-history-table">
                  <table>
                    <thead>
                      <tr>
                        <th>측정일</th>
                        <th>키(cm) (변화)</th>
                        <th>몸무게(kg) (변화)</th>
                        <th>BMI</th>
                        <th>비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getProcessedGrowthData(selectedMember).map((record, index) => (
                        <tr key={record.date.toMillis()}>
                          <td>{format(record.date.toDate(), 'yyyy-MM-dd')}</td>
                          <td>{record.height} cm ({renderChange(record.heightChange, 'height')})</td>
                          <td>{record.weight} kg ({renderChange(record.weightChange, 'weight')})</td>
                          <td>{parseFloat(record.bmi).toFixed(1)}</td>
                          <td className="actions-cell">
                            {record.date.toMillis() !== selectedMember.initialData.date.toMillis() ? (
                              <button type="button" onClick={() => handleRecordDelete(record)} className="inline-btn delete-btn">삭제</button>
                            ) : (
                              <span>-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-actions-bottom">
                <button type="submit" className="action-btn save-btn">저장</button>
                <button type="button" onClick={closeModal} className="action-btn cancel-btn">취소</button>
              </div>
            </form>
            <button onClick={closeModal} className="modal-close-btn">&times;</button>
          </div>
        </div>
      )}

      {/* 회원 목록 테이블 */}
      {members.length > 0 ? (
        <div className="table-responsive">
          <table className="members-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>생년월일</th>
                <th>개월 수 (나이)</th>
                <th>성별</th>
                <th>등록일</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <tr key={member.id}>
                  <td>{member.name}</td>
                  <td>{member.dob}</td>
                  <td>{`${differenceInMonths(new Date(), parseISO(member.dob))}개월`}</td>
                  <td>{member.gender === 'male' ? '남' : '여'}</td>
                  <td>
                    {member.createdAt 
                      ? format(member.createdAt.toDate(), 'yyyy-MM-dd') 
                      : (member.initialData?.date 
                          ? format(member.initialData.date.toDate(), 'yyyy-MM-dd')
                          : 'N/A')
                    }
                  </td>
                  <td className="actions-cell">
                    <button onClick={() => handleEditClick(member)} className="action-btn edit-btn">수정</button>
                    <button onClick={() => handleDeleteClick(member)} className="action-btn delete-btn">삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="no-members-message">등록된 회원이 없습니다.</p>
      )}
    </div>
  );
};

export default ManageMembers; 