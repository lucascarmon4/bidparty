import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import LoginPage from './pages/LoginPage.tsx';
import DiscoverPage from './pages/DiscoverPage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import LobbyPage from './pages/LobbyPage.tsx';

function AppRoutes() {
  const { user } = useAuth();
  const authed = !!user;

  return (
    <Routes>
      <Route path="/login"    element={!authed ? <LoginPage />    : <Navigate to="/discover" replace />} />
      <Route path="/discover" element={authed  ? <DiscoverPage /> : <Navigate to="/login"    replace />} />
      <Route path="/profile"  element={authed  ? <ProfilePage />  : <Navigate to="/login"    replace />} />
      <Route path="/lobby/:partyId" element={authed ? <LobbyPage /> : <Navigate to="/login" replace />} />
      <Route path="*"         element={<Navigate to={authed ? '/discover' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
