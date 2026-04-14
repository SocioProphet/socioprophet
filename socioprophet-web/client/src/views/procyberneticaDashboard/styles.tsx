import styled from 'styled-components';

export const Container = styled.main`
  max-width: 1180px;
  margin: 0 auto;
  padding: 32px 20px 72px;
`;

export const Hero = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 28px;
`;

export const HeroTitle = styled.h1`
  margin: 0;
  font-size: 2.25rem;
  line-height: 1.1;
`;

export const HeroSubtitle = styled.p`
  margin: 0;
  max-width: 860px;
  font-size: 1rem;
  line-height: 1.6;
  opacity: 0.88;
`;

export const Meta = styled.span`
  font-size: 0.9rem;
  opacity: 0.7;
`;

export const StatusRow = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 14px;
  margin-bottom: 28px;
`;

export const StatusCard = styled.article`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 14px;
  background: rgba(255,255,255,0.03);

  strong {
    font-size: 1.6rem;
    line-height: 1;
  }

  span {
    font-size: 0.95rem;
    opacity: 0.82;
  }
`;

export const Section = styled.section`
  margin-top: 28px;
`;

export const SectionTitle = styled.h2`
  margin: 0 0 12px;
  font-size: 1.25rem;
`;

export const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 14px;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 12px 14px;
    text-align: left;
    vertical-align: top;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    font-size: 0.95rem;
  }

  th {
    font-weight: 700;
    background: rgba(255,255,255,0.04);
  }

  tbody tr:hover {
    background: rgba(255,255,255,0.025);
  }
`;

export const EmptyState = styled.div`
  padding: 18px;
  border-radius: 14px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.12);
`;

export const ErrorBox = styled.div`
  padding: 18px;
  border-radius: 14px;
  background: rgba(220, 68, 55, 0.12);
  border: 1px solid rgba(220, 68, 55, 0.35);
  color: #ffd7d1;
`;
