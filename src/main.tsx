import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import { setupGlobalErrorHandling } from './utils/errorHandler'

// Configurar tratamento global de erros
setupGlobalErrorHandling();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <MantineProvider>
          <Notifications />
          <App />
        </MantineProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)