import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import routes from './routes';
import { GlobalStyles } from './globalStyles';

const App = () => {
  return (
    <BrowserRouter>
      <GlobalStyles />
      <Routes>
        {routes.map(({ path, element }, index) => (
          <Route key={index} path={path} element={element} />
        ))}
      </Routes>
    </BrowserRouter>
  );
};
export default App;
