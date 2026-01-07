import React from 'react';
import Header from '../../components/header/Header';
import TickerFeed from '../../components/tickerFeed';
import MainHero from '../../components/main/MainHero';
import MainAbout from '../../components/main/MainAbout';
import Footer from '../../components/footer/Footer';

const Landing = () => {
  return (
    <>
      <Header />
      <TickerFeed />
      <MainHero />
      <MainAbout />
      <Footer />
    </>
  );
};

export default Landing;
