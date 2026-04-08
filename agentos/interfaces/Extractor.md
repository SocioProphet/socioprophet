# Extractor Interface

## Purpose
Transform unstructured inputs into structured artifacts and feed MemoryAPI.

## Inputs
- text documents, PDFs, images, HTML, repos

## Outputs
- JSON objects conforming to a schema
- provenance bundle: source hash + extraction config + model/tool versions

## Example providers
OntoGPT (text->ontology/schema), VLM Run Hub schemas (vision->schema), Skill Seekers (RAG prep).
