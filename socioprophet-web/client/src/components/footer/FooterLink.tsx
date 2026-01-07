import React from 'react';
import { StyledLink } from './styles';

interface FooterLinkProps {
  link: string;
  label: string;
  target?: string;
}

const FooterLink = ({ link, label, target }: FooterLinkProps) => {
  return (
    <StyledLink to={link} target={target}>
      <strong>{label}</strong>
    </StyledLink>
  );
};

export default FooterLink;
