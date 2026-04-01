import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import AuthPage from './features/auth/pages/AuthPage'
function App() {
  const [count, setCount] = useState(0)

  return (
    <AuthPage />
  )
}

export default App
