FROM postgres:15

RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-plpython3-15 \
    && rm -rf /var/lib/apt/lists/*

