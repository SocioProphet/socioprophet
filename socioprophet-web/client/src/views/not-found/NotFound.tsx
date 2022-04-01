import React from 'react';
import Header from '../../components/header/Header';

import './scss/notFound.scss';

const NotFound = (): JSX.Element => {
  return (
    <div className="notFound">
      <Header />
      <div className="notFound__container">
        <h1 className="notFound__heading notFound__heading--main">404</h1>
        <h2 className="notFound__heading notFound__heading--sub">This is unknown internet space</h2>
        <h4 className="notFound__heading notFound__heading--description">
          Sorry, but the path " {window.location.pathname} " does not exist!
        </h4>
      </div>
    </div>
  );
};

export default NotFound;
