export default function Forecast({ forecast }) {
  const shortForecast = forecast.slice(0, 5)

  return (
    <div className="card">
      <h2>Прогноз</h2>

      <div className="forecast-list">
        {shortForecast.map((item) => (
          <div className="forecast-item" key={item.dt}>
            <div>
              {new Date(item.dt_txt).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'numeric',
              })}{' '}
              {new Date(item.dt_txt).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>

            <img
              src={`https://openweathermap.org/img/wn/${item.weather[0].icon}.png`}
              alt={item.weather[0].description}
            />

            <strong>{Math.round(item.main.temp)}°C</strong>
          </div>
        ))}
      </div>
    </div>
  )
}