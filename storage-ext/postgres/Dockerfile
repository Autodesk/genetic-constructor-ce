FROM postgres:9.4

ENV POSTGRES_PASSWORD GCTORSTORAGEMASTER
ENV POSTGRES_USER postgres

COPY setup/configure_database.sh /docker-entrypoint-initdb.d/
COPY setup/configure_database.sql /docker-entrypoint-initdb.d/