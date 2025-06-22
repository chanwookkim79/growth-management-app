import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { format } from 'date-fns';
import './Dashboard.css';

// Vercel 재배포를 위한 주석
// Chart.js에 필요한 요소들을 등록합니다.
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [pivotedTableData, setPivotedTableData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 현재 로그인한 사용자의 회원 목록을 불러옵니다.
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

  // 선택된 회원의 데이터를 가공하여 차트와 테이블 데이터를 만듭니다.
  useEffect(() => {
    if (!selectedMember) {
      setChartData(null);
      setPivotedTableData(null);
      return;
    }

    const allData = [
      selectedMember.initialData,
      ...(selectedMember.growthData || [])
    ].sort((a, b) => a.date.toMillis() - b.date.toMillis());

    if (allData.length === 0) {
        setPivotedTableData(null);
        setChartData(null);
        return;
    }
    
    // Pivoted Table 데이터 생성
    const dates = [];
    const heightValues = [];
    const weightValues = [];
    const bmiValues = [];
    const heightChanges = [];
    const weightChanges = [];

    allData.forEach((data, index) => {
      dates.push(format(new Date(data.date.seconds * 1000), 'yyyy-MM-dd'));
      heightValues.push(data.height);
      weightValues.push(data.weight);
      bmiValues.push(data.bmi);

      if (index === 0) {
        heightChanges.push('-');
        weightChanges.push('-');
      } else {
        const heightChange = (data.height - allData[index - 1].height).toFixed(1);
        const weightChange = (data.weight - allData[index - 1].weight).toFixed(1);
        heightChanges.push(heightChange);
        weightChanges.push(weightChange);
      }
    });

    setPivotedTableData({
      dates,
      metrics: [
        { label: '키 (cm)', values: heightValues },
        { label: '몸무게 (kg)', values: weightValues },
        { label: 'BMI', values: bmiValues },
        { label: '키 변화', values: heightChanges },
        { label: '몸무게 변화', values: weightChanges },
      ]
    });

    // 차트 데이터 생성
    setChartData({
      labels: allData.map(d => format(new Date(d.date.seconds * 1000), 'yyyy-MM-dd')),
      datasets: [
        {
          type: 'line',
          label: '키 (cm)',
          data: allData.map(d => d.height),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          yAxisID: 'y_height',
          tension: 0.1
        },
        {
          type: 'bar',
          label: '몸무게 (kg)',
          data: allData.map(d => d.weight),
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          yAxisID: 'y_weight',
        },
      ],
    });
  }, [selectedMember]);
  
  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: selectedMember ? `${selectedMember.name}님의 성장 기록` : '회원을 선택해주세요',
        font: { size: 18 }
      },
      legend: { position: 'top' }
    },
    scales: {
      y_height: {
        type: 'linear',
        display: true,
        position: 'left',
        title: { display: true, text: '키 (cm)' }
      },
      y_weight: {
        type: 'linear',
        display: true,
        position: 'right',
        title: { display: true, text: '몸무게 (kg)' },
        grid: { drawOnChartArea: false }
      },
    }
  };


  const handleMemberChange = (e) => {
    const memberId = e.target.value;
    const member = members.find(m => m.id === memberId);
    setSelectedMember(member || null);
  };

  const renderChange = (value) => {
    if (value === '-') return <span>-</span>;
    const num = parseFloat(value);
    if (num > 0) return <span className="change-up">▲ {num}</span>;
    if (num < 0) return <span className="change-down">▼ {Math.abs(num)}</span>;
    return <span>-</span>;
  };

  if (loading) return <p>회원 목록을 불러오는 중...</p>;

  return (
    <div className="dashboard-container">
      <div className="member-selector-container">
        <label htmlFor="member-select">회원 선택: </label>
        <select id="member-select" onChange={handleMemberChange} defaultValue="">
          <option value="" disabled>-- 회원을 선택하세요 --</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {selectedMember ? (
        <>
          <div className="chart-container">
            {chartData && <Bar options={chartOptions} data={chartData} />}
          </div>
          <div className="table-wrapper">
            <h3>상세 기록</h3>
            {pivotedTableData ? (
              <div className="table-container">
                <table className="growth-table">
                  <thead>
                    <tr>
                      <th>항목</th>
                      {pivotedTableData.dates.map(date => <th key={date}>{date}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {pivotedTableData.metrics.map(metric => (
                      <tr key={metric.label}>
                        <td>{metric.label}</td>
                        {metric.values.map((value, index) => (
                          <td key={index}>
                            {metric.label.includes('변화') ? renderChange(value) : value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p>표시할 데이터가 없습니다.</p>}
          </div>
        </>
      ) : (
        <p className="selection-prompt">회원을 선택하면 성장 기록을 볼 수 있습니다.</p>
      )}
    </div>
  );
};

export default Dashboard; 