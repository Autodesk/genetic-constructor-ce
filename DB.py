import json
import sys
import pickle

if len(sys.argv) > 2:
    dat = None

    cmd = sys.argv[1]
    argID = sys.argv[2]
    argDict = None

    try:
        dat = pickle.load(open('db.p','r'))
    except:
        dat = {}

    if cmd == 'SET' and len(sys.argv) > 3:
        argDict = sys.argv[3]
        dat[argID] = json.loads(argDict)
        pickle.dump(dat, open('db.p','wb'))

    if cmd == 'GET':
        print json.dumps(dat.get(argID,None))
