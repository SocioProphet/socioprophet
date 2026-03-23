# Hybrid Representation Builder

The platform does not stop at one semantic method. It must build a governed representation ensemble.

## Input

Each corpus artifact can emit multiple channels from a shared substrate.

Let the input representation be:

$$
x \in \mathbb{R}^{d}
$$

## Channel families

### Doc2Vec
A document encoder produces a document-level embedding:

$$
r_{\mathrm{d2v}} = E_{\mathrm{d2v}}(d)
$$

### Word2Vec and subvectors
Base token embeddings can be aggregated into subvector families:

$$
r_{\mathrm{w2v}}^{(g)} = \frac{1}{|g|}\sum_{w \in g} e(w)
$$

where $g$ may be a topic constituent group, phrase family, ontology label family, or another controlled subvector set.

### LSI
Linear projection channel:

$$
r_{\mathrm{lsi}} = W_{\mathrm{lsi}} x
$$

### LDA
Bayesian topic inference channel:

$$
r_{\mathrm{lda}} = \mathrm{Infer}(x)
$$

### Neural
Neural semantic encoder:

$$
r_{\mathrm{nn}} = \sigma(Wx + b)
$$

## Fusion

The platform supports a fused representation rather than a single opaque score:

$$
r_{\mathrm{fusion}} = r_{\mathrm{d2v}} \oplus r_{\mathrm{w2v}} \oplus r_{\mathrm{lsi}} \oplus r_{\mathrm{lda}} \oplus r_{\mathrm{nn}}
$$

where $\oplus$ denotes controlled channel composition rather than naive concatenation by default.

## Outputs

These channels feeds downstream capabilities:

- similarity
- clustering
- labeling
- monitoring
- graph edge construction
- temporal topology evolution

## Governance requirement

A hybrid builder remains auditable. The platform can say:

- which channels contributed
- what each channel means
- what changed between builds
- how graph edges were derived
- what evidence supports the semantic result
