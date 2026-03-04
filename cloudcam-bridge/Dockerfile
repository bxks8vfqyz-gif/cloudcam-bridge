ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base:latest
FROM ${BUILD_FROM}

RUN apk add --no-cache python3 py3-pip ffmpeg curl bash nodejs npm

# Install go2rtc
ARG GO2RTC_VERSION=1.9.4
ARG TARGETARCH
RUN case "${TARGETARCH}" in \
    "amd64")          GO2RTC_ARCH="amd64" ;; \
    "arm64"|"aarch64") GO2RTC_ARCH="arm64" ;; \
    "arm"|"armv7")     GO2RTC_ARCH="arm"   ;; \
    *)                GO2RTC_ARCH="amd64" ;; \
    esac && \
    curl -L "https://github.com/AlexxIT/go2rtc/releases/download/v${GO2RTC_VERSION}/go2rtc_linux_${GO2RTC_ARCH}" \
    -o /usr/local/bin/go2rtc && chmod +x /usr/local/bin/go2rtc

COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages -r /app/backend/requirements.txt

COPY backend/ /app/backend/
COPY frontend/dist/ /app/frontend/dist/

COPY run.sh /run.sh
RUN chmod +x /run.sh

RUN mkdir -p /data
WORKDIR /app
CMD ["/run.sh"]
