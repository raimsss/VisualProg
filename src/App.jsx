import { useEffect, useState } from 'react'
import Search from './components/Search'
import WeatherCard from './components/WeatherCard'
import Forecast from './components/Forecast'
import AirPollution from './components/AirPollution'
import './styles.css'

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY
const USE_MOCKS = false
console.log('KEY =', API_KEY)

const mockWeather = {
  weather: [{ main: 'Clouds', description: 'облачно', icon: '03d' }],
  main: {
    temp: 18,
    feels_like: 17,
    humidity: 65,
    pressure: 1012,
  },
  wind: { speed: 4.2 },
  cityName: 'Новосибирск',
  country: 'RU',
}

const mockForecast = [
  {
    dt: 1,
    dt_txt: '2025-04-14 12:00:00',
    main: { temp: 18 },
    weather: [{ icon: '03d', description: 'облачно' }],
  },
  {
    dt: 2,
    dt_txt: '2025-04-14 15:00:00',
    main: { temp: 17 },
    weather: [{ icon: '04d', description: 'пасмурно' }],
  },
  {
    dt: 3,
    dt_txt: '2025-04-14 18:00:00',
    main: { temp: 15 },
    weather: [{ icon: '10d', description: 'дождь' }],
  },
  {
    dt: 4,
    dt_txt: '2025-04-15 12:00:00',
    main: { temp: 16 },
    weather: [{ icon: '04d', description: 'пасмурно' }],
  },
  {
    dt: 5,
    dt_txt: '2025-04-16 12:00:00',
    main: { temp: 14 },
    weather: [{ icon: '10d', description: 'дождь' }],
  },
  {
    dt: 6,
    dt_txt: '2025-04-17 12:00:00',
    main: { temp: 19 },
    weather: [{ icon: '02d', description: 'малооблачно' }],
  },
]

const mockAir = {
  main: { aqi: 2 },
  components: {
    pm2_5: 7.4,
    pm10: 12.6,
    co: 210,
    no2: 5.2,
  },
}

export default function App() {
  const [city, setCity] = useState('Новосибирск')
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState([])
  const [air, setAir] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchWeatherData = async (cityName) => {
    try {
      setLoading(true)
      setError('')

      if (USE_MOCKS) {
        setWeather(mockWeather)
        setForecast(mockForecast)
        setAir(mockAir)
        setCity(cityName)
        return
      }

      if (!API_KEY) {
        throw new Error('API ключ не найден. Проверь файл .env')
      }

      const geoRes = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
          cityName
        )}&limit=1&appid=${API_KEY}`
      )

      if (!geoRes.ok) {
        throw new Error('Не удалось получить координаты города')
      }

      const geoData = await geoRes.json()

      if (!geoData.length) {
        throw new Error('Город не найден')
      }

      const { lat, lon, name, country } = geoData[0]

      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ru`
      )

      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ru`
      )

      const airRes = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
      )

      if (!weatherRes.ok) {
        throw new Error('Не удалось получить текущую погоду')
      }

      if (!forecastRes.ok) {
        throw new Error('Не удалось получить прогноз')
      }

      if (!airRes.ok) {
        throw new Error('Не удалось получить данные по воздуху')
      }

      const weatherData = await weatherRes.json()
      const forecastData = await forecastRes.json()
      const airData = await airRes.json()

      setWeather({
        ...weatherData,
        cityName: name,
        country,
      })
      setForecast(forecastData.list)
      setAir(airData.list[0])
      setCity(name)
    } catch (err) {
      setError(err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeatherData(city)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchWeatherData(city)
    }, 3 * 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [city])

  return (
    <div className="app">
      <div className="container">
        <h1>Погода</h1>

        <Search onSearch={fetchWeatherData} loading={loading} />

        {error && <div className="error">{error}</div>}

        {weather && <WeatherCard weather={weather} />}

        {forecast.length > 0 && <Forecast forecast={forecast} />}

        {air && <AirPollution air={air} />}
      </div>
    </div>
  )
}