# Blocks and Similarites to SBOL

The foundational data type for representing DNA constructs in Genetic Constructor is the Block. Blocks can be thought of as parts, except they may not specify a sequence, and accommodate many more types of data than just base pairs and annotations.

The format of blocks is heavily inspired by the SBOL data standard (http://sbolstandard.org/), which similarly describes biological systems in a hierarchical and referential schema.

### Scope

SBOL is more broad than Genetic Constructor, and includes a wider set of players in biological systems, accommodating substrates, proteins, RNAs, ligands, etc.