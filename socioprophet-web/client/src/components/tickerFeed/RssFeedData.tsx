import React from 'react';
import { RssFeed } from './types';
import { StyledTickerText, StyledAnchor } from './styles';

interface RssFeedDataProps {
  feed: RssFeed;
}

const RssFeedData = ({ feed }: RssFeedDataProps) => {
  return (
    <StyledTickerText>
      {feed.map(({ title, link }) => (
        <StyledAnchor key={`${title}-${link}`} href={link || '#'} target="_blank" rel="noopener">
          {title}
        </StyledAnchor>
      ))}
    </StyledTickerText>
  );
};

export default RssFeedData;
