import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { format, differenceInMonths, parseISO } from 'date-fns';
import './ManageMembers.css'; // 기존 스타일 재사용

const ManageAllMembers = () => {
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAllMembers = async () => {
      try {
        // 1. users 컬렉션에서 모든 사용자 ID 가져오기 (실제 앱에서는 관리자 권한 확인 필요)
        // const usersSnapshot = await getDocs(collection(db, "users"));
        // const userIds = usersSnapshot.docs.map(doc => doc.id);

        // 2. 모든 프로필 정보 가져오기
        // Firestore 'members' 컬렉션의 모든 문서를 가져옵니다.
        const membersSnapshot = await getDocs(collection(db, "members"));
        const membersList = membersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setAllMembers(membersList);
      } catch (err) {
        console.error("Error fetching all members:", err);
        setError("전체 프로필 정보를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllMembers();
  }, []);

  if (loading) {
    return <div className="manage-members-container">전체 프로필 목록을 불러오는 중...</div>;
  }

  if (error) {
    return <div className="manage-members-container"><p className="error-message">{error}</p></div>;
  }

  return (
    <div className="manage-members-container">
      <h2>전체 프로필 관리</h2>
      <div className="table-responsive">
        <table className="members-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>생년월일</th>
              <th>성별</th>
              <th>등록자 UID</th>
              <th>등록일</th>
            </tr>
          </thead>
          <tbody>
            {allMembers.map(member => (
              <tr key={member.id}>
                <td>{member.name}</td>
                <td>{member.dob}</td>
                <td>{member.gender === 'male' ? '남' : '여'}</td>
                <td title={member.userId}>{member.userId.substring(0, 10)}...</td>
                <td>{member.initialData.date ? format(member.initialData.date.toDate(), 'yyyy-MM-dd') : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {allMembers.length === 0 && (
        <p className="no-members-message">등록된 프로필이 없습니다.</p>
      )}
    </div>
  );
};

export default ManageAllMembers;