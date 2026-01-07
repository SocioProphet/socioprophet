import React from 'react';
import { URLS } from '../../constants/urls';
import FooterLink from './FooterLink';
import { StyledFooter, StyledLinksWrapper, StyledCopyrightLink, StyledAnchor } from './styles';

const { CONTACT, PRIVACY, TERMS_OF_USE } = URLS;

const Footer = () => {
  return (
    <StyledFooter>
      <StyledLinksWrapper>
        <StyledAnchor href={CONTACT}>Contact</StyledAnchor>
        <FooterLink link={PRIVACY} target="_top" label="Privacy" />
        <FooterLink link={TERMS_OF_USE} target="_top" label="Terms of Use" />
      </StyledLinksWrapper>
      <StyledCopyrightLink>&copy; {new Date().getFullYear()} SocioProphet</StyledCopyrightLink>
    </StyledFooter>
  );
};

export default Footer;
