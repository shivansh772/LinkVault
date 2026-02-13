import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Note: StrictMode is removed to prevent double API calls in development
// StrictMode causes components to render twice, which increments view count by 2
// You can re-enable it for debugging if needed, but it will cause double view counts

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
