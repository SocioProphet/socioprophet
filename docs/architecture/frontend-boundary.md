# Frontend Boundary

The forward UI stack is Vue/Vite-based and is integrated into the monorepo side-by-side with the legacy React implementation.

The frontend boundary should centralize:
- auth/session state
- portal-shell routing
- backend/API adapters
- future TriTRPC-aligned transport

The boundary should avoid one-off fetch-call sprawl and should preserve typed, inspectable request/response behavior.
