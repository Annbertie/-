import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, theme as antTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import App from './App';
import './index.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

function ThemedApp() {
  const { isDark } = useTheme();

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          borderRadius: 6,
        },
      }}
    >
      <AuthProvider>
        <App />
      </AuthProvider>
    </ConfigProvider>
  );
}

root.render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
