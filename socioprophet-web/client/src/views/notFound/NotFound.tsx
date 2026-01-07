import React from 'react';
import Header from '../../components/header/Header';
import { StyledTextWrapper, StyledSubHeading } from './styles';

const NotFound = () => {
  return (
    <>
      <Header />
      <StyledTextWrapper>
        <h1>404</h1>
        <StyledSubHeading>This is unknown internet space</StyledSubHeading>
      </StyledTextWrapper>
    </>
  );
};

export default NotFound;
