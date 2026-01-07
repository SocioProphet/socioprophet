import styled from 'styled-components';
import imgDesktop from '../../../public/images/mothership-background.jpg';
import imgMobile from '../../../public/images/dashboard-temp-background.jpg';

export const StyledMainWrapper = styled.div`
  background-image: url(${imgDesktop});
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  width: 100%;
  height: 600px;
  text-align: center;

  @media (max-width: 600px) {
    background-image: url(${imgMobile});
  }

  @media (max-width: 600px) {
    height: 400px;
  }
`;

export const StyledSubTitle = styled.h2`
  padding: 120px 0 10px 0;
  font-size: 25px;
  color: #fff;

  @media (max-width: 800px) {
    font-size: 20px;
  }

  @media (max-width: 620px) {
    padding-top: 90px;
    font-size: 16px;
  }

  @media (max-width: 620px) {
    padding: 80px 15px 0px 15px;
    line-height: 25px;
  }
`;

export const StyledAboutWrapper = styled.div`
  height: auto;
  display: flex;
  justify-content: space-between;
  padding: 50px 0 50px 0;

  @media (max-width: 950px) {
    display: grid;
    justify-content: center;
    padding-top: 10px;
  }
`;
