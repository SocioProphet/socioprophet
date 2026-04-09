import styled from 'styled-components';

export const StyledTopicsBar = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
`;

export const StyledTopicChip = styled.button<{ active: boolean }>`
  background-color: ${({ active }) => (active ? '#ff6314' : '#1e1e1e')};
  color: ${({ active }) => (active ? '#fff' : '#aaa')};
  border: 1px solid ${({ active }) => (active ? '#ff6314' : '#333')};
  border-radius: 14px;
  padding: 4px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;

  &:hover {
    background-color: ${({ active }) => (active ? '#e05510' : '#2a2a2a')};
    color: #fff;
  }
`;
