import styled from 'styled-components';

export const StyledSection = styled.section`
  width: 30%;
  heigth: auto;
  padding: 0 15px 0 15px;
  color: #fff;
  text-align: center;

  @media (max-width: 950px) {
    width: 100%;
    margin-top: 50px;
  }
`;

export const StyledSectionHeading = styled.h2`
  font-size: 34px;
  font-weight: 100;
  letter-spacing: 4px;
  color: rgb(150, 150, 150);
  text-transform: uppercase;

  @media (max-width: 800px) {
    font-size: 28px;
  }
`;

export const StyledSectionDescription = styled.p`
  margin-top: 50px;
  padding: 0 20px 0 20px;
  line-height: 45px;
  font-size: 16px;

  @media (max-width: 950px) {
    margin-top: 15px;
  }

  @media (max-width: 800px) {
    font-size: 14px;
    line-height: 36px;
  }
`;
