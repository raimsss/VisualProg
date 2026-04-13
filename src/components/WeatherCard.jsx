export default function WeatherCard({ weather }) {
  const icon = weather.weather[0].icon
  const description = weather.weather[0].description

  return (
    <div className="card">
      <h2>
        {weather.cityName}, {weather.country}
      </h2>

      <img
        src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
        alt={description}
      />

      <div className="temp">{Math.round(weather.main.temp)}°C</div>
      <p>{description}</p>

      <div className="grid">
        <div>Ощущается: {Math.round(weather.main.feels_like)}°C</div>
        <div>Влажность: {weather.main.humidity}%</div>
        <div>Давление: {weather.main.pressure} гПа</div>
        <div>Ветер: {weather.wind.speed} м/с</div>
      </div>
    </div>
  )
}