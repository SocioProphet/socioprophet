import React, { useState, useEffect } from 'react';
import Ticker from 'react-ticker';
import { RssFeed } from './types';
import RssFeedData from './RssFeedData';
import { StyledTickerWrapper, StyledTickerField } from './styles';

const TickerFeed = () => {
  const [feed, setFeed] = useState<RssFeed>([]);

  useEffect(() => {
    let mounted = true;

    const getRss = async (): Promise<void> => {
      const rssResponse = await fetch('/api/feed/rss');
      const feedData = await rssResponse.json();

      if (mounted) {
        setFeed(feedData);
      }
    };

    getRss();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <StyledTickerWrapper>
      {feed.length && (
        <StyledTickerField>
          <Ticker offset="run-in">{() => <RssFeedData feed={feed} />}</Ticker>
        </StyledTickerField>
      )}
    </StyledTickerWrapper>
  );
};

export default TickerFeed;
