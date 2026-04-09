import styled from 'styled-components';

export const StyledCard = styled.article`
  background-color: #111213;
  border: 1px solid #222;
  border-radius: 4px;
  padding: 14px 16px;
  margin-bottom: 10px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
`;

export const StyledUpvoteBtn = styled.button<{ active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 36px;
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ active }) => (active ? '#ff6314' : '#888')};
  font-size: 20px;
  line-height: 1;
  padding: 0;
  transition: color 0.15s;

  &:hover {
    color: #ff6314;
  }
`;

export const StyledUpvoteCount = styled.span`
  font-size: 13px;
  color: #aaa;
  margin-top: 2px;
`;

export const StyledBody = styled.div`
  flex: 1;
  min-width: 0;
`;

export const StyledTitle = styled.a`
  display: block;
  font-size: 16px;
  color: #e0e0e0;
  text-decoration: none;
  margin-bottom: 6px;
  word-break: break-word;

  &:hover {
    color: #fff;
    text-decoration: underline;
  }
`;

export const StyledMeta = styled.div`
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
`;

export const StyledTagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

export const StyledTag = styled.span`
  font-size: 11px;
  color: #aaa;
  background-color: #1e1e1e;
  border: 1px solid #333;
  border-radius: 3px;
  padding: 2px 7px;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background-color: #2a2a2a;
    color: #fff;
  }
`;

export const StyledTypeBadge = styled.span`
  font-size: 10px;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #888;
  border: 1px solid #333;
  border-radius: 3px;
  padding: 1px 5px;
  margin-right: 8px;
`;
