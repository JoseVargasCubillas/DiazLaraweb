import { useEffect, useState } from 'react';
import LandingPage from './pages/landing/LandingPage';
import AdvisorPortal from './pages/advisor/AdvisorPortal';

const isAdvisorRoute = () => {
  const { pathname, hash } = window.location;
  return pathname.endsWith('/asesores') || hash === '#/asesores';
};

function App() {
  const [showAdvisorPortal, setShowAdvisorPortal] = useState(isAdvisorRoute());

  useEffect(() => {
    const syncRoute = () => setShowAdvisorPortal(isAdvisorRoute());

    window.addEventListener('hashchange', syncRoute);
    window.addEventListener('popstate', syncRoute);

    return () => {
      window.removeEventListener('hashchange', syncRoute);
      window.removeEventListener('popstate', syncRoute);
    };
  }, []);

  if (showAdvisorPortal) {
    return <AdvisorPortal />;
  }

  return <LandingPage />;
}

export default App;
