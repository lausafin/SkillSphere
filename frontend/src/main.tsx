import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
// Optional: Import global CSS if needed, otherwise handled by MUI/CssBaseline
// import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)