# Support-plane deployment

This is the reference support plane for the staged OpenClaw integration pack.

Included services:
- Postgres for LiteLLM database-backed proxy state
- LiteLLM proxy
- Qdrant
- Ollama
- vLLM
- distiller service
- reasoner service

This deployment file is intended for local or trusted-host bring-up during the first proof pass. It is not a claim of production hardening.
