#!/bin/bash
set -e

OPTIONS_FILE="/data/options.json"
CONFIG_DIR="/data"
DATA_FILE="${CONFIG_DIR}/cameras.json"
GO2RTC_CONFIG="${CONFIG_DIR}/go2rtc.yaml"

ONVIF_USERNAME=$(jq -r '.onvif_username' "$OPTIONS_FILE")
ONVIF_PASSWORD=$(jq -r '.onvif_password' "$OPTIONS_FILE")
LOG_LEVEL=$(jq -r '.log_level' "$OPTIONS_FILE")
SCRYPTED_ADDRESS=$(jq -r '.scrypted_address // empty' "$OPTIONS_FILE")
SCRYPTED_TOKEN=$(jq -r '.scrypted_token // empty' "$OPTIONS_FILE")

[ ! -f "${DATA_FILE}" ] && echo '{"cameras":[]}' > "${DATA_FILE}"

if [ ! -f "${GO2RTC_CONFIG}" ]; then
  printf 'api:\n  listen: 127.0.0.1:1984\nrtsp:\n  listen: 127.0.0.1:8554\nlog:\n  level: warn\nstreams: {}\n' > "${GO2RTC_CONFIG}"
fi

echo "[INFO] Starting go2rtc..."
go2rtc -config "${GO2RTC_CONFIG}" &
sleep 2

echo "[INFO] Starting CloudCam Bridge..."
exec python3 /app/backend/main.py \
    --data-file "${DATA_FILE}" \
    --go2rtc-config "${GO2RTC_CONFIG}" \
    --host "0.0.0.0" --port 8099 \
    --onvif-username "${ONVIF_USERNAME}" \
    --onvif-password "${ONVIF_PASSWORD}" \
    --log-level "${LOG_LEVEL}" \
    --scrypted-address "${SCRYPTED_ADDRESS}" \
    --scrypted-token "${SCRYPTED_TOKEN}"
