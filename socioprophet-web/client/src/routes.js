import React from 'react';
import Landing from './views/landing/Landing';
import Terms from './views/legal/Terms';
import Privacy from './views/legal/Privacy';
import NotFound from './views/notFound/NotFound';
import ProCyberneticaDashboard from './views/procyberneticaDashboard/ProCyberneticaDashboard';

const routes = [
  { path: '/', element: <Landing /> },
  { path: '/procybernetica', element: <ProCyberneticaDashboard /> },
  { path: '/terms-of-use', element: <Terms /> },
  { path: '/privacy-policy', element: <Privacy /> },
  { path: '*', element: <NotFound /> },
];

export default routes;
