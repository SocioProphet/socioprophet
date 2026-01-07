import React from 'react';
import Logo from '../logo/Logo';
import { StyledMainWrapper, StyledSubTitle } from './styles';

const MainHero = () => {
  return (
    <StyledMainWrapper>
      <Logo />
      <StyledSubTitle>
        Open Collaborative Socio-Dat-Analytics &bull; Global Shared Knowledge
      </StyledSubTitle>
    </StyledMainWrapper>
  );
};

export default MainHero;
