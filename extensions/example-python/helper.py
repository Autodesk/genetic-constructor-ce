#!/usr/bin/python

from Bio.Seq import Seq
import sys

# print 'Argument List:', str(sys.argv)

# If you wanted a fasta file...
# print "> Optimized Sequence"

with open(str(sys.argv[1]), 'r') as f:
    contents = f.read()
    seq = Seq(contents)
    print seq.reverse_complement()