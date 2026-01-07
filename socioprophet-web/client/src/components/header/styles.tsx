import styled from 'styled-components';

export const StyledNav = styled.nav`
  position: fixed;
  display: flex;
  width: 100%;
  height: 50px;
  z-index: 1000;
  padding-left: 20px;
  padding-right: 20px;
  background-color: #070708;
`;

export const StyledHeaderTitle = styled.h1`
  font-size: 20px;
  line-height: 50px;
`;

export const StyledTitleLink = styled.a`
  text-decoration: none;
  color: #fff;
`;

export const StyledNavLinks = styled.div`
  display: flex;
  margin-left: auto;

  & > div:not(:last-child) {
    margin-right: 20px;
  }
`;
