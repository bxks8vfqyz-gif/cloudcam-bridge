#!/usr/bin/env bash
set -e
CONFIG_DIR="/addon_configs/cloudcam-bridge"
DATA_FILE="${CONFIG_DIR}/cameras.json"
GO2RTC_CONFIG="${CONFIG_DIR}/go2rtc.yaml"
ONVIF_USERNAME=$(bashio::config 'onvif_username')
ONVIF_PASSWORD=$(bashio::config 'onvif_password')
LOG_LEVEL=$(bashio::config 'log_level')
mkdir -p "${CONFIG_DIR}"
[ ! -f "${DATA_FILE}" ] && echo '{"cameras":[]}' > "${DATA_FILE}"
if [ ! -f "${GO2RTC_CONFIG}" ]; then
  printf 'api:\n  listen: 127.0.0.1:1984\nrtsp:\n  listen: 127.0.0.1:8554\nlog:\n  level: warn\nstreams: {}\n' > "${GO2RTC_CONFIG}"
fi
bashio::log.info "Starting go2rtc..."
go2rtc -config "${GO2RTC_CONFIG}" &
sleep 2
bashio::log.info "Starting CloudCam Bridge..."
exec python3 /app/backend/main.py \
    --data-file "${DATA_FILE}" \
    --go2rtc-config "${GO2RTC_CONFIG}" \
    --host "0.0.0.0" --port 8080 \
    --onvif-username "${ONVIF_USERNAME}" \
    --onvif-password "${ONVIF_PASSWORD}" \
    --log-level "${LOG_LEVEL}"
