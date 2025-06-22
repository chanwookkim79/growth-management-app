import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './GrowthPrediction.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const GrowthPrediction = () => {
  const { currentUser } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predictionType, setPredictionType] = useState('height'); // 'height' or 'weight'

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

  // 성장 예측 계산 함수
  const calculatePrediction = (member) => {
    const allData = [
      member.initialData,
      ...(member.growthData || [])
    ].sort((a, b) => a.date.toMillis() - b.date.toMillis());

    if (allData.length < 2) {
      return null;
    }

    // 나이 계산 (생년월일 기준)
    const birthDate = new Date(member.dob);
    const currentDate = new Date();
    const ageInYears = (currentDate - birthDate) / (1000 * 60 * 60 * 24 * 365.25);

    // 데이터 포인트들을 나이와 함께 정리
    const dataPoints = allData.map(data => {
      const dataDate = new Date(data.date.seconds * 1000);
      const ageAtData = (dataDate - birthDate) / (1000 * 60 * 60 * 24 * 365.25);
      return {
        age: ageAtData,
        height: data.height,
        weight: data.weight
      };
    });

    // 선형 회귀를 사용한 예측
    const predictValue = (dataPoints, targetAge, type) => {
      if (dataPoints.length < 2) return null;

      // 최근 3개 데이터 포인트 사용 (더 정확한 예측을 위해)
      const recentData = dataPoints.slice(-3);
      
      // 선형 회귀 계산
      const n = recentData.length;
      const sumX = recentData.reduce((sum, point) => sum + point.age, 0);
      const sumY = recentData.reduce((sum, point) => sum + point[type], 0);
      const sumXY = recentData.reduce((sum, point) => sum + point.age * point[type], 0);
      const sumXX = recentData.reduce((sum, point) => sum + point.age * point.age, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      return slope * targetAge + intercept;
    };

    // 향후 1년간의 예측 데이터 생성
    const predictions = [];
    const currentAge = ageInYears;
    
    for (let i = 0; i <= 12; i++) {
      const futureAge = currentAge + (i / 12); // 월별로 예측
      const predictedHeight = predictValue(dataPoints, futureAge, 'height');
      const predictedWeight = predictValue(dataPoints, futureAge, 'weight');
      
      if (predictedHeight && predictedWeight) {
        predictions.push({
          age: futureAge,
          height: Math.max(0, predictedHeight), // 음수 방지
          weight: Math.max(0, predictedWeight), // 음수 방지
          date: new Date(birthDate.getTime() + futureAge * 365.25 * 24 * 60 * 60 * 1000)
        });
      }
    }

    return {
      historical: dataPoints,
      predictions: predictions,
      currentAge: ageInYears
    };
  };

  useEffect(() => {
    if (!selectedMember) {
      setPredictionData(null);
      return;
    }

    const prediction = calculatePrediction(selectedMember);
    setPredictionData(prediction);
  }, [selectedMember, predictionType]);

  const handleMemberChange = (e) => {
    const memberId = e.target.value;
    const member = members.find(m => m.id === memberId);
    setSelectedMember(member || null);
  };

  const getChartData = () => {
    if (!predictionData) return null;

    const historicalLabels = predictionData.historical.map(d => 
      `${d.age.toFixed(1)}세`
    );
    const predictionLabels = predictionData.predictions.map(d => 
      `${d.age.toFixed(1)}세`
    );

    const historicalValues = predictionData.historical.map(d => 
      predictionType === 'height' ? d.height : d.weight
    );
    const predictionValues = predictionData.predictions.map(d => 
      predictionType === 'height' ? d.height : d.weight
    );

    return {
      labels: [...historicalLabels, ...predictionLabels],
      datasets: [
        {
          label: `실제 ${predictionType === 'height' ? '키' : '몸무게'}`,
          data: [...historicalValues, ...Array(predictionValues.length).fill(null)],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          pointBackgroundColor: 'rgb(75, 192, 192)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        },
        {
          label: `예측 ${predictionType === 'height' ? '키' : '몸무게'}`,
          data: [...Array(historicalValues.length).fill(null), ...predictionValues],
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderDash: [5, 5],
          pointBackgroundColor: 'rgb(255, 99, 132)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(255, 99, 132)',
          tension: 0.1
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: selectedMember ? 
          `${selectedMember.name}님의 ${predictionType === 'height' ? '키' : '몸무게'} 예측` : 
          '회원을 선택해주세요',
        font: { size: 18 }
      },
      legend: { position: 'top' }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: predictionType === 'height' ? '키 (cm)' : '몸무게 (kg)'
        }
      },
      x: {
        title: {
          display: true,
          text: '나이 (세)'
        }
      }
    }
  };

  const getPredictionSummary = () => {
    if (!predictionData || predictionData.predictions.length === 0) return null;

    const current = predictionData.predictions[0];
    const oneYearLater = predictionData.predictions[predictionData.predictions.length - 1];
    
    const heightChange = predictionType === 'height' ? 
      (oneYearLater.height - current.height).toFixed(1) : null;
    const weightChange = predictionType === 'weight' ? 
      (oneYearLater.weight - current.weight).toFixed(1) : null;

    return {
      current: current,
      oneYearLater: oneYearLater,
      change: heightChange || weightChange
    };
  };

  if (loading) return <p>회원 목록을 불러오는 중...</p>;

  return (
    <div className="prediction-container">
      <h2>성장 예측</h2>
      
      <div className="controls">
        <div className="member-selector">
          <label htmlFor="member-select">회원 선택: </label>
          <select id="member-select" onChange={handleMemberChange} defaultValue="">
            <option value="" disabled>-- 회원을 선택하세요 --</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        
        <div className="prediction-type-selector">
          <label>예측 유형: </label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                value="height"
                checked={predictionType === 'height'}
                onChange={(e) => setPredictionType(e.target.value)}
              />
              키
            </label>
            <label>
              <input
                type="radio"
                value="weight"
                checked={predictionType === 'weight'}
                onChange={(e) => setPredictionType(e.target.value)}
              />
              몸무게
            </label>
          </div>
        </div>
      </div>

      {selectedMember && predictionData ? (
        <>
          <div className="prediction-summary">
            <h3>예측 요약</h3>
            <div className="summary-cards">
              <div className="summary-card">
                <h4>현재 ({predictionData.currentAge.toFixed(1)}세)</h4>
                <p className="value">
                  {predictionType === 'height' ? 
                    `${predictionData.predictions[0].height.toFixed(1)}cm` : 
                    `${predictionData.predictions[0].weight.toFixed(1)}kg`
                  }
                </p>
              </div>
              <div className="summary-card">
                <h4>1년 후 ({(predictionData.currentAge + 1).toFixed(1)}세)</h4>
                <p className="value">
                  {predictionType === 'height' ? 
                    `${predictionData.predictions[predictionData.predictions.length - 1].height.toFixed(1)}cm` : 
                    `${predictionData.predictions[predictionData.predictions.length - 1].weight.toFixed(1)}kg`
                  }
                </p>
              </div>
              <div className="summary-card">
                <h4>예상 변화</h4>
                <p className="value change">
                  {(() => {
                    const summary = getPredictionSummary();
                    if (!summary) return '-';
                    const change = summary.change;
                    const isPositive = parseFloat(change) > 0;
                    return (
                      <span className={isPositive ? 'positive' : 'negative'}>
                        {isPositive ? '+' : ''}{change}
                        {predictionType === 'height' ? 'cm' : 'kg'}
                      </span>
                    );
                  })()}
                </p>
              </div>
            </div>
          </div>

          <div className="chart-container">
            {getChartData() && <Line options={chartOptions} data={getChartData()} />}
          </div>

          <div className="prediction-table">
            <h3>상세 예측 데이터</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>나이</th>
                    <th>예측 {predictionType === 'height' ? '키' : '몸무게'}</th>
                    <th>예상 날짜</th>
                  </tr>
                </thead>
                <tbody>
                  {predictionData.predictions.map((pred, index) => (
                    <tr key={index}>
                      <td>{pred.age.toFixed(1)}세</td>
                      <td>
                        {predictionType === 'height' ? 
                          `${pred.height.toFixed(1)}cm` : 
                          `${pred.weight.toFixed(1)}kg`
                        }
                      </td>
                      <td>{pred.date.toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <p className="selection-prompt">회원을 선택하면 성장 예측을 볼 수 있습니다.</p>
      )}
    </div>
  );
};

export default GrowthPrediction; 