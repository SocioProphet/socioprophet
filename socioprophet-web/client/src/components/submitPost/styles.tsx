import styled from 'styled-components';

export const StyledForm = styled.form`
  background-color: #111213;
  border: 1px solid #222;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 22px;
`;

export const StyledFormTitle = styled.h2`
  font-size: 14px;
  font-weight: 500;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 14px;
`;

export const StyledField = styled.div`
  margin-bottom: 12px;
`;

export const StyledLabel = styled.label`
  display: block;
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
`;

export const StyledInput = styled.input`
  width: 100%;
  background-color: #1a1a1b;
  border: 1px solid #333;
  border-radius: 3px;
  color: #e0e0e0;
  font-size: 14px;
  padding: 8px 10px;
  outline: none;
  font-family: inherit;

  &:focus {
    border-color: #ff6314;
  }

  &::placeholder {
    color: #555;
  }
`;

export const StyledSelect = styled.select`
  width: 100%;
  background-color: #1a1a1b;
  border: 1px solid #333;
  border-radius: 3px;
  color: #e0e0e0;
  font-size: 14px;
  padding: 8px 10px;
  outline: none;
  font-family: inherit;
  cursor: pointer;

  &:focus {
    border-color: #ff6314;
  }
`;

export const StyledSubmitBtn = styled.button`
  background-color: #ff6314;
  color: #fff;
  border: none;
  border-radius: 3px;
  font-size: 14px;
  font-family: inherit;
  padding: 8px 20px;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background-color: #e05510;
  }

  &:disabled {
    background-color: #555;
    cursor: not-allowed;
  }
`;

export const StyledError = styled.p`
  font-size: 13px;
  color: #e05510;
  margin-top: 8px;
`;

export const StyledSignInNote = styled.p`
  font-size: 13px;
  color: #666;
  font-style: italic;
`;
