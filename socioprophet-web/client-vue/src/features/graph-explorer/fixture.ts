/**
 * Offline / test fixture for the Graph Explorer.
 *
 * The surface graph is a faithful, compact subset of the generated Prophet Platform surface
 * ontology (`marketing/public/assets/surface-graph.json`) — 8 core surfaces, their curated
 * links, and a slice of topic constituents. It is the deterministic fallback used when neither
 * HellGraph nor the bundled `/assets/surface-graph.json` is reachable, and the seed for tests.
 *
 * The runtime topology is a Kiali-style snapshot: per-surface health + traffic that the panel
 * overlays onto the ontology nodes. `live` is intentionally degraded and `cloud` is down so the
 * overlay has something to mark; wiring these to real telemetry is the follow-up (see PR body).
 */
import type { RuntimeTopology, SurfaceGraph } from './types';

export const SURFACE_GRAPH_FIXTURE: SurfaceGraph = {
  "version": 1,
  "nodes": [
    {
      "id": "academy",
      "type": "surface",
      "label": "Academy",
      "category": "learning",
      "status": "live",
      "graph_group": "core",
      "description": "Learning, family, mentorship, and cybernetics education.",
      "landing_page": "/academy/",
      "docs_path": "/documentation/guide/products/academy/",
      "audiences": [
        "learners",
        "families",
        "mentors",
        "educators"
      ],
      "topic_constituents": [
        "learning",
        "family",
        "mentorship",
        "cybernetics",
        "safeguarding"
      ],
      "normalized_topics": [
        "learning",
        "education",
        "capability",
        "trust",
        "safeguarding"
      ],
      "related_surfaces": [
        "documentation",
        "organizations",
        "digital-trust"
      ],
      "related_sites": [
        "https://socioprophet.com/documentation/guide/products/academy/",
        "https://socioprophet.com/documentation/guide/academy-safeguarding-and-minor-protection/"
      ],
      "investor_overlay": {
        "lens": "capability_compounding",
        "value_drivers": [
          "learner_retention",
          "mentor_supply",
          "cohort_completion",
          "trust"
        ],
        "economic_profit_proxy": [
          "retention_quality",
          "conversion_readiness",
          "trust_signal"
        ]
      }
    },
    {
      "id": "organizations",
      "type": "surface",
      "label": "Organizations",
      "category": "deployment",
      "status": "live",
      "graph_group": "core",
      "description": "Institutional deployment for schools, nonprofits, public-interest, and mission-aligned organizations.",
      "landing_page": "/organizations/",
      "docs_path": null,
      "audiences": [
        "schools",
        "nonprofits",
        "public-sector",
        "employers"
      ],
      "topic_constituents": [
        "deployment",
        "institutions",
        "governance",
        "public-interest",
        "secure-training"
      ],
      "normalized_topics": [
        "deployment",
        "institutions",
        "governance",
        "trust",
        "capability"
      ],
      "related_surfaces": [
        "academy",
        "documentation",
        "digital-trust",
        "medical",
        "law"
      ],
      "related_sites": [
        "https://socioprophet.com/documentation/guide/surface-inventory/",
        "https://socioprophet.com/documentation/guide/domain-surface/"
      ],
      "investor_overlay": {
        "lens": "deployment_compounding",
        "value_drivers": [
          "institutional_conversion",
          "deployment_retention",
          "pipeline_value",
          "trust"
        ],
        "economic_profit_proxy": [
          "deployment_readiness",
          "account_quality",
          "trust_signal"
        ]
      }
    },
    {
      "id": "documentation",
      "type": "surface",
      "label": "Documentation",
      "category": "docs",
      "status": "live",
      "graph_group": "core",
      "description": "Architecture, products, trust model, and canonical direction.",
      "landing_page": null,
      "docs_path": "/",
      "audiences": [
        "builders",
        "operators",
        "researchers",
        "partners"
      ],
      "topic_constituents": [
        "architecture",
        "products",
        "trust",
        "guides",
        "reference"
      ],
      "normalized_topics": [
        "architecture",
        "reference",
        "trust",
        "platform",
        "governance"
      ],
      "related_surfaces": [
        "academy",
        "organizations",
        "ai",
        "developer",
        "cloud",
        "live",
        "medical",
        "law",
        "wiki",
        "blog",
        "digital-trust"
      ],
      "related_sites": [
        "https://socioprophet.com/documentation/",
        "https://socioprophet.com/documentation/guide/canonical-platform-direction/"
      ],
      "investor_overlay": {
        "lens": "discovery_compounding",
        "value_drivers": [
          "qualified_discovery",
          "builder_activation",
          "trust_signal"
        ],
        "economic_profit_proxy": [
          "qualified_traffic",
          "activation",
          "reference_depth"
        ]
      }
    },
    {
      "id": "ai",
      "type": "surface",
      "label": "AI Platform",
      "category": "technical",
      "status": "stub",
      "graph_group": "expanding",
      "description": "Model, agent, orchestration, and trust-layer capabilities.",
      "landing_page": null,
      "docs_path": "/documentation/guide/products/ai/",
      "audiences": [
        "builders",
        "operators"
      ],
      "topic_constituents": [
        "agents",
        "models",
        "automation",
        "tooling"
      ],
      "normalized_topics": [
        "intelligence",
        "platform",
        "automation",
        "builders",
        "trust"
      ],
      "related_surfaces": [
        "developer",
        "cloud",
        "live",
        "documentation"
      ],
      "related_sites": [
        "https://socioprophet.com/documentation/guide/products/ai/"
      ],
      "investor_overlay": {
        "lens": "technical_optionality",
        "value_drivers": [
          "agent_capability",
          "integration_relevance",
          "trustability"
        ],
        "economic_profit_proxy": [
          "technical_reuse",
          "surface_pull",
          "platform_option_value"
        ]
      }
    },
    {
      "id": "developer",
      "type": "surface",
      "label": "Developer",
      "category": "technical",
      "status": "stub",
      "graph_group": "expanding",
      "description": "SDKs, APIs, integration patterns, and developer workflows.",
      "landing_page": null,
      "docs_path": "/documentation/guide/products/dev/",
      "audiences": [
        "builders",
        "integrators"
      ],
      "topic_constituents": [
        "apis",
        "sdk",
        "tooling",
        "integration"
      ],
      "normalized_topics": [
        "platform",
        "builders",
        "integration",
        "capability",
        "apis"
      ],
      "related_surfaces": [
        "ai",
        "cloud",
        "live",
        "documentation"
      ],
      "related_sites": [
        "https://socioprophet.com/documentation/guide/products/dev/"
      ],
      "investor_overlay": {
        "lens": "developer_compounding",
        "value_drivers": [
          "integration_depth",
          "sdk_adoption",
          "builder_retention"
        ],
        "economic_profit_proxy": [
          "adoption_quality",
          "integration_count",
          "reuse"
        ]
      }
    },
    {
      "id": "cloud",
      "type": "surface",
      "label": "Cloud Suite",
      "category": "technical",
      "status": "stub",
      "graph_group": "expanding",
      "description": "Hosted and managed operational capabilities.",
      "landing_page": null,
      "docs_path": "/documentation/guide/products/cloud/",
      "audiences": [
        "operators",
        "partners"
      ],
      "topic_constituents": [
        "hosting",
        "managed-services",
        "deployment",
        "operations"
      ],
      "normalized_topics": [
        "platform",
        "operations",
        "deployment",
        "trust",
        "hosting"
      ],
      "related_surfaces": [
        "ai",
        "developer",
        "live",
        "documentation"
      ],
      "related_sites": [
        "https://socioprophet.com/documentation/guide/products/cloud/"
      ],
      "investor_overlay": {
        "lens": "managed_service_compounding",
        "value_drivers": [
          "operational_reuse",
          "deployment_scale",
          "service_trust"
        ],
        "economic_profit_proxy": [
          "utilization",
          "retention",
          "deployment_efficiency"
        ]
      }
    },
    {
      "id": "digital-trust",
      "type": "surface",
      "label": "Digital / Trust",
      "category": "trust",
      "status": "stub",
      "graph_group": "trust",
      "description": "Trust-first positioning, digital identity, and public-facing trust surfaces.",
      "landing_page": null,
      "docs_path": "/documentation/guide/domain-surface/",
      "audiences": [
        "operators",
        "partners",
        "public"
      ],
      "topic_constituents": [
        "identity",
        "trust",
        "governance",
        "public-positioning"
      ],
      "normalized_topics": [
        "trust",
        "governance",
        "identity",
        "platform",
        "public-positioning"
      ],
      "related_surfaces": [
        "documentation",
        "organizations",
        "academy",
        "law",
        "medical"
      ],
      "related_sites": [
        "https://socioprophet.com/documentation/guide/domain-surface/"
      ],
      "investor_overlay": {
        "lens": "trust_compounding",
        "value_drivers": [
          "identity_clarity",
          "governance_signal",
          "trustability"
        ],
        "economic_profit_proxy": [
          "trust_signal",
          "identity_coherence",
          "partner_readiness"
        ]
      }
    },
    {
      "id": "investor",
      "type": "surface",
      "label": "Investor",
      "category": "governance",
      "status": "stub",
      "graph_group": "support",
      "description": "Investor and governance-facing public materials.",
      "landing_page": "/investor/",
      "docs_path": null,
      "audiences": [
        "investors",
        "governance"
      ],
      "topic_constituents": [
        "governance",
        "capital",
        "platform-direction"
      ],
      "normalized_topics": [
        "capital",
        "governance",
        "value-creation",
        "platform",
        "trust"
      ],
      "related_surfaces": [
        "documentation",
        "organizations",
        "digital-trust"
      ],
      "related_sites": [
        "/investor/",
        "/map/"
      ],
      "investor_overlay": {
        "lens": "economic_profit",
        "value_drivers": [
          "nopat",
          "invested_capital",
          "capital_charge",
          "surface_contribution"
        ],
        "economic_profit_proxy": [
          "value_creation_signal",
          "platform_compounding",
          "trust_quality"
        ]
      }
    },
    {
      "id": "topic:agents",
      "type": "topic",
      "label": "agents",
      "category": "topic"
    },
    {
      "id": "topic:apis",
      "type": "topic",
      "label": "apis",
      "category": "topic"
    },
    {
      "id": "topic:architecture",
      "type": "topic",
      "label": "architecture",
      "category": "topic"
    },
    {
      "id": "topic:capital",
      "type": "topic",
      "label": "capital",
      "category": "topic"
    },
    {
      "id": "topic:deployment",
      "type": "topic",
      "label": "deployment",
      "category": "topic"
    },
    {
      "id": "topic:family",
      "type": "topic",
      "label": "family",
      "category": "topic"
    },
    {
      "id": "topic:governance",
      "type": "topic",
      "label": "governance",
      "category": "topic"
    },
    {
      "id": "topic:hosting",
      "type": "topic",
      "label": "hosting",
      "category": "topic"
    },
    {
      "id": "topic:identity",
      "type": "topic",
      "label": "identity",
      "category": "topic"
    },
    {
      "id": "topic:institutions",
      "type": "topic",
      "label": "institutions",
      "category": "topic"
    },
    {
      "id": "topic:learning",
      "type": "topic",
      "label": "learning",
      "category": "topic"
    },
    {
      "id": "topic:managed-services",
      "type": "topic",
      "label": "managed-services",
      "category": "topic"
    },
    {
      "id": "topic:models",
      "type": "topic",
      "label": "models",
      "category": "topic"
    },
    {
      "id": "topic:products",
      "type": "topic",
      "label": "products",
      "category": "topic"
    },
    {
      "id": "topic:sdk",
      "type": "topic",
      "label": "sdk",
      "category": "topic"
    },
    {
      "id": "topic:trust",
      "type": "topic",
      "label": "trust",
      "category": "topic"
    }
  ],
  "links": {
    "curated": [
      {
        "source": "academy",
        "target": "documentation",
        "type": "curated"
      },
      {
        "source": "academy",
        "target": "organizations",
        "type": "curated"
      },
      {
        "source": "academy",
        "target": "digital-trust",
        "type": "curated"
      },
      {
        "source": "documentation",
        "target": "organizations",
        "type": "curated"
      },
      {
        "source": "digital-trust",
        "target": "organizations",
        "type": "curated"
      },
      {
        "source": "ai",
        "target": "documentation",
        "type": "curated"
      },
      {
        "source": "developer",
        "target": "documentation",
        "type": "curated"
      },
      {
        "source": "cloud",
        "target": "documentation",
        "type": "curated"
      },
      {
        "source": "digital-trust",
        "target": "documentation",
        "type": "curated"
      },
      {
        "source": "ai",
        "target": "developer",
        "type": "curated"
      },
      {
        "source": "ai",
        "target": "cloud",
        "type": "curated"
      },
      {
        "source": "cloud",
        "target": "developer",
        "type": "curated"
      },
      {
        "source": "documentation",
        "target": "investor",
        "type": "curated"
      },
      {
        "source": "investor",
        "target": "organizations",
        "type": "curated"
      },
      {
        "source": "digital-trust",
        "target": "investor",
        "type": "curated"
      }
    ],
    "constituent": [
      {
        "source": "academy",
        "target": "topic:learning",
        "type": "constituent"
      },
      {
        "source": "academy",
        "target": "topic:family",
        "type": "constituent"
      },
      {
        "source": "organizations",
        "target": "topic:deployment",
        "type": "constituent"
      },
      {
        "source": "organizations",
        "target": "topic:institutions",
        "type": "constituent"
      },
      {
        "source": "documentation",
        "target": "topic:architecture",
        "type": "constituent"
      },
      {
        "source": "documentation",
        "target": "topic:products",
        "type": "constituent"
      },
      {
        "source": "ai",
        "target": "topic:agents",
        "type": "constituent"
      },
      {
        "source": "ai",
        "target": "topic:models",
        "type": "constituent"
      },
      {
        "source": "developer",
        "target": "topic:apis",
        "type": "constituent"
      },
      {
        "source": "developer",
        "target": "topic:sdk",
        "type": "constituent"
      },
      {
        "source": "cloud",
        "target": "topic:hosting",
        "type": "constituent"
      },
      {
        "source": "cloud",
        "target": "topic:managed-services",
        "type": "constituent"
      },
      {
        "source": "digital-trust",
        "target": "topic:identity",
        "type": "constituent"
      },
      {
        "source": "digital-trust",
        "target": "topic:trust",
        "type": "constituent"
      },
      {
        "source": "investor",
        "target": "topic:governance",
        "type": "constituent"
      },
      {
        "source": "investor",
        "target": "topic:capital",
        "type": "constituent"
      }
    ]
  }
};

export const RUNTIME_TOPOLOGY_FIXTURE: RuntimeTopology = {
  source: "fixture",
  nodes: [
    { id: "academy", health: "healthy", service: "academy-web", rps: 42, errorRate: 0.002, p95Ms: 180 },
    { id: "organizations", health: "healthy", service: "org-portal", rps: 28, errorRate: 0.004, p95Ms: 210 },
    { id: "documentation", health: "healthy", service: "docs-site", rps: 65, errorRate: 0.001, p95Ms: 95 },
    { id: "ai", health: "healthy", service: "hellgraph-service", rps: 120, errorRate: 0.006, p95Ms: 320 },
    { id: "developer", health: "healthy", service: "catalog-gateway", rps: 34, errorRate: 0.003, p95Ms: 140 },
    { id: "cloud", health: "down", service: "cloud-broker", rps: 0, errorRate: 1, p95Ms: 0 },
    { id: "digital-trust", health: "healthy", service: "guardrail-fabric", rps: 18, errorRate: 0.005, p95Ms: 260 },
    { id: "investor", health: "degraded", service: "economic-prophet", rps: 9, errorRate: 0.11, p95Ms: 940 },
  ],
  edges: [
    { source: "ai", target: "developer", rps: 22, errorRate: 0.004 },
    { source: "developer", target: "cloud", rps: 5, errorRate: 0.8 },
    { source: "academy", target: "documentation", rps: 30, errorRate: 0.001 },
    { source: "investor", target: "ai", rps: 6, errorRate: 0.09 },
  ],
};
