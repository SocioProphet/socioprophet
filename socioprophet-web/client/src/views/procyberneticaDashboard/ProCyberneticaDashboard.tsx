import React, { useEffect, useMemo, useState } from 'react';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import {
  Container,
  Hero,
  HeroTitle,
  HeroSubtitle,
  StatusRow,
  StatusCard,
  Section,
  SectionTitle,
  TableWrap,
  Table,
  EmptyState,
  Meta,
  ErrorBox,
} from './styles';

type DashboardRow = {
  subjectType: 'Lab' | 'Model';
  subject: string;
  regionOrOwner: string;
  category: string;
  poa: number;
  ega: number;
  composite: number;
  evidenceConfidence: string;
  topStrength: string;
  topRisk: string;
  scoringBasis: string;
};

type DashboardPayload = {
  generatedAtUtc: string;
  totals: {
    subjects: number;
    labs: number;
    models: number;
    changedSubjects: number;
    openEscalations: number;
  };
  leaderboard: DashboardRow[];
  contradictions: DashboardRow[];
};

const endpoint = '/api/procybernetica/dashboard';

const ProCyberneticaDashboard = () => {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(endpoint);
        if (!res.ok) {
          throw new Error(`Dashboard request failed: ${res.status}`);
        }
        const json = (await res.json()) as DashboardPayload;
        if (isMounted) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown dashboard error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const leaderboard = useMemo(() => data?.leaderboard ?? [], [data]);
  const contradictions = useMemo(() => data?.contradictions ?? [], [data]);

  return (
    <>
      <Header />
      <Container>
        <Hero>
          <HeroTitle>ProCybernetica Alignment Dashboard</HeroTitle>
          <HeroSubtitle>
            Constitutional scoring for frontier labs and model families, wired for Sherlock-search-backed delivery.
          </HeroSubtitle>
          {data && <Meta>Generated: {data.generatedAtUtc}</Meta>}
        </Hero>

        {loading && <EmptyState>Loading dashboard…</EmptyState>}
        {error && <ErrorBox>{error}</ErrorBox>}

        {data && (
          <>
            <StatusRow>
              <StatusCard>
                <strong>{data.totals.subjects}</strong>
                <span>Total subjects</span>
              </StatusCard>
              <StatusCard>
                <strong>{data.totals.labs}</strong>
                <span>Labs</span>
              </StatusCard>
              <StatusCard>
                <strong>{data.totals.models}</strong>
                <span>Model families</span>
              </StatusCard>
              <StatusCard>
                <strong>{data.totals.changedSubjects}</strong>
                <span>Changed subjects</span>
              </StatusCard>
              <StatusCard>
                <strong>{data.totals.openEscalations}</strong>
                <span>Open escalations</span>
              </StatusCard>
            </StatusRow>

            <Section>
              <SectionTitle>Leaderboard</SectionTitle>
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Type</th>
                      <th>POA</th>
                      <th>EGA</th>
                      <th>Composite</th>
                      <th>Strength</th>
                      <th>Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((row) => (
                      <tr key={`${row.subjectType}:${row.subject}`}>
                        <td>{row.subject}</td>
                        <td>{row.subjectType}</td>
                        <td>{row.poa.toFixed(2)}</td>
                        <td>{row.ega.toFixed(2)}</td>
                        <td>{row.composite.toFixed(2)}</td>
                        <td>{row.topStrength}</td>
                        <td>{row.topRisk}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            </Section>

            <Section>
              <SectionTitle>Constitutional Risk / Contradictions</SectionTitle>
              {contradictions.length === 0 ? (
                <EmptyState>No contradiction-flagged subjects in current payload.</EmptyState>
              ) : (
                <TableWrap>
                  <Table>
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Type</th>
                        <th>Composite</th>
                        <th>Top risk</th>
                        <th>Evidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contradictions.map((row) => (
                        <tr key={`contradiction:${row.subjectType}:${row.subject}`}>
                          <td>{row.subject}</td>
                          <td>{row.subjectType}</td>
                          <td>{row.composite.toFixed(2)}</td>
                          <td>{row.topRisk}</td>
                          <td>{row.evidenceConfidence}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              )}
            </Section>
          </>
        )}
      </Container>
      <Footer />
    </>
  );
};

export default ProCyberneticaDashboard;
