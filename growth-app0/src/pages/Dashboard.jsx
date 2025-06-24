import { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const location = useLocation();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [pivotedTableData, setPivotedTableData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 현재 로그인한 사용자의 프로필 목록을 불러옵니다.
  useEffect(() => {
    if (!currentUser) return;
    
    setLoading(true);
    const fetchMembers = async () => {
      const q = query(collection(db, "members"), where("userId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      const membersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(membersList);
      
      // 다른 페이지에서 전달받은 memberId가 있으면 해당 프로필을 기본으로 선택
      if (location.state?.memberId) {
        setSelectedMemberId(location.state.memberId);
      }
      setLoading(false);
    };

    fetchMembers();
  }, [currentUser, location.state]);

  // 선택된 프로필의 데이터를 가공하여 차트와 테이블 데이터를 만듭니다.
  useEffect(() => {
    if (!selectedMemberId) {
      setPivotedTableData(null);
      setChartData(null);
      return;
    }

    const member = members.find(m => m.id === selectedMemberId);
    if (!member) return;

    const allData = [
      member.initialData,
      ...(member.growthData || [])
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
      bmiValues.push(parseFloat(data.bmi).toFixed(1));

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
  }, [selectedMemberId, members]);
  
  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: {
        display: false,
        text: '',
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
    setSelectedMemberId(memberId);
  };

  const renderChange = (value) => {
    if (value === '-') return <span>-</span>;
    const num = parseFloat(value);
    if (num > 0) return <span className="change-up">▲ {num}</span>;
    if (num < 0) return <span className="change-down">▼ {Math.abs(num)}</span>;
    return <span>-</span>;
  };

  const getBmiEvaluation = (bmi) => {
    if (bmi < 18.5) return <span style={{ color: '#f39c12' }}>저체중</span>;
    if (bmi < 23) return <span style={{ color: '#2ecc71' }}>정상</span>;
    if (bmi < 25) return <span style={{ color: '#e67e22' }}>과체중</span>;
    if (bmi < 30) return <span style={{ color: '#d35400' }}>경도 비만</span>;
    if (bmi >= 30) return <span style={{ color: '#c0392b' }}>중등도 비만</span>;
    return '';
  };

  if (loading) return <p>프로필 목록을 불러오는 중...</p>;

  return (
    <div className="dashboard-container">
      <div className="controls-container">
        <div className="member-select-container">
          <label htmlFor="member-select">프로필 선택</label>
          <select
            id="member-select"
            value={selectedMemberId || ''}
            onChange={handleMemberChange}
            className="form-control member-select-dropdown"
            required
          >
            <option value="" disabled>-- 프로필을 선택하세요 --</option>
            {members.map(member => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedMemberId && (
        <div className="content-container">
          <div className="chart-container">
            {chartData ? <Bar options={chartOptions} data={chartData} /> : <p>차트 데이터를 불러오는 중...</p>}
          </div>
          <div className="data-table-container">
            {pivotedTableData ? (
              <div className="table-wrapper">
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
                            {metric.label.includes('변화') ? (
                              renderChange(value)
                            ) : metric.label === 'BMI' ? (
                              <>
                                {value} ({getBmiEvaluation(value)})
                              </>
                            ) : (
                              value
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p>표시할 데이터가 없습니다.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 