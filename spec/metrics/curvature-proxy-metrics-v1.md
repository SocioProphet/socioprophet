# Curvature Proxy Metrics v1

This specification defines product-facing proxy metrics for concentration, suppression, unverifiable authority, and replay failure.

## Metric catalog

Examples include:

- concentration of consequential decisions in too few actors or systems
- ratio of denials without sufficient evidence references
- rate of replay failure across critical workflows
- ratio of unverifiable summary outputs to evidence-linked outputs
- concentration of publication or moderation actions in too few review paths

## Collection strategy

Metrics should be computable from product-visible events, governance events, denial surfaces, and replay surfaces.
They should not depend on hidden operator-only dashboards.

## Threshold guidance

Thresholds should be defined by domain and reviewed over time.
The important point is not one magic number; it is durable visibility into when authority or suppression is concentrating.

## Dashboard and alert notes

Metrics should support:

- trend view over time
- segmentation by product surface
- review when thresholds are exceeded
- linkage back to the relevant evidence or event history
