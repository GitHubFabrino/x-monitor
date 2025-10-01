import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Dashboard from './pages/Dashboard';
import DeviceDetails from './pages/DeviceDetails';
import Layout from './components/Layout';
import { ThemeProvider } from './context/ThemeContext';
import { useSocketIo } from './hooks/useSocketIo';
import './index.css';

// Composant pour initialiser les WebSockets
const SocketInitializer = () => {
  useSocketIo();
  return null;
};

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <div className="min-h-screen bg-base-200">
            <SocketInitializer />
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/devices/:id" element={<DeviceDetails />} />
              </Routes>
            </Layout>
            <Toaster position="top-right" />
          </div>
        </Router>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
