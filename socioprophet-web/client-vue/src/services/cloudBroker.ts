// cloudBroker — client mirror of noetica's cross-vendor service broker (cloud-broker.ts). Powers the Cloud panel:
// every cloud primitive is a commodity; we map it to each vendor and pick the cheapest compliant one. Vendor-agnostic.
export type ServiceKind = "object-store" | "kubernetes" | "dns" | "postgres" | "load-balancer" | "secrets";
export type Vendor = "gcp" | "aws" | "azure" | "ibm" | "oci" | "hetzner";
export type Residency = "EU" | "US" | "AU" | "UK" | "CA";

export interface ServiceOffering { provider: Vendor; kind: ServiceKind; primitive: string; unitPriceUsd: number; residency: Residency[] }

export const SERVICE_CATALOG: ServiceOffering[] = [
  { provider: "gcp", kind: "object-store", primitive: "Cloud Storage", unitPriceUsd: 0.020, residency: ["EU", "US", "AU", "UK", "CA"] },
  { provider: "aws", kind: "object-store", primitive: "S3", unitPriceUsd: 0.023, residency: ["EU", "US", "AU", "UK", "CA"] },
  { provider: "azure", kind: "object-store", primitive: "Blob Storage", unitPriceUsd: 0.018, residency: ["EU", "US", "AU", "UK", "CA"] },
  { provider: "ibm", kind: "object-store", primitive: "Cloud Object Storage", unitPriceUsd: 0.022, residency: ["EU", "US", "CA"] },
  { provider: "hetzner", kind: "object-store", primitive: "Object Storage", unitPriceUsd: 0.005, residency: ["EU"] },
  { provider: "gcp", kind: "kubernetes", primitive: "GKE", unitPriceUsd: 0.10, residency: ["EU", "US", "AU", "UK", "CA"] },
  { provider: "aws", kind: "kubernetes", primitive: "EKS", unitPriceUsd: 0.10, residency: ["EU", "US", "AU", "UK", "CA"] },
  { provider: "azure", kind: "kubernetes", primitive: "AKS", unitPriceUsd: 0.0, residency: ["EU", "US", "AU", "UK", "CA"] },
  { provider: "ibm", kind: "kubernetes", primitive: "IKS", unitPriceUsd: 0.10, residency: ["EU", "US", "CA"] },
  { provider: "gcp", kind: "postgres", primitive: "Cloud SQL", unitPriceUsd: 0.041, residency: ["EU", "US", "AU"] },
  { provider: "aws", kind: "postgres", primitive: "RDS", unitPriceUsd: 0.043, residency: ["EU", "US", "AU"] },
  { provider: "azure", kind: "postgres", primitive: "Azure DB for PostgreSQL", unitPriceUsd: 0.040, residency: ["EU", "US", "AU"] },
  { provider: "gcp", kind: "dns", primitive: "Cloud DNS", unitPriceUsd: 0.20, residency: ["EU", "US", "AU", "UK", "CA"] },
  { provider: "aws", kind: "dns", primitive: "Route 53", unitPriceUsd: 0.50, residency: ["EU", "US", "AU", "UK", "CA"] },
  { provider: "gcp", kind: "load-balancer", primitive: "Cloud Load Balancing", unitPriceUsd: 0.025, residency: ["EU", "US", "AU", "UK", "CA"] },
  { provider: "aws", kind: "load-balancer", primitive: "ELB", unitPriceUsd: 0.0225, residency: ["EU", "US", "AU", "UK", "CA"] },
  { provider: "azure", kind: "secrets", primitive: "Key Vault", unitPriceUsd: 0.03, residency: ["EU", "US", "AU", "UK", "CA"] },
  { provider: "gcp", kind: "secrets", primitive: "Secret Manager", unitPriceUsd: 0.06, residency: ["EU", "US", "AU", "UK", "CA"] },
];

export const KINDS: ServiceKind[] = ["object-store", "kubernetes", "postgres", "dns", "load-balancer", "secrets"];
export const VENDORS: Vendor[] = ["gcp", "aws", "azure", "ibm", "oci", "hetzner"];

export interface ServiceRequirement { kind: ServiceKind; residency?: Residency; exclude?: Vendor[] }

export function compareServices(kind: ServiceKind): ServiceOffering[] {
  return SERVICE_CATALOG.filter((o) => o.kind === kind).slice().sort((a, b) => a.unitPriceUsd - b.unitPriceUsd);
}
export function selectVendor(req: ServiceRequirement): ServiceOffering | null {
  let c = SERVICE_CATALOG.filter((o) => o.kind === req.kind);
  if (req.residency) c = c.filter((o) => o.residency.includes(req.residency!));
  if (req.exclude?.length) c = c.filter((o) => !req.exclude!.includes(o.provider));
  return c.sort((a, b) => a.unitPriceUsd - b.unitPriceUsd)[0] ?? null;
}
