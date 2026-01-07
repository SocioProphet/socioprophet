import styled from 'styled-components';
import { Link } from 'react-router-dom';

export const StyledFooter = styled.footer`
  display: grid;
  justify-content: center;
  align-items: center;
  width: 100%;
  line-height: 50px;
  padding-bottom: 50px;
  z-index: 10000;
  background-color: #000;
  border-top: 1px solid #333;
`;

export const StyledLinksWrapper = styled.div`
  display: flex;
`;

export const StyledLink = styled(Link)`
  margin: 0 20px 0 20px;
  font-size: 14px;
  font-weight: 400;
  color: #fff;
  text-decoration: none !important;
`;

export const StyledAnchor = styled.a`
  margin: 0 20px 0 20px;
  font-size: 14px;
  font-weight: 400;
  color: #fff;
  text-decoration: none !important;
`;

export const StyledCopyrightLink = styled.p`
  text-align: center;
  font-size: 12px;
  color: #fff;
`;
