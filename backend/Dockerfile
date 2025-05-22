FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && \
    apt-get install -y git curl docker.io && \
    curl -sSL https://raw.githubusercontent.com/buildpacks/pack/main/install.sh | sh

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
