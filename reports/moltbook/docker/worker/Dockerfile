FROM python:3.11-slim
WORKDIR /app
COPY ../../meters /app/meters
RUN pip install --no-cache-dir
CMD ["bash","-c","while true; do python3 /app/meters/etl_runner.py --date $(date -u +%F); sleep 86400; done"]
