# SocioProphet Portal Screen Map and Annotated Wireframes

Status: reference/design inventory replayed from `mdheller/socioprophet-web`  
Source: `mdheller/socioprophet-web@67cff37b3da44395757c9095e1cbc081ca73333b:docs/wireframes/portal-screen-map-and-wireframes.md`  
Target surface: `socioprophet-web/client-vue`

## Boundary

This document is reference material. It records intended screen shapes, TriRPC calls, and journal events. It does not mean every route is implemented, live, production-ready, or backed by runtime services.

Use it as a design backlog and acceptance reference for future bounded PRs.

## Global layout

- Viewport: `1440 x 900`
- Content grid: `12 columns` inside `1200px`
- Page margins: `120px`
- Column width: `80px`
- Gutters: `24px`
- TopBar: `64px`
- LeftNav: `248px`
- SideDrawer: `416px`

### Shared components

- `TopBar`
- `LeftNav`
- `QueryBar`
- `TickerBar`
- `KpiCard`
- `FeedCard`
- `PagedTable`
- `SideDrawer`
- `WizardModal`
- `GraphCanvas`
- `ProvenanceCard`
- `MdEditor`
- `TagInput`
- `PublishBar`
- `KuiFrame`
- `SessionJournalStrip`

## Screen map

| Screen | Route | Purpose | Primary components |
| --- | --- | --- | --- |
| Dashboard | `/dashboard` | Ticker + news + KPIs | `TickerBar`, `NewsFeedGrid`, `KpiCard`, `SideDrawer(Reader)` |
| Research | `/research` | Live ingest, triage, annotate | `LeftTaxonomy`, `RealTimeStream`, `ReaderDrawer` |
| Deployments | `/deployments` | Sovereign compute inventory | `DeploymentTable`, `DeployDrawer` |
| Catalog | `/catalog` | Dataset marketplace | `CatalogFilters`, `DatasetCardGrid` |
| Project Notebook | `/projects` | KPI + observations + runs | `ProjectKpiRow`, `MetricSpark`, `RunsTable` |
| Run Detail | `/runs/:id` | Summary / Compare / Samples / Logs | `RunHeader`, `RunTabs`, `CompareTable` |
| Profile | `/u/:handle` | Publisher home | `ProfileHeader`, `PostCardGrid`, `NotifList` |
| New Post Composer | `/publish/new` | Epiphany-style post creation | `PostTitle`, `MdEditor`, `TagInput`, `CitationRail` |
| Post Detail | `/p/:slug` | Published article view | `ArticleView`, `ProvenanceCard`, `RelatedPane`, `Comments` |

## Annotated wireframes

### 1) Dashboard (`/dashboard`)

```text
TopBar 1440x64
┌──────────────────────────────────────────────────────────────────────────────┐
│ TickerBar 1440x40  [NASDAQ ▲0.32%] [S&P ▲0.25%] [FEDS ▼0.03%] [WTI ▼0.05%]  │
└──────────────────────────────────────────────────────────────────────────────┘
Content 1440x796
▒▒ LeftNav 248x796 ▒▒│col1││col2││col3││col4││col5││col6││col7││col8││col9││col10││col11││col12│
                      [QueryBar/Toolbar 1200x48  filters + Save View + AA/AAA]
                      ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
                      │ [FeedCard]    │ │ [FeedCard]    │ │ [FeedCard]    │
                      └───────────────┘ └───────────────┘ └───────────────┘
                      ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
                      │ [KpiCard]   │ │ [KpiCard]   │ │ [KpiCard]   │ │ [KpiCard]   │
                      └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
                                        [RecentActivity list]
                                                              ▓▓▓▓▓▓▓▓
                                                              ▓ Drawer▓  SideDrawer(Reader)
                                                              ▓▓▓▓▓▓▓▓
```

TriRPC calls:

- `news.feed({filters,cursor})`
- `metrics.getTicker({symbols})`
- `metrics.timely({series:['dw.qps','dw.p95','maat.pass','tz.gates']})`

Journal events:

- `news.search.run`
- `news.item.view|save`
- `metrics.ticker.update`
- `dashboard.kpi.click`

### 2) Research (`/research`)

```text
TopBar
▒▒ LeftNav ▒▒ [LeftTaxonomy 248xfull]
Center 680 wide:
  [QueryBar 680x48]
  [MiniBars 680x72]  (rate by topic/time)
  [LiveCard 680x120] (Enrich | Add to Story | Reader)
  [LiveCard 680x120]
  [LiveCard 680x120]
Right:
  ▓▓▓▓▓▓▓▓  Reader Drawer 416px
  ▓ Tabs:  ▓  Content | Notes | Graph | Provenance
  ▓▓▓▓▓▓▓▓
```

TriRPC calls:

- `news.stream.subscribe({topics})`
- `memex.annotate({url,selectors,note,tags})`
- `lg.startPlaybook({seeds,playbookId})`

Journal events:

- `news.stream.event`
- `memex.page.annotated`
- `lg.proc.start|artifact|done`
- `research.view.saved`

### 3) Deployments (`/deployments`)

```text
TopBar
▒▒ LeftNav ▒▒
[Toolbar 1200x48]  New | Filters(Status/Region/Class) | Export | AA/AAA
[DeploymentTable 1200x460]
  Columns: Name220 | Type120 | Status120 | Region/Enclave220 | Class180 | Owner140 | Crypto/Signing144 | ⋮40
  Row actions: Stop | Audit
Right Drawer 416px:
  [Attestations 384x120]  (Maat result pill + hash)
  [PolicyDrift 384x120]   (Compliant/Warning/Fail)
  [ResidencyHeatmap 384x160]
  [LegalBasis 384x120]
```

TriRPC calls:

- `deploy.list({filters})`
- `deploy.get({id})`
- `maat.start({asset})`
- `maat.get({attId})`
- `policy.drift.check({id})`

Journal events:

- `deploy.update`
- `maat.attest.result`
- `policy.drift.update`
- `auth.denied`

### 4) Catalog (`/catalog`)

```text
TopBar
▒▒ LeftNav ▒▒
[CatalogFilters 1200x56]  Category | Density | Search
[DatasetCard 360x180] [DatasetCard 360x180] [DatasetCard 360x180]
```

TriRPC calls:

- `catalog.search({q,tags,owner,sizeRange})`

Journal events:

- `catalog.view`
- `dataset.open`

### 5) Project Notebook (`/projects`)

```text
TopBar
▒▒ LeftNav ▒▒
[KPI Row: 4x KpiCard 270x120]
[MetricSpark 760x220]   [RefinedDatasets 416x220]
[RunsTable 760x260]     [NewAnalysis CTA 416x260]
```

TriRPC calls:

- `projects.get({id?})`
- `metrics.query({metric,project,range})`
- `experiments.listRuns({project})`
- `experiments.startRun(def)`

Journal events:

- `tz.run.start|done`
- `dataset.refine`

### 6) Run Detail (`/runs/:id`)

```text
TopBar
▒▒ LeftNav ▒▒
[RunHeader 1200x80]  (model/prompt/dataset/gates | Promote if gates pass)
[Tabs 1200x40]  Summary | Compare | Samples | Logs
Summary:
  [MetricCards + Spark 1200x160]
Compare:
  [CompareTable 1200x160]  (WinRate per bucket)
```

TriRPC calls:

- `tz.getRun({id})`
- `tz.streamRun({id})`
- `tz.evaluateGate({id})`

Journal events:

- `tz.run.start|batch.progress|metrics.final|gate.result|run.done`

### 7) Profile (`/u/:handle`)

```text
TopBar
[ProfileHeader 1200x128]  (avatar 80px, handle, stats, New Post CTA)
[Tabs 1200x40]  Posts | Network | Notifications | Bookmarked | Liked
[PostCard 560x180] [PostCard 560x180]
```

TriRPC calls:

- `profile.get({handle})`
- `publish.list({author,status,cursor})`
- `notify.list({cursor})`

Journal events:

- `post.draft.created|updated`
- `post.published`
- `post.react.liked`
- `post.bookmark.added`

### 8) New Post Composer (`/publish/new`)

```text
TopBar
Centered ComposeCard 960px:
  [PostTitle 960x56]
  [MdEditor 960x320]        (⌘S Save, ⌘P Preview)
  [TagInput 960x48]
  [PublishBar 960x48]       (Publish | Visibility | Collections)
Right CitationRail 240px:
  [CitationList] (drag-in from Reader/Research)
  [ProvenanceSummary] (sha, signer_fpr on publish)
```

TriRPC calls:

- `publish.createDraft`
- `publish.updateDraft`
- `publish.preview`
- `publish.uploadAsset`
- `publish.publish`

Journal events:

- `post.draft.created|updated`
- `post.published`

### 9) Post Detail (`/p/:slug`)

```text
TopBar
[ArticleView 760xauto] (title, author, tags, body)
Right 416px:
  [ProvenanceCard 416x120] (sha, signer_fpr, citations)
  [RelatedPane 416x240] (Hybrid RAG: Vector|Graph|Both)
  [Comments 416x200]
```

TriRPC calls:

- `publish.get({slug})`
- `search.unified({q:auto-from-body})`
- `publish.react({postId,type})`
- `publish.comment.add|list`

Journal events:

- `post.view`
- `post.react.liked|bookmark.added`
- `comment.added`

## Alignment summary

These screens align the IBM knowledge architecture with the portal in the following way:

- Knowledge Management / Content System -> Research, Reader, Stories, Profile, Composer, Post Detail
- Common Query Language / Ontology / Graph / Enrichment -> QueryBar + Unified Search + Reader Provenance + Stories + Research Enrich actions
- Unified Data Services / Governance / Data Lake -> Catalog, Project Notebook, KPI cards, DataWave-backed metadata and metrics
- Hybrid Data Mgmt / Security / Control Plane -> Deployments, Attestations, Drift, Console
- Journaled memory -> Every screen above emits events into Kappa and can be revisited from Journal

Rumin and Cotoami ideas are reflected in the Research -> Reader -> Stories -> Publish flow:

- capture first, connect later;
- frictionless saved views / weekly review;
- lightweight linking of uncertain relationships;
- stories as references to immutable events, not rewrites of source truth.
