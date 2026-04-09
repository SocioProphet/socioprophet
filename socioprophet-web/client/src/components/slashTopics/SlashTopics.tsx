import React from 'react';
import { StyledTopicsBar, StyledTopicChip } from './styles';

const POPULAR_TOPICS = [
  'tech',
  'science',
  'politics',
  'health',
  'climate',
  'ai',
  'security',
  'economics',
  'world',
  'culture',
];

interface SlashTopicsProps {
  activeTag: string | null;
  onSelect: (tag: string | null) => void;
}

const SlashTopics = ({ activeTag, onSelect }: SlashTopicsProps) => {
  return (
    <StyledTopicsBar aria-label="Filter by topic">
      <StyledTopicChip
        active={activeTag === null}
        onClick={() => onSelect(null)}
      >
        /all
      </StyledTopicChip>
      {POPULAR_TOPICS.map((topic) => (
        <StyledTopicChip
          key={topic}
          active={activeTag === topic}
          onClick={() => onSelect(activeTag === topic ? null : topic)}
        >
          /{topic}
        </StyledTopicChip>
      ))}
    </StyledTopicsBar>
  );
};

export default SlashTopics;
