#!/usr/bin/env bash

DATE=`date +%Y%m%d`
OUTPUT_FILE="gctor_db_dump.${DATE}.psql"
echo $OUTPUT_FILE
pg_dump -U storage -W -h localhost -f $OUTPUT_FILE --clean --if-exists storage
