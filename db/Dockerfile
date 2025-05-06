FROM postgis/postgis:latest

# Solo variables por defecto (serán sobrescritas por docker-compose)
ENV POSTGRES_PASSWORD=dummy
ENV POSTGRES_USER=postgres
ENV POSTGRES_DB=parqueaderos_db

# HEALTHCHECK opcional
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD pg_isready -U postgres