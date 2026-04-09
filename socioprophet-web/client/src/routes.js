import React from 'react';
import Landing from './views/landing/Landing';
import Feed from './views/feed/Feed';
import Terms from './views/legal/Terms';
import Privacy from './views/legal/Privacy';
import NotFound from './views/notFound/NotFound';

const routes = [
  { path: '/', element: <Landing /> },
  { path: '/feed', element: <Feed /> },
  { path: '/terms-of-use', element: <Terms /> },
  { path: '/privacy-policy', element: <Privacy /> },
  { path: '*', element: <NotFound /> },
];

export default routes;
