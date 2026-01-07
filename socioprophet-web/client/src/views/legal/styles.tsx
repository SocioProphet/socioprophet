import styled from 'styled-components';
import { Link } from 'react-router-dom';

export const StyledWrapper = styled.div`
  padding: 80px;
  color: #fff;
  background: #070708;
`;

export const StyledHeading = styled.h1`
  text-align: center;
  padding-bottom: 50px;
  font-size: 30px;
`;

export const StyledSubHeading = styled.h3`
  margin-top: 70px;
  text-align: center;
  font-size: 24px;
  font-weight: 800;
  text-transform: uppercase;
`;

export const StyledDescription = styled.div`
  margin-top: 40px;
  line-height: 50px;
  font-size: 14px;
`;

export const StyleLinkWrapper = styled.div`
  margin-top: 80px;
  width: 100%;
  text-align: center;
`;

export const StyledList = styled.ul`
  margin-left: 50px;
  line-height: 25px;
  font-size: 14px;
`;

export const StyledLink = styled(Link)`
  color: #fff;
  font-size: 14px;
`;

export const StyledAnchor = styled.a`
  color: #fff;
`;
