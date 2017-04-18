#import requests
import json
from io import StringIO
from Bio import Seq
from Bio import SeqIO
from Bio import SeqFeature
import sys
import uuid
import sys
from genbank_import import *
from genbank_export import *

def _decode_list(data):
    rv = []
    for item in data:
        if isinstance(item, unicode):
            item = item.encode('ascii', 'ignore')
        elif isinstance(item, list):
            item = _decode_list(item)
        elif isinstance(item, dict):
            item = _decode_dict(item)
        rv.append(item)
    return rv

def _decode_dict(data):
    rv = {}
    for key, value in data.iteritems():
        if isinstance(key, unicode):
            key = key.encode('ascii', 'ignore')
        if isinstance(value, unicode):
            value = value.encode('ascii', 'ignore')
        elif isinstance(value, list):
            value = _decode_list(value)
        elif isinstance(value, dict):
            value = _decode_dict(value)
        rv[key] = value
    return rv

to_genbank = sys.argv[1] == "to_genbank"

if to_genbank:
    genbank_file = sys.argv[3]
    project_file = sys.argv[2]
    project = json.load(open(project_file,"r"), object_hook=_decode_dict)
    export_project(genbank_file, project['project'], project['blocks'])
else:
    genbank_file = sys.argv[2]
    project_file = sys.argv[3]
    project = genbank_to_project(genbank_file)
    json.dump(project, open(project_file,'w'))
