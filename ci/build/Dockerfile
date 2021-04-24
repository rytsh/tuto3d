FROM frolvlad/alpine-glibc

LABEL maintainer="eates23@gmail.com"

RUN apk add --no-cache \
    bash nodejs-current npm git curl zip && \
    curl -f https://get.pnpm.io/v6.js | node - add --global pnpm && \
    curl -fsSL https://deno.land/x/install/install.sh | sh

ENV DENO_INSTALL "/root/.deno"
ENV PATH "${DENO_INSTALL}/bin:${PATH}"

WORKDIR /workspace
