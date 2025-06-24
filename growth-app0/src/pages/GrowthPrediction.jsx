import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Line } from 'react-chartjs-2';
import './GrowthPrediction.css';
import '../styles/form-styles.css';
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
  const [errorMsg, setErrorMsg] = useState("");

  // 프로필 목록 불러오기
  useEffect(() => {
    if (!currentUser) return;
    const fetchMembers = async () => {
        const q = query(collection(db, "members"), where("userId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
      setMembers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchMembers();
  }, [currentUser]);

  const handlePredict = (memberParam) => {
    const member = memberParam || selectedMember;
    setErrorMsg("");
    if (!member) {
      setErrorMsg("먼저 프로필을 선택해주세요.");
      setPredictionResult(null);
      setChartData(null);
      return;
    }
    try {
      // height/weight 값이 모두 있는 데이터만 필터링
      const allData = [
        member.initialData,
        ...(member.growthData || [])
      ].filter(d => d && d.height != null && d.weight != null && d.date)
       .sort((a, b) => {
         const aDate = a.date && a.date.toDate ? a.date.toDate() : new Date(a.date);
         const bDate = b.date && b.date.toDate ? b.date.toDate() : new Date(b.date);
         return aDate - bDate;
       });

      if (allData.length < 2) {
        setErrorMsg("예측을 위한 성장 기록이 2개 이상 필요합니다.<br />(키, 몸무게, 날짜가 모두 입력된 기록만 반영됩니다)");
        setPredictionResult(null);
        setChartData(null);
        return;
      }

      setLoading(true);

      // 나이 계산 (개월 수)
      const birthDate = new Date(member.dob);
      const getAgeInMonths = (date) => {
        const today = new Date(date);
        let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
        months -= birthDate.getMonth();
        months += today.getMonth();
        return months <= 0 ? 0 : months;
      };

      // 데이터 포인트 생성 (x: 나이(개월), y: 값)
      const heightDataPoints = allData.map(d => ({ x: getAgeInMonths(d.date && d.date.toDate ? d.date.toDate() : new Date(d.date)), y: d.height }));
      const weightDataPoints = allData.map(d => ({ x: getAgeInMonths(d.date && d.date.toDate ? d.date.toDate() : new Date(d.date)), y: d.weight }));

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

      const lastAge = getAgeInMonths(allData[allData.length - 1].date && allData[allData.length - 1].date.toDate ? allData[allData.length - 1].date.toDate() : new Date(allData[allData.length - 1].date));
      const futureAge = lastAge + predictionPeriod;

      const predictedHeight = heightModel.slope * futureAge + heightModel.intercept;
      const predictedWeight = weightModel.slope * futureAge + weightModel.intercept;

      setPredictionResult({
          predictedHeight: predictedHeight.toFixed(1),
          predictedWeight: predictedWeight.toFixed(1),
      });

      // 표준 성장 데이터 선택
      const standardHeightData = member.gender === 'male' ? standardHeightMale : standardHeightFemale;

      // 차트 데이터 구성
      setChartData({
          labels: standardHeightData.map(d => d.age_months), // X축은 표준 데이터의 나이(개월)
        datasets: [
          {
                  label: `${member.name}님의 키`,
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
    } catch (err) {
      setErrorMsg("데이터를 불러오거나 처리하는 중 오류가 발생했습니다. 성장 기록, 생년월일, 성별, 날짜 형식 등을 확인해주세요.");
      setPredictionResult(null);
      setChartData(null);
      setLoading(false);
    }
  };

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
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
            display: false
        }
    }
  };

  return (
    <div className="common-card-container">
      <div className="common-card-content">
        <div className="common-form-group">
          <label className="common-form-label">프로필 선택</label>
          <select
            className="common-form-select"
            onChange={(e) => {
              const member = members.find(m => m.id === e.target.value);
              setSelectedMember(member);
              setPredictionResult(null);
              setChartData(null);
              if (member) handlePredict(member);
            }}
            defaultValue=""
            required
          >
            <option value="" disabled>-- 프로필을 선택하세요 --</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.gender === 'male' ? '남' : '여'})</option>
            ))}
          </select>
        </div>
        
        {/* 예측 결과 카드 삭제됨 */}

        {chartData ? (
          <div className="chart-card" style={{height: '60vw', minHeight: 420, maxHeight: 600}}>
            <Line options={chartOptions} data={chartData} />
          </div>
        ) : (
          <div className="chart-card chart-card-empty" style={{height: '60vw', minHeight: 420, maxHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 18}}>
            {errorMsg ? <span dangerouslySetInnerHTML={{__html: errorMsg}} /> : '프로필을 선택하면 성장 그래프가 표시됩니다.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default GrowthPrediction; 