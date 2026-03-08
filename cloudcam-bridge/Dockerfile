ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base:latest
FROM ${BUILD_FROM}

RUN apk add --no-cache python3 py3-pip ffmpeg curl bash nodejs npm jq

# Install go2rtc
ARG GO2RTC_VERSION=1.9.14
ARG BUILD_ARCH=amd64
RUN case "${BUILD_ARCH}" in \
    "amd64")    GO2RTC_ARCH="amd64" ;; \
    "aarch64")  GO2RTC_ARCH="arm64" ;; \
    *)          GO2RTC_ARCH="amd64" ;; \
    esac && \
    curl -L "https://github.com/AlexxIT/go2rtc/releases/download/v${GO2RTC_VERSION}/go2rtc_linux_${GO2RTC_ARCH}" \
    -o /usr/local/bin/go2rtc && chmod +x /usr/local/bin/go2rtc

COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages -r /app/backend/requirements.txt

# Build frontend
COPY frontend/package.json frontend/package-lock.json* /app/frontend/
WORKDIR /app/frontend
RUN npm install --production=false && npm cache clean --force
COPY frontend/ /app/frontend/
RUN npm run build && rm -rf node_modules src package.json package-lock.json vite.config.js

COPY backend/ /app/backend/

COPY run.sh /
RUN chmod +x /run.sh

RUN mkdir -p /data
WORKDIR /app
CMD ["/run.sh"]
