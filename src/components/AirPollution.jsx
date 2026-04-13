export default function AirPollution({ air }) {
  const getAqiText = (aqi) => {
    switch (aqi) {
      case 1:
        return 'Хорошо'
      case 2:
        return 'Нормально'
      case 3:
        return 'Средне'
      case 4:
        return 'Плохо'
      case 5:
        return 'Очень плохо'
      default:
        return 'Нет данных'
    }
  }

  return (
    <div className="card">
      <h2>Воздух</h2>
      <div className="grid">
        <div>AQI: {air.main.aqi}</div>
        <div>Качество: {getAqiText(air.main.aqi)}</div>
        <div>PM2.5: {air.components.pm2_5}</div>
        <div>PM10: {air.components.pm10}</div>
      </div>
    </div>
  )
}