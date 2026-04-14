# First slice: GitHub source object to canonical reusable knowledge

## Goal

Prove the minimal AOKC runtime path with one source system, one descriptor registration flow, one governed order flow, and one optional execution bridge.

## Input

A GitHub-backed source object such as:
- `SocioProphet/agentplane/docs/system-space.md`

## Steps

### 1. Ingest source object
The runtime reads a GitHub object and extracts:
- repo
- path
- ref
- content hash
- source metadata

### 2. Build `GeneralDescriptor`
The runtime constructs a `GeneralDescriptor` using:
- object type
- source system and source ref
- ownership and stewardship refs
- content space and task relationships
- policy bindings
- provenance evidence refs

### 3. Register descriptor
The runtime calls the staged typed transport surface:
- `DescriptorService.RegisterGeneralDescriptor`

Expected output:
- stable `descriptorId`
- registration status

### 4. Build `OrderDescriptor`
If canonical promotion is required, the runtime builds an `AssetPromotionOrder`.

### 5. Validate order
The runtime calls:
- `OrderService.CreateOrder`
- `OrderService.ValidateOrder`

Expected outputs:
- stable `orderId`
- validation result
- completed checks
- failed checks if any
- evidence refs

### 6. Optional execution bridge
If the action requires governed execution, the runtime resolves the order through:
- `ExecutionBridgeService.ResolveOrderToBundle`

The execution bridge hands only execution-relevant fields into `agentplane`.

### 7. Preserve evidence
The runtime persists:
- `descriptorId`
- `orderId`
- evidence refs
- resulting artifact refs

### 8. Publish and project
The runtime makes the resulting canonical unit retrievable by:
- descriptor id
- task
- content space
- PARA projection

## Success condition

The slice is successful when one GitHub source object can move through descriptor registration, governed order creation/validation, optional execution bridging, and stable evidence linkage without inventing any new contract surface.
