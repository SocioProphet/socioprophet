FROM alpine:3.20

ARG COSIGN_VER=v2.4.1
ARG SYFT_VER=v1.39.0
ARG TRIVY_VER=0.68.1
ARG CRANE_VER=v0.20.6

RUN apk add --no-cache ca-certificates curl bash jq git skopeo openssl \
 && update-ca-certificates

# Detect arch inside the image (aarch64 or x86_64)
RUN ARCH="$(apk --print-arch)" \
 && case "$ARCH" in \
      aarch64) COSIGN_ARCH=arm64; SYFT_ARCH=arm64; TRIVY_ARCH=ARM64; CRANE_ARCH=arm64 ;; \
      x86_64)  COSIGN_ARCH=amd64; SYFT_ARCH=amd64; TRIVY_ARCH=64bit; CRANE_ARCH=x86_64 ;; \
      *) echo "Unsupported arch: $ARCH" && exit 1 ;; \
    esac \
 && echo "Using arch: $ARCH (cosign=$COSIGN_ARCH syft=$SYFT_ARCH trivy=$TRIVY_ARCH crane=$CRANE_ARCH)" \
 \
 # cosign
 && curl -fsSL -o /usr/local/bin/cosign "https://github.com/sigstore/cosign/releases/download/${COSIGN_VER}/cosign-linux-${COSIGN_ARCH}" \
 && chmod +x /usr/local/bin/cosign \
 \
 # syft
 && cd /tmp \
 && curl -fsSL -o syft.tgz "https://github.com/anchore/syft/releases/download/${SYFT_VER}/syft_${SYFT_VER#v}_linux_${SYFT_ARCH}.tar.gz" \
 && tar -xzf syft.tgz syft \
 && mv syft /usr/local/bin/syft \
 && chmod +x /usr/local/bin/syft \
 && rm -f syft.tgz \
 \
 # trivy (naming differs: 64bit vs ARM64)
 && cd /tmp \
 && if [ "$TRIVY_ARCH" = "ARM64" ]; then \
      TRIVY_URL="https://github.com/aquasecurity/trivy/releases/download/v${TRIVY_VER}/trivy_${TRIVY_VER}_Linux-ARM64.tar.gz"; \
    else \
      TRIVY_URL="https://github.com/aquasecurity/trivy/releases/download/v${TRIVY_VER}/trivy_${TRIVY_VER}_Linux-64bit.tar.gz"; \
    fi \
 && curl -fsSL -o trivy.tgz "$TRIVY_URL" \
 && tar -xzf trivy.tgz trivy \
 && mv trivy /usr/local/bin/trivy \
 && chmod +x /usr/local/bin/trivy \
 && rm -f trivy.tgz \
 \
 # crane (naming differs: x86_64 vs arm64)
 && cd /tmp \
 && if [ "$CRANE_ARCH" = "arm64" ]; then \
      CRANE_URL="https://github.com/google/go-containerregistry/releases/download/${CRANE_VER}/go-containerregistry_Linux_arm64.tar.gz"; \
    else \
      CRANE_URL="https://github.com/google/go-containerregistry/releases/download/${CRANE_VER}/go-containerregistry_Linux_x86_64.tar.gz"; \
    fi \
 && curl -fsSL -o crane.tgz "$CRANE_URL" \
 && tar -xzf crane.tgz crane \
 && mv crane /usr/local/bin/crane \
 && chmod +x /usr/local/bin/crane \
 && rm -f crane.tgz

ENTRYPOINT ["/bin/bash","-lc"]
