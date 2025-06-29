import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import './DataBackup.css';
import '../styles/form-styles.css';

const DataBackup = () => {
  const { currentUser } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backupStatus, setBackupStatus] = useState('');
  const [restoreStatus, setRestoreStatus] = useState('');

  useEffect(() => {
    const fetchMembers = async () => {
      if (!currentUser) return;
      try {
        const q = query(collection(db, "members"), where("userId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        const membersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMembers(membersList);
      } catch (error) {
        console.error("Error fetching members: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [currentUser]);

  // 데이터 백업 함수
  const handleBackup = async () => {
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (members.length === 0) {
      alert('백업할 데이터가 없습니다.');
      return;
    }

    setBackupStatus('백업 중...');
    
    try {
      // 백업 데이터 준비
      const allMembersData = [];
      for (const member of members) {
        const formattedData = {
          ...member,
          initialData: {
            ...member.initialData,
            date: format(member.initialData.date.toDate(), 'yyyy-MM-dd HH:mm:ss')
          },
          growthData: member.growthData.map(d => ({
            ...d,
            date: format(d.date.toDate(), 'yyyy-MM-dd HH:mm:ss')
          }))
        };
        allMembersData.push(formattedData);
      }

      const backupData = {
        userId: currentUser.uid,
        timestamp: new Date().toISOString(),
        version: '1.0',
        members: allMembersData.map(member => ({
          ...member,
          id: member.id // ID도 포함
        }))
      };

      // JSON 파일로 다운로드
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `growth-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setBackupStatus('백업이 완료되었습니다!');
      setTimeout(() => setBackupStatus(''), 3000);
    } catch (error) {
      console.error('Backup failed:', error);
      setBackupStatus('백업에 실패했습니다.');
      setTimeout(() => setBackupStatus(''), 3000);
    }
  };

  // 데이터 복원 함수
  const handleRestore = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    setRestoreStatus('복원 중...');

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      // 백업 데이터 검증
      if (!backupData.members || !Array.isArray(backupData.members)) {
        throw new Error('잘못된 백업 파일입니다.');
      }

      if (backupData.userId !== currentUser.uid) {
        throw new Error('다른 사용자의 백업 파일입니다.');
      }

      // 기존 데이터 삭제 확인
      if (members.length > 0) {
        const confirmDelete = window.confirm(
          '기존 데이터가 있습니다. 복원하면 기존 데이터가 모두 삭제됩니다. 계속하시겠습니까?'
        );
        if (!confirmDelete) {
          setRestoreStatus('');
          return;
        }

        // 기존 데이터 삭제
        for (const member of members) {
          await deleteDoc(doc(db, "members", member.id));
        }
      }

      // 백업 데이터 복원
      for (const memberData of backupData.members) {
        const { id, ...memberWithoutId } = memberData;
        await addDoc(collection(db, "members"), {
          ...memberWithoutId,
          userId: currentUser.uid
        });
      }

      setRestoreStatus('복원이 완료되었습니다!');
      setTimeout(() => setRestoreStatus(''), 3000);
      
      // 페이지 새로고침
      window.location.reload();
    } catch (error) {
      console.error('Restore failed:', error);
      setRestoreStatus(`복원에 실패했습니다: ${error.message}`);
      setTimeout(() => setRestoreStatus(''), 5000);
    }
  };

  // 데이터 내보내기 (CSV 형식)
  const handleExportCSV = async () => {
    if (!currentUser || members.length === 0) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }

    try {
      let csvContent = '이름,생년월일,기록일,키(cm),몸무게(kg),BMI\n';
      
      members.forEach(member => {
        // 초기 데이터
        const initialDate = new Date(member.initialData.date.seconds * 1000).toLocaleDateString();
        csvContent += `${member.name},${member.dob},${initialDate},${member.initialData.height},${member.initialData.weight},${member.initialData.bmi}\n`;
        
        // 성장 데이터
        if (member.growthData) {
          member.growthData.forEach(data => {
            const dataDate = new Date(data.date.seconds * 1000).toLocaleDateString();
            csvContent += `${member.name},${member.dob},${dataDate},${data.height},${data.weight},${data.bmi}\n`;
          });
        }
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `growth-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('CSV export failed:', error);
      alert('CSV 내보내기에 실패했습니다.');
    }
  };

  if (loading) return <p>데이터를 불러오는 중...</p>;

  return (
    <div className="common-card-container">
      <div className="common-card-content">
        <h2>데이터 백업/복원</h2>
        <div className="backup-actions-vertical">
          <button onClick={handleBackup} className="common-form-button" disabled={members.length === 0}>
            JSON 백업
          </button>
          {backupStatus && <p className="status-message">{backupStatus}</p>}
          <label htmlFor="restore" className="common-form-button" style={{marginTop: '1rem'}}>복원</label>
          <input type="file" id="restore" onChange={handleRestore} style={{ display: 'none' }} accept=".json" />
          {restoreStatus && <p className="status-message">{restoreStatus}</p>}
          <button onClick={handleExportCSV} className="common-form-button" style={{marginTop: '1rem'}} disabled={members.length === 0}>
            CSV 내보내기
          </button>
        </div>
        <div className="backup-info-compact">
          <p>프로필: <strong>{members.length}</strong>개</p>
          <p style={{fontSize: '0.95rem', color: '#888'}}>정기 백업을 권장합니다.</p>
        </div>
      </div>
    </div>
  );
};

export default DataBackup; 