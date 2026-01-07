import React from 'react';
import FeatureItem from '../featureItem/FeatureItem';
import { StyledAboutWrapper } from './styles';

const MainAbout = () => {
  return (
    <StyledAboutWrapper>
      <FeatureItem
        heading="platform"
        description="Built as a social networking platform. For geeks, but simple enough for everyone to use."
      />
      <FeatureItem
        heading="community"
        description="Unlock the world's best ideas through democratized social intelligence, data, analytics & AI."
      />
      <FeatureItem
        heading="data & ai"
        description="Share your compute by leveraging P2P and federated networks or centralized collaboration models."
      />
    </StyledAboutWrapper>
  );
};

export default MainAbout;
