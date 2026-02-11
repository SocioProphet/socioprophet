# CI: License gate (example)

We add a job that:
1) parses registry/agentos-tool-registry.yaml
2) fails if any tool marked RED appears in `base_image_tools`
3) fails if any tool has `license_source: unknown`

Implementation can be a small Python script run in CI.

