import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import './ManageMembers.css'; // 기존 스타일 재사용

const ManageAllMembers = () => {
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllMembers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'members'));
        const membersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllMembers(membersList);
      } catch (err) {
        console.error("Error fetching all members: ", err);
        setError("전체 회원 정보를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllMembers();
  }, []);

  if (loading) {
    return <div>전체 회원 목록을 불러오는 중...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="manage-members-container">
      {allMembers.length > 0 ? (
        <ul className="members-list">
          {allMembers.map(member => (
            <li key={member.id} className="member-item">
              <div className="member-info">
                <strong>{member.name}</strong>
                <span>생년월일: {member.birthdate}</span>
              </div>
              {/* 수정/삭제 버튼 등 관리 기능은 여기에 추가됩니다. */}
            </li>
          ))}
        </ul>
      ) : (
        <p>등록된 회원이 없습니다.</p>
      )}
    </div>
  );
};

export default ManageAllMembers; 