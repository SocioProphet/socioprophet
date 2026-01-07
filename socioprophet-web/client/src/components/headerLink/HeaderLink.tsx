import React from 'react';
import { StyledLinkDiv, StyledAnchor } from './styles';

interface HeaderLinkProps {
  isExternal: boolean;
  link: string;
  label: string;
}

const HeaderLink = ({ isExternal, link, label }: HeaderLinkProps) => {
  return (
    <StyledLinkDiv>
      <StyledAnchor href={link} target={isExternal ? '_blank' : '_self'} rel="noopener">
        {label}
      </StyledAnchor>
    </StyledLinkDiv>
  );
};

export default HeaderLink;
