# LSA / LSI / LDA Geometry

This guide records the platform's intended interpretation of LSA, LSI, and LDA.

## Integer substrate

The semantic stack begins on a discrete substrate: characters, tokens, counts, and document-term structure.

We can represent the corpus as a weighted matrix:

$$
A \in \mathbb{R}^{m \times n}
$$

where $m$ is the vocabulary dimension and $n$ is the document dimension.

## LSA as a closed latent basis

For LSA we compute a truncated singular value decomposition:

$$
A \approx U_k \Sigma_k V_k^{\top}
$$

In this platform's conceptual model, **LSA is the closed latent basis**. Once $k$ is fixed, we are working inside a bounded latent vector regime.

This makes LSA well suited for:

- deterministic linear-algebraic compression
- similarity
- clustering
- reconstruction-aware semantic analysis

## LSI as the bridge regime

In this platform's model, **LSI is not identical to LSA in role**, even though both depend on truncated SVD ideas.

LSI is the bridge between local closed structure and broader search/retrieval dynamics. It projects queries and documents into the latent space for operational retrieval:

$$
q' = q^{\top} U_k \Sigma_k^{-1}
$$

and document embeddings can be represented in the latent basis by:

$$
d_i = \Sigma_k V_{k,i}^{\top}
$$

So in our conceptual language:

- LSA = closed basis
- LSI = curved bridge between closed basis and broader retrieval space

## LDA as the open topic family

For LDA, documents are mixtures of topics and topics are distributions over words:

$$
\theta_d \sim \mathrm{Dir}(\alpha)
$$

$$
\phi_k \sim \mathrm{Dir}(\eta)
$$

$$
z_{d,n} \sim \mathrm{Cat}(\theta_d), \qquad
w_{d,n} \sim \mathrm{Cat}(\phi_{z_{d,n}})
$$

In this platform's conceptual model, **LDA is the open topic family**. It is the unbounded topic simplex beyond the fixed closed basis regime.

## Projection, annealing, diffusion

The diagrams imply three directional transformations:

### Projection
Move from discrete observed substrate into latent structure.

### Annealing
Smooth local noisy structure into stable closed latent basis.

### Diffusion
Open the closed latent basis outward into broader topic families and semantic drift.

## The aligned 23rd channels

The 22-basis regime remains the contributing latent family. The comparison happens at the 23rd channel:

$$
c_{23}^{LSA} = f_{23}(U_{22}, \Sigma_{22}, V_{22})
$$

$$
c_{23}^{LSI} = g_{23}(q, U_{22}, \Sigma_{22}, V_{22})
$$

$$
c_{23}^{LDA} = h_{23}(\theta, \phi, \alpha, \eta)
$$

These are aligned variants:

- **LSA23** = closed summary channel over the latent LSA-22 basis
- **LSI23** = bridge channel from local closed structure toward broader retrieval drift
- **LDA23** = open topic extension beyond the fixed latent basis family
