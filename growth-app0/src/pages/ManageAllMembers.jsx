import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { format, differenceInMonths, parseISO } from 'date-fns';
import './ManageMembers.css'; // 기존 스타일 재사용

const ManageAllMembers = () => {
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllMembers = async () => {
      try {
        // 1. 모든 사용자 정보 가져오기 (userId -> email 매핑용)
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const userMap = {};
        usersSnapshot.forEach(doc => {
          userMap[doc.id] = doc.data().email;
        });

        // 2. 모든 회원 정보 가져오기
        const membersSnapshot = await getDocs(collection(db, 'members'));
        const membersList = membersSnapshot.docs
          .map(doc => {
            const memberData = doc.data();
            return {
              id: doc.id,
              ...memberData,
              // 3. 이메일 정보 추가
              userEmail: userMap[memberData.userId] || 'N/A',
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name)); // 이름순 정렬
        
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
    return <div className="manage-members-container">전체 회원 목록을 불러오는 중...</div>;
  }

  if (error) {
    return <div className="manage-members-container">{error}</div>;
  }

  return (
    <div className="manage-members-container">
      <h2>전체 회원 관리</h2>
      {allMembers.length > 0 ? (
        <div className="table-responsive">
          <table className="members-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>생년월일</th>
                <th>개월 수 (나이)</th>
                <th>성별</th>
                <th>등록일</th>
                <th>가입자 이메일</th>
              </tr>
            </thead>
            <tbody>
              {allMembers.map(member => (
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
                  <td>{member.userEmail}</td>
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

export default ManageAllMembers;