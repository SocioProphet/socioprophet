import React from 'react';
import { StyledSection, StyledSectionHeading, StyledSectionDescription } from './styles';

interface FeautureItemProps {
  heading: string;
  description: string;
}

const FeatureItem = ({ heading, description }: FeautureItemProps) => {
  return (
    <StyledSection>
      <StyledSectionHeading>{heading}</StyledSectionHeading>
      <StyledSectionDescription>{description}</StyledSectionDescription>
    </StyledSection>
  );
};

export default FeatureItem;
