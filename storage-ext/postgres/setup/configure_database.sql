DROP DATABASE IF EXISTS "storage" ;
ALTER USER storage WITH PASSWORD 'storageGCTOR' ;
CREATE DATABASE "storage" TEMPLATE=template1 ;
GRANT ALL PRIVILEGES ON DATABASE "storage" to storage ;
\connect "storage" ;
GRANT SELECT ON ALL TABLES IN SCHEMA PUBLIC to storage ;
