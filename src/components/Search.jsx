import { useState } from 'react'

export default function Search({ onSearch, loading }) {
  const [value, setValue] = useState('Новосибирск')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!value.trim()) return
    onSearch(value.trim())
  }

  return (
    <form className="search" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Введите город"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit" disabled={loading}>
        {loading ? '...' : 'Найти'}
      </button>
    </form>
  )
}