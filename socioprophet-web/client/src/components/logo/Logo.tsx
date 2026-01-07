import React from 'react';
import { StyledLogoDiv } from './styles';
import logo from '../../../public/images/mothership-logo.png';

const Logo = () => {
  return (
    <StyledLogoDiv>
      <img src={logo} width="450px" height="77px" alt="socioprophet" />
    </StyledLogoDiv>
  );
};

export default Logo;
