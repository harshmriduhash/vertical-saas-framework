import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Home from "./pages/Home";
import Compliance from "./pages/Compliance";
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import ComponentShowcase from './pages/ComponentShowcase';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path={"/"} element={<Home />} />
            <Route path={"/compliance/:tenantId"} element={<Compliance />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard/:tenantId" element={<Dashboard />} />
            <Route path="/showcase" element={<ComponentShowcase />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

