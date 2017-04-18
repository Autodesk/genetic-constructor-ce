#!/usr/bin/env bash

WD="./"
TD="${WD}storage-ext/"
SCS="${WD}storage-app.md5"
EX="${WD}storage-app.excludes"

if [ -f "$SCS" ]; then
    LASTMD5=`cat ${SCS}`
fi

CURMD5=`tar -X ${EX} -cf - ${TD} | md5sum | cut -f1 -d' '`
echo "current md5 -> $CURMD5"

if [ -n "$LASTMD5" ]; then
    echo "last md5 -> $LASTMD5"
    if [ ${CURMD5} = ${LASTMD5} ]; then
        echo "NO CHANGE SINCE LAST RUN"
        exit 1
    fi
fi

echo "APP HAS CHANGED"
echo ${CURMD5} > ${SCS}
exit 0
