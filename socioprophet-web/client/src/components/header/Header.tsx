import React from 'react';
import { URLS } from '../../constants/urls';
import HeaderLink from '../headerLink/HeaderLink';
import { StyledNav, StyledHeaderTitle, StyledTitleLink, StyledNavLinks } from './styles';

const { GITHUB, WIKI, BLOG } = URLS;

const Header = () => {
  return (
    <StyledNav>
      <StyledHeaderTitle>
        <StyledTitleLink href="/">SocioProphet</StyledTitleLink>
      </StyledHeaderTitle>
      <StyledNavLinks>
        <HeaderLink isExternal={false} link="/feed" label="Feed" />
        <HeaderLink isExternal link={GITHUB} label="GitHub" />
        <HeaderLink isExternal link={WIKI} label="Wiki" />
        <HeaderLink isExternal link={BLOG} label="Blog" />
      </StyledNavLinks>
    </StyledNav>
  );
};

export default Header;
