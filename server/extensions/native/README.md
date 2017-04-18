Because extensions do not have real access to the Constructor code base, and may not have access to the file system, certain core extensions are included statically in the server so they can persist data in Constructor.

Including them statically also means they are build as part of the server, and do not need to be bundled, and can easily reference files in the Constructor code base (which is hard in webpack otherwise since referenced files are expecte to be ES5 when outside the scope of the package).

The intent ultimately is to make these work more like other extensions.