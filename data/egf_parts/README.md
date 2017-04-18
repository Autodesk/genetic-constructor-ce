This directory is the andrea's parts. 

## Overview

This directory contains the sequences, parts and connectors, templates, and examples for Andrea's project. They are used to create the initial project that is loaded into user's accounts. 

## Generating Parts + Connectors

use convertCsv.js -- see that file for usage

This script should write the files and sequences here, but double-check and if not you can use copyFromStorage


## Sequences

Sequences should be cloned into storage/sequence on app start so that the sequences are available. It is outside of that directory so that it is not gitignored and properly present.

copySequencesToStorage.js is called when the server starts up to ensure that all the expected sequences are present in /storage

copySequencesFromStorage.js copies sequences with md5 matching those of the parts from /storage into this directory.

