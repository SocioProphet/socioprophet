import styled from 'styled-components';

export const StyledLogoDiv = styled.div`
  justify-content: center;
  padding-top: 180px;
  height: 100px;

  @media (max-width: 620px) {
    height: 80px;

    img {
      width: 300px;
      height: 50px;
    }
  }
`;
