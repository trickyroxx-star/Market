FROM python:3.11-slim
WORKDIR /app
COPY ../../meters /app/meters
RUN pip install --no-cache-dir flask
EXPOSE 4000
CMD ["python3","/app/meters/collector_server.py"]
