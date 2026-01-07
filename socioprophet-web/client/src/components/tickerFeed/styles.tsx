import styled from 'styled-components';

export const StyledTickerWrapper = styled.div`
  position: absolute;
  width: 100%;
  height: 40px;
  z-index: 1;
`;

export const StyledTickerField = styled.div`
  position: fixed;
  top: 50px;
  left: 0;
  width: 100%;
  height: 40px;
  background-color: rgb(35, 35, 35);
  opacity: 0.85;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: subpixel-antialiased;
`;

export const StyledTickerText = styled.p`
  line-height: 40px;
  font-size: 14px;
  vertical-align: middle;
  white-space: nowrap;
  margin-left: 3rem;
  padding-top: 0px;
  height: 40xp;
`;

export const StyledAnchor = styled.a`
  text-decoration: none;
  color: #f4f4f4;
  padding-right: 3rem;
`;
