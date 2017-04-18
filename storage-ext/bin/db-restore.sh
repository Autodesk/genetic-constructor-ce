#!/usr/bin/env bash

if [ "$#" -lt 1 ]; then
    echo "usage: ./bin/db-restore.sh <psql dump file>"
    exit 1
fi

# this command should be used if the psql dump file contains commands to create the virion DB
#psql -U postgres -W -h localhost -f $1 postgres
psql -U storage -W -h localhost -f $1 storage
