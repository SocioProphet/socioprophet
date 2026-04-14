# Temporary code layout note

## Purpose

The `aokc-runtime/` directory is a temporary umbrella-repo incubator.
It is not yet the final package layout of the dedicated commons runtime repository.

## Current constraint

The bootstrap stubs in this directory are code-facing starter sketches.
They should be treated as temporary scaffolding until the runtime is extracted into its own repository and package layout is normalized.

## Target normalization

When the dedicated commons runtime repository is created, the code layout should be normalized into a package-friendly structure such as:
- `aokc_runtime/connectors/`
- `aokc_runtime/descriptors/`
- `aokc_runtime/orders/`
- `aokc_runtime/transport/`
- `aokc_runtime/bridge/`
- `aokc_runtime/evidence/`
- `aokc_runtime/index/`

## Rule

Do not treat the temporary bootstrap directory structure as the final package boundary. Treat it as a staging surface for the first end-to-end slice.
