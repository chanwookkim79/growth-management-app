import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Line } from 'react-chartjs-2';
import './GrowthPrediction.css';
// 표준 성장 데이터 import
import standardHeightMale from '../data/standard_height_male.json';
import standardHeightFemale from '../data/standard_height_female.json';


const GrowthPrediction = () => {
  const { currentUser } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [predictionPeriod, setPredictionPeriod] = useState(3);
  const [predictionResult, setPredictionResult] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);

  // 회원 목록 불러오기
  useEffect(() => {
    const fetchMembers = async () => {
      if (!currentUser) return;
      const q = query(collection(db, "members"), where("userId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      setMembers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchMembers();
  }, [currentUser]);

  const handlePredict = () => {
    if (!selectedMember) {
      alert("먼저 회원을 선택해주세요.");
      return;
    }

    const allData = [
      selectedMember.initialData,
      ...(selectedMember.growthData || [])
    ].sort((a, b) => a.date.toMillis() - b.date.toMillis());

    if (allData.length < 2) {
      alert("예측을 위한 데이터가 부족합니다. (최소 2개 이상의 기록 필요)");
      return;
    }

    setLoading(true);

    // 나이 계산 (개월 수)
    const birthDate = new Date(selectedMember.birthdate);
    const getAgeInMonths = (date) => {
      const today = new Date(date);
      let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
      months -= birthDate.getMonth();
      months += today.getMonth();
      return months <= 0 ? 0 : months;
    };

    // 데이터 포인트 생성 (x: 나이(개월), y: 값)
    const heightDataPoints = allData.map(d => ({ x: getAgeInMonths(d.date.toDate()), y: d.height }));
    const weightDataPoints = allData.map(d => ({ x: getAgeInMonths(d.date.toDate()), y: d.weight }));
    
    // 선형 회귀 함수
    const linearRegression = (data) => {
        const n = data.length;
        if (n === 0) return { slope: 0, intercept: 0 };
        let sum_x = 0, sum_y = 0, sum_xy = 0, sum_xx = 0;
        data.forEach(p => {
            sum_x += p.x;
            sum_y += p.y;
            sum_xy += p.x * p.y;
            sum_xx += p.x * p.x;
        });
        const slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
        const intercept = (sum_y - slope * sum_x) / n;
        return { slope, intercept };
    };

    const heightModel = linearRegression(heightDataPoints);
    const weightModel = linearRegression(weightDataPoints);

    const lastAge = getAgeInMonths(allData[allData.length - 1].date.toDate());
    const futureAge = lastAge + predictionPeriod;

    const predictedHeight = heightModel.slope * futureAge + heightModel.intercept;
    const predictedWeight = weightModel.slope * futureAge + weightModel.intercept;

    setPredictionResult({
        predictedHeight: predictedHeight.toFixed(1),
        predictedWeight: predictedWeight.toFixed(1),
    });

    // 표준 성장 데이터 선택
    const standardHeightData = selectedMember.gender === 'male' ? standardHeightMale : standardHeightFemale;

    // 차트 데이터 구성
    setChartData({
        labels: standardHeightData.map(d => d.age_months), // X축은 표준 데이터의 나이(개월)
        datasets: [
            {
                label: `${selectedMember.name}님의 키`,
                data: heightDataPoints, // {x, y} 객체의 배열
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                type: 'scatter',
                pointRadius: 5,
            },
            {
                label: '표준 키 (50th)',
                data: standardHeightData.map(d => ({ x: d.age_months, y: d.height_cm })),
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                type: 'line',
                pointRadius: 0,
                borderWidth: 2,
            }
        ]
    });

    setLoading(false);
  };

  const chartOptions = {
    scales: {
        x: {
            type: 'linear',
            position: 'bottom',
            title: {
                display: true,
                text: '나이 (개월)'
            }
        },
        y: {
            title: {
                display: true,
                text: '키 (cm)'
            }
        }
    },
    plugins: {
        legend: {
            position: 'top',
        },
        title: {
            display: true,
            text: '성장 곡선 비교'
        }
    }
  };

  return (
    <div className="growth-prediction-container">
      <div className="prediction-controls">
        <select onChange={(e) => {
            const member = members.find(m => m.id === e.target.value);
            setSelectedMember(member);
            setPredictionResult(null); // 멤버 변경 시 예측 결과 초기화
            setChartData(null); // 멤버 변경 시 차트 초기화
        }} defaultValue="">
          <option value="" disabled>-- 회원을 선택하세요 --</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.name} ({m.gender === 'male' ? '남' : '여'})</option>
          ))}
        </select>
        <select onChange={(e) => setPredictionPeriod(Number(e.target.value))} value={predictionPeriod}>
          <option value={3}>3개월 후</option>
          <option value={6}>6개월 후</option>
          <option value={12}>1년 후</option>
        </select>
        <button onClick={handlePredict} disabled={loading || !selectedMember}>
          {loading ? '분석 중...' : '결과 보기'}
        </button>
      </div>

      {predictionResult && (
        <div className="prediction-result">
          <h3>예측 결과</h3>
          <p><strong>{predictionPeriod}개월 후 예상 키:</strong> {predictionResult.predictedHeight} cm</p>
          <p><strong>{predictionPeriod}개월 후 예상 몸무게:</strong> {predictionResult.predictedWeight} kg</p>
        </div>
      )}

      {chartData && (
          <div className="chart-container">
              <Line options={chartOptions} data={chartData} />
          </div>
      )}
    </div>
  );
};

export default GrowthPrediction; 