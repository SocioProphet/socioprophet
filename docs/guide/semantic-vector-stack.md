# Semantic Vector Stack

This guide records the current semantic graph state and the next target state for vector generation.

## Current state

Today the public graph bootstrap is still relatively simple:

- curated topology comes from `config/surfaces.json`
- `scripts/build_surface_inventory.py` emits nodes, curated links, constituent links, and `vector_links`
- the current vector similarity is bootstrap-grade and ontology-derived rather than a full semantic embedding ensemble
- homepage rollout order currently depends on site/graph ordering and `map_priority`

This is acceptable as a temporary substrate, but it is not the intended final semantic stack.

## Target state

The next semantic pass must explicitly support all of the following:

### 1. Doc2Vec surface vectors
Each surface, doctrine page, and canonical long-form artifact must have a document vector suitable for cross-surface semantic comparison and graph weighting.

### 2. Word2Vec base vectors and subvectors
We does not stop at a single token space. We supports word2vec-derived subvectors for:
- topic constituents
- domain lexicons
- phrase/bigram/trigram expansions
- surface-specific concept families
- ontology label/alias clusters

### 3. LSA basis vectors
The semantic pipeline must expose an LSA basis representation rather than only a flat similarity score.

### 4. Aligned 23rd-channel variants over the latent LSA 22 basis

The 23rd channel must not be modeled as only one LDA output. It must be modeled as aligned variants over the same latent family so we can compare how the 23rd channel behaves across closed, bridging, and open topic regimes:

- **LSA23** — a closed summary channel over the fixed latent LSA 22 basis
- **LSI23** — a bridge channel that maps from local closed topic sets into broader shifting neighborhoods
- **LDA23** — an open topic channel that can continue expanding beyond the fixed basis family

The 22 basis vectors remain the contributing latent basis. The comparison happens at the **23rd channel level**, where we can observe how closed, bridging, and open topic behavior diverges.


## Ensemble design direction

The graph must eventually support a fused similarity model built from multiple channels:

- curated semantic topology
- doc2vec document embeddings
- word2vec base vectors
- word2vec subvectors
- LSA basis channels
- LDA topic channel
- ontology constraints and governance weighting

The result must not be one opaque score. It must be a composable semantic evidence stack.

## Output expectations

The next vector pipeline emit more than one similarity artifact. At minimum it must emit:

- per-surface vector artifacts
- channel-specific similarities
- fused similarities
- subvector families
- topic weights
- basis coordinates
- graph-ready edge bundles
- replayable build metadata

## Build discipline

This work is documented and reproducible. The docs must say what the vectors mean, what each channel captures, and how rollout order, graph layout, and explorer modes consume those artifacts.

## Closed / bridge / open interpretation

**LSA** is treated as a closed set for a fixed decomposition.

**LSI** is treated as a bridge between closed local topic structure and broader evolving semantic neighborhoods.

**LDA** is treated as an open-ended topic family rather than a closed finite basis.
