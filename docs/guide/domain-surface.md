# Domain surface & routing policy

## Canonical brand
- **SocioProphet.com** is the canonical public brand entrypoint.
- **SocioProphet.ai** is a product surface (not the brand home).

## Privilege classes (least privilege)
- **Public / indexable:** marketing + docs + knowledge
- **Authenticated (user):** portal and premium products
- **Authenticated (operator):** k3s digital twin / shell (separate realm)
- **Immutable artifacts:** signed builds/images

## SocioProphet domains

| Domain | Role | Privilege | Default web behavior |
|---|---|---:|---|
| socioprophet.com | Canonical marketing entrypoint | Public | **Primary** `/` landing, `/documentation` docs |
| socioprophet.ai | AI platform | Public→Premium | Redirect to product section until shipped |
| socioprophet.dev | Developer platform | Public | Redirect to `/documentation` |
| socioprophet.cloud | Hosted suite | Public→Premium | Redirect to product section until shipped |
| socioprophet.sh | Installers + cloud shell | Public→Operator | `/install` public, `/shell` gated |
| socioprophet.live | Live builds/boot images | Immutable | content-addressed + verify |
| socioprophet.io | I/O plane | Public→Premium | reserved (uploads/streams/ingestion) |
| socioprophet.academy | Education | Public→Accounts | public-first |
| socioprophet.md | Medical access | Public→Premium | free public + premium clinicians |
| socioprophet.law | AI law product | Public→Premium | public knowledge + gated practitioners |
| socioprophet.wiki | Knowledge product | Public | public-first |
| socioprophet.blog | Publishing | Public | static content |
| socioprophet.kr | Knowledge Representation | Public | specs/formalism |
| socioprophet.kg | Knowledge Graph | Public→Premium | explorer/API later |

## Socios domains

| Domain | Role | Privilege | Default web behavior |
|---|---|---:|---|
| socios.host | k3s digital twin + resilience | Operator | separate auth realm |
| socios.dev | commons dev tooling | Public | redirect initially |
| socioslinux.com | OS public face | Public | separate project |

## Truthorbot domains

| Domain | Role | Privilege | Default web behavior |
|---|---|---:|---|
| truthorbot.org/.net | adversarial evaluation lab | Public | static-only |

## Enforcement rules
1) One canonical brand root: socioprophet.com
2) Redirect-first until a product exists
3) Separate auth realms: portal vs operator vs regulated surfaces
4) Immutable artifact hosting: signed, content-addressed
