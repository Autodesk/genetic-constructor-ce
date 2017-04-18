import json
from Bio import SeqIO
import uuid
import sys

# This table converts annotation types in genbank to role_types in our tool
# Ex: if genbank says "gene", turn it into an role_type of "cds" as we import
role_type_table = {
    "CDS": "cds",
    "cds": "cds",
    "regulatory": "promoter", #promoter is actually a subclass of regulatory
    "promoter": "promoter",
    "terminator": "terminator",
    "gene": "cds",
    "exon": "cds",
    "mat_peptide": "cds",
    "rep_origin": "originReplication",
    "rbs": "rbs"
}

# This table is used to convert names coming from genbank into our block name field and vice versa.
# Each key is a genbank key. The values are a hierarchy of preference to the qualifiers to take as our name
name_qualifier_table = {
    "assembly_gap": ["label"],
    "c_region": ["standard_name", "gene", "product", "label"],
    "cds": ["standard_name", "gene", "product", "function", "label"],
    "centromere": ["standard_name", "label"],
    "d-loop": ["gene", "label"],
    "d-segment": ["gene", "product", "label"],
    "exon": ["standard_name", "gene", "product", "function", "label"],
    "gap": ["label"],
    "gene": ["standard_name", "gene", "product", "function", "label"],
    "idna": ["standard_name", "gene", "function", "label"],
    "intron": ["standard_name", "gene", "function", "label"],
    "j_segment": ["standard_name", "gene", "product", "label"],
    "ltr": ["standard_name", "gene", "function", "label"],
    "mat_peptide": ["standard_name", "gene", "product", "function", "label"],
    "misc_binding": ["gene", "function", "label"],
    "misc_difference": ["standard_name", "gene", "label"],
    "misc_feature": ["standard_name", "gene", "product", "function", "label"],
    "misc_recomb": ["standard_name", "gene", "label"],
    "misc_RNA": ["standard_name", "gene", "product", "function", "label"],
    "misc_structure": ["standard_name", "gene", "function", "label"],
    "misc_element": ["standard_name", "gene", "function", "label"],
    "modified_base": ["gene", "label"],
    "mrna": ["standard_name", "gene", "product", "function", "label"],
    "ncrna": ["standard_name", "gene", "product", "function", "label"],
    "n_region": ["standard_name", "gene", "product", "label"],
    "old_sequence": ["gene", "label"],
    "operon": ["standard_name", "function", "label"],
    "orit": ["standard_name", "gene", "label"],
    "polya_site": ["gene", "label"],
    "precursor_rna": ["standard_name", "gene", "function", "label"],
    "prim_transcript": ["standard_name", "gene", "function", "label"],
    "primer_bind": ["standard_name", "gene", "label"],
    "protein_bind": ["standard_name", "gene", "function", "label"],
    "regulatory": ["standard_name", "gene", "function", "label"],
    "repeat_region": ["standard_name", "gene", "function", "label"],
    "rep_origin": ["standard_name", "gene", "label"],
    "rrna": ["standard_name", "gene", "product", "function", "label"],
    "s_region": ["standard_name", "gene", "product", "label"],
    "sig_peptide": ["standard_name", "gene", "product", "function", "label"],
    "source": ["label"],
    "stem_loop": ["standard_name", "gene", "function", "label"],
    "sts": ["standard_name", "gene", "label"],
    "telomere": ["standard_name", "label"],
    "tmrna": ["standard_name", "gene", "product", "function", "label"],
    "transit_peptide": ["standard_name", "gene", "product", "function", "label"],
    "trna": ["standard_name", "gene", "product", "function", "label"],
    "unsure": ["gene", "label"],
    "vregion": ["standard_name", "gene", "product", "label"],
    "v_segment": ["standard_name", "gene", "product", "label"],
    "variation": ["standard_name", "gene", "product", "label"],
    "3'utr": ["standard_name", "gene", "function", "label"],
    "5'utr": ["standard_name", "gene", "function", "label"],
}

# Creates a scaffold structure for a block
def create_block_json(id):
    return {
        "id": id,
        "metadata" : { "genbank" : {}},
        "rules": {},
        "components": [],
        "sequence" : {
            "features": []
        }
      }

# Determines the kind of relationship between 2 blocks, using only the length, start and end positions
# Output can be:
#    "child": block1 is completely inside block2
#    "equal": block1 and block2 overlap perfectly
#    "parent": block2 is completely inside block1
#    "partial": block1 and block2 have a partial overlap
#    "before": block1 comes before than block2 in the sequence
#    "after": block1 comes after block2 in the sequence
def relationship(block1, block2):
    if block1["sequence"]["length"] < block2["sequence"]["length"] and block2["metadata"]["start"] <= block1["metadata"]["start"] and block2["metadata"]["end"] >= block1["metadata"]["end"]:
        return "child"
    if block1["sequence"]["length"] == block2["sequence"]["length"] and block2["metadata"]["start"] == block1["metadata"]["start"] and block2["metadata"]["end"] == block1["metadata"]["end"]:
        return "equal"
    if block1["sequence"]["length"] > block2["sequence"]["length"] and block1["metadata"]["start"] <= block2["metadata"]["start"] and block1["metadata"]["end"] >= block2["metadata"]["end"]:
        return "parent"
    if (block1["metadata"]["start"] <= block2["metadata"]["start"] and block1["metadata"]["end"] > block2["metadata"]["start"]) or \
        (block1["metadata"]["start"] < block2["metadata"]["end"] and block1["metadata"]["end"] >= block2["metadata"]["end"]):
        return "partial"
    if block1["metadata"]["end"]-1 < block2["metadata"]["start"]:
        return "before"
    if block1["metadata"]["start"] > block2["metadata"]["end"]-1:
        return "after"
    raise Exception("This relationship between blocks can never happen")
    return "disjoint"

# Takes a block and makes it an annotation of another block, instead of a full block on itself.
# This function takes all the children of the block to embed in the parent and in turn makes them
# also features of the parent.
# Parameters: An array with all the blocks, the block to convert, the parent it should be a feature of,
# and a list of IDs of blocks that need to be removed.
# The function does NOT take the blocks from all_blocks
def convert_block_to_annotation(all_blocks, to_convert, parent, to_remove_list):
    annotation = { "name": "", "notes": {} }
    for key, value in to_convert["metadata"].iteritems():
        if key in ["name", "description", "start", "end", "tags", "color"]:
            annotation[key] = value
        elif key == "strand":
            annotation["isForward"] = (value == 1)
        else:
            if key not in ["is_annotation", "old_parents", "old_id"]:
                annotation["notes"][key] = value

    if "role" in to_convert["rules"]:
        annotation["role"] = to_convert["rules"]["role"]

    # Start and end of the annotation are relative to the block containing them
    annotation["start"] = to_convert["metadata"]["start"] - parent["metadata"]["start"]
    annotation["end"] = to_convert["metadata"]["end"] - parent["metadata"]["start"]

    if "annotations" not in parent["sequence"]:
        parent["sequence"]["annotations"] = []

    parent["sequence"]["annotations"].append(annotation)
    to_remove_list.append(to_convert["id"])

    if "annotations" in to_convert["sequence"]:
        for annotation in to_convert["sequence"]["annotations"]:
            # We need to normalize the start and end for the annotation to the new parent start and end
            annotation["start"] = annotation["start"] + to_convert["metadata"]["start"] - parent["metadata"]["start"]
            annotation["end"] = annotation["end"] + to_convert["metadata"]["start"] - parent["metadata"]["start"]
            parent["sequence"]["annotations"].append(annotation)

    # And also convert to features all the components of the removed block, recursively
    for to_convert_child_id in to_convert["components"]:
        to_convert_child = all_blocks[to_convert_child_id]
        convert_block_to_annotation(all_blocks, to_convert_child, parent, to_remove_list)

# Takes a genbank record and creates a root block
def create_root_block_from_genbank(gb, sequence):
    full_length = len(sequence["sequence"])

    root_id = str(uuid.uuid4())
    root_block = create_block_json(root_id)
    root_block["metadata"]["description"] = gb.description
    root_block["metadata"]["name"] = gb.name
    root_block["metadata"]["genbank"]["name"] = gb.name

    root_block["metadata"]["start"] = 0
    root_block["metadata"]["end"] = full_length
    sequence["blocks"][root_id] = [root_block["metadata"]["start"], root_block["metadata"]["end"]]

    root_block["metadata"]["genbank"]["id"] = gb.id
    root_block["sequence"]["length"] = full_length
    if "references" in gb.annotations:
        for ref in gb.annotations["references"]:
            if "references" not in root_block["metadata"]["genbank"]:
                root_block["metadata"]["genbank"]["references"] = []
            try:
                reference = {'authors': ref.authors, 'comment': ref.comment, 'consrtm': ref.consrtm, 'journal': ref.journal,
                             'medline_id': ref.medline_id, 'pubmed_id': ref.pubmed_id, 'title': ref.title}
                root_block["metadata"]["genbank"]["references"].append(reference)
            except:
                pass

    for annot in gb.annotations:
        if "annotations" not in root_block["metadata"]["genbank"]:
            root_block["metadata"]["genbank"]["annotations"] = {}
        try:
            json.dumps(gb.annotations[annot])
            root_block["metadata"]["genbank"]["annotations"][annot] = gb.annotations[annot]
        except:
            pass
    return root_block

# Create the name for the block based on preference rules in the name qualifier table
# Defaults to the genbank type if we don't have anything else to go on
def convert_block_name(f, block):
    genbank_type = f.type.lower()
    if genbank_type in name_qualifier_table:
        preferences = name_qualifier_table[genbank_type]
        for key in preferences:
            if key in f.qualifiers:
                block["metadata"]["name"] = f.qualifiers[key][0]
                block["metadata"]["genbank"]["name_source"] = key
                return
    else:
        block["metadata"]["name"] = f.type

# The information for GC is stored in the notes qualifier, encoded in json. Get it back out.
def convert_GC_info(f, block):
    if "note" not in f.qualifiers:
        return

    try:
        all_info = json.loads(f.qualifiers["note"][0].replace("'", "\""))
        block["metadata"]["name"] = all_info["GC"]["name"]
        if "color" in all_info["GC"]:
            block["metadata"]["color"] = all_info["GC"]["color"]
        if "description" in all_info["GC"]:
            block["metadata"]["description"] = all_info["GC"]["description"]
        if "note" in all_info:
            block["metadata"]["genbank"]["note"] = all_info["note"]
        if "id" in all_info["GC"]:
            block["metadata"]["old_id"] = all_info["GC"]["id"]
        if "parents" in all_info["GC"] and len(all_info["GC"]["parents"]) > 0:
            block["metadata"]["old_parents"] = all_info["GC"]["parents"]
        if "type" in all_info["GC"]:
            block["metadata"]["is_annotation"] = (all_info["GC"]["type"] == "annotation")

    except:
        block["metadata"]["genbank"]["note"] = f.qualifiers["note"][0]

# Takes a BioPython SeqFeature and turns it into a block
def create_child_block_from_feature(f, all_blocks, root_block, sequence):
    qualifiers = f.qualifiers
    start = f.location.start.position
    end = f.location.end.position
    strand = f.location.strand
    role_type = role_type_table.get(f.type)

    if f.type.strip() == 'source':
        convert_GC_info(f, root_block)

        # 'source' refers to the root block. So, the root block aggregates information
        # from the header of the genbank file as well as the 'source' feature
        for key, value in qualifiers.iteritems():
            if "feature_annotations" not in root_block["metadata"]["genbank"]:
                root_block["metadata"]["genbank"]["feature_annotations"] = {}
            if key not in ["note"]:
                root_block["metadata"]["genbank"]["feature_annotations"][key] = value[0]
    else:
        # It's a regular annotation, create a block
        block_id = str(uuid.uuid4())
        child_block = create_block_json(block_id)
        convert_block_name(f, child_block)
        convert_GC_info(f, child_block)

        for q in f.qualifiers:
            try:
                json.dumps(qualifiers[q][0])
                if q not in ["note"]:
                    child_block["metadata"]["genbank"][q] = f.qualifiers[q][0]
            except:
                pass

        child_block["metadata"]["start"] = start
        child_block["metadata"]["end"] = end
        sequence["blocks"][block_id] = [child_block["metadata"]["start"], child_block["metadata"]["end"]]

        child_block["sequence"]["length"] = child_block["metadata"]["end"] - child_block["metadata"]["start"]
        child_block["metadata"]["strand"] = strand
        child_block["metadata"]["genbank"]["type"] = f.type

        if role_type:
            child_block["rules"]["role"] = role_type

        all_blocks[block_id] = child_block

# Returns true if a block id is a children of any other block
def has_parent(block_id, all_blocks):
    for block in all_blocks.values():
        if block_id in block["components"]:
            return True
    return False

def block_by_old_id(old_id, all_blocks):
    for block in all_blocks.values():
        if "old_id" in block["metadata"] and block["metadata"]["old_id"] == old_id:
            return block
    raise Exception("Block not Found!")

# Traverse an array of blocks and build a hierarchy. The hierarchy embeds blocks into other blocks in order,
# and create filler blocks where needed
def build_block_hierarchy(all_blocks, root_block, sequence):
    # Going through the blocks from shorter to longer, so hopefully we will maximize
    # the ones that convert to blocks instead of features

    # Hack to make Root the last one (beyond all the other ones with the same length)
    root_block["metadata"]["end"] = root_block["metadata"]["end"] + 1
    sorted_blocks = sorted(all_blocks.values(), key=lambda block: block["metadata"]["end"] - block["metadata"]["start"])
    root_block["metadata"]["end"] = root_block["metadata"]["end"] - 1

    blocks_count = len(sorted_blocks)
    to_remove = []

    for i in range(blocks_count):
        block = sorted_blocks[i]
        # Don't try to sort out the root block, anything to remove, or anything that we have already determined that it has a parent
        if block == root_block or block["id"] in to_remove or has_parent(block["id"], all_blocks):
            continue

        # Try to rebuild the hierarchy if it's an import from GC
        if "old_parents" in block["metadata"] and len(block["metadata"]["old_parents"]) > 0:
            if "is_annotation" in block["metadata"] and block["metadata"]["is_annotation"]:
                convert_block_to_annotation(all_blocks, block, block_by_old_id(block["metadata"]["old_parents"][0], all_blocks), to_remove)
            else:
                for old_parent_id in block["metadata"]["old_parents"]:
                    insert_child_in_parent(all_blocks, block, block_by_old_id(old_parent_id, all_blocks), to_remove)
            continue

        inserted = False

        parents = []
        # Look for all the possible parents of the current block
        for j in range(i + 1, blocks_count):
            # If it is a child of root, don't add it as child of any other block with the same size
            if sorted_blocks[j]["sequence"]["length"] == root_block["sequence"]["length"] and sorted_blocks[j] != root_block:
                continue

            if sorted_blocks[j]["metadata"]["end"] >= block["metadata"]["end"] and sorted_blocks[j]["metadata"]["start"] <= \
                    block["metadata"]["start"]:
                parents.append(sorted_blocks[j])

        for other_block in parents:
            rel = relationship(block, other_block)
            if rel == "child":
                insert_child_in_parent(all_blocks, block, other_block, to_remove)
                inserted = True
                break
            elif rel == "equal":
                # If the blocks overlap, make the one with less amount of children the feature of
                # the other one
                if len(block["components"]) <= len(other_block["components"]):
                    convert_block_to_annotation(all_blocks, block, other_block, to_remove)
                    inserted = True
                    break
                else:
                    convert_block_to_annotation(all_blocks, other_block, block, to_remove)

        if not inserted:  # This should never happen because the block should be at least child of root!
            if block["sequence"]["length"] == root_block["sequence"]["length"]:
                convert_block_to_annotation(all_blocks, block, root_block, to_remove)
            else:
                print('Error processing block ' + str(block["metadata"].get("name")) + "[" + str(block["metadata"]["start"]) + ":" + str(block["metadata"]["end"]) + "]")

    # Delete all the blocks that were converted to features
    for removing in to_remove:
        all_blocks.pop(removing)
        sequence["blocks"].pop(removing)


def insert_child_in_parent(all_blocks, block, parent_block, to_remove):
    i = 0
    is_partial_overlap = False
    # Go through the siblins to see where to insert the current block
    for sib_id in parent_block["components"]:
        sibling = all_blocks[sib_id]
        relationship_to_sibling = relationship(block, sibling)
        # Keep moving forward until we get to one where we need to be "before"
        if relationship_to_sibling == "after":
            i += 1
        elif relationship_to_sibling != "before":  # Partial match!
            is_partial_overlap = True
            break
    # Insert the block where it goes
    if not is_partial_overlap:
        parent_block["components"].insert(i, block["id"])
    else:
        # Partial match, make this block just an annotation of the parent
        convert_block_to_annotation(all_blocks, block, parent_block, to_remove)


# Create blocks that fill holes between siblings.
def create_filler_blocks_for_holes(all_blocks, sequence):
    # Plug the holes: For each block that has children, make sure all the sequence is accounted for
    current_block_structures = [block for block in all_blocks.values()]
    # Go through all the blocks
    for block in current_block_structures:
        current_position = block["metadata"]["start"]
        child = None
        i = 0
        # For each block go through all the children
        for i, child_id in enumerate(block["components"]):
            child = all_blocks[child_id]
            # If the child starts AFTER where it should start
            if child["metadata"]["start"] > current_position:
                # Create a filler block before the current block, encompassing the sequence between where the child should
                # start and where it actually starts. Add the filler block to the parent.
                block_id = str(uuid.uuid4())
                filler_block = create_block_json(block_id)
                filler_block["metadata"]["color"] = None

                filler_block["metadata"]["start"] = current_position
                filler_block["metadata"]["end"] = child["metadata"]["start"]
                sequence["blocks"][block_id] = [filler_block["metadata"]["start"], filler_block["metadata"]["end"]]

                filler_block["sequence"]["length"] = filler_block["metadata"]["end"] - filler_block["metadata"]["start"]

                filler_block["metadata"]["initialBases"] = sequence["sequence"][filler_block["metadata"]["start"]:filler_block["metadata"]["start"]+3] + "..."

                all_blocks[block_id] = filler_block
                block["components"].insert(i, block_id)
            current_position = child["metadata"]["end"]
        # If the last block doesn't end at the end of the parent, create a filler too!
        if child and current_position < block["metadata"]["end"]:
            block_id = str(uuid.uuid4())
            filler_block = create_block_json(block_id)
            filler_block["metadata"]["color"] = None

            filler_block["metadata"]["start"] = current_position
            filler_block["metadata"]["end"] = block["metadata"]["end"]
            sequence["blocks"][block_id] = [filler_block["metadata"]["start"], filler_block["metadata"]["end"]]

            filler_block["sequence"]["length"] = filler_block["metadata"]["end"] - filler_block["metadata"]["start"]

            filler_block["metadata"]["initialBases"] = sequence["sequence"][filler_block["metadata"]["start"]:filler_block["metadata"]["start"]+3] + "..."

            all_blocks[block_id] = filler_block
            block["components"].insert(i + 1, block_id)

# If a block has children, remove its sequence
def remove_sequence_from_parents(all_blocks):
    for block in all_blocks.values():
        if len(block["components"]) > 0:
            block["sequence"]["length"] = 0

# Once we have arranged all blocks, there is no need to keep the start and end values for each block. We do keep
# the start and end of annotations
def remove_start_and_end_of_blocks(all_blocks):
    for block in all_blocks.values():
        try:
            del block["metadata"]["start"]
            del block["metadata"]["end"]
            del block["metadata"]["is_annotation"]
            del block["metadata"]["old_id"]
            del block["metadata"]["old_parents"]
        except KeyError:
            pass

# Takes a BioPython SeqRecord and converts it to our blocks structures,
# with temporary ids
def convert_genbank_record_to_blocks(gb):
    all_blocks = {}
    sequence = { "sequence": str(gb.seq), "blocks": {}}

    root_block = create_root_block_from_genbank(gb, sequence)
    all_blocks[root_block["id"]] = root_block

    # Create a block for each feature
    for f in sorted(gb.features, key = lambda feat: len(feat)):
        create_child_block_from_feature(f, all_blocks, root_block, sequence)

    build_block_hierarchy(all_blocks, root_block, sequence)

    create_filler_blocks_for_holes(all_blocks, sequence)

    remove_sequence_from_parents(all_blocks)
    remove_start_and_end_of_blocks(all_blocks)

    return { "root": all_blocks[root_block["id"]], "blocks": all_blocks, "sequence": sequence }


# Given a file, create project and blocks structures to import into GD
def genbank_to_project(filename):
    project = { "components": []}
    blocks = {}
    sequences = []

    generator = SeqIO.parse(open(filename,"r"),"genbank")
    for record in generator:
        results = convert_genbank_record_to_blocks(record)

        project["components"].append(results["root"]["id"])
        project["name"] = results["root"]["metadata"]["name"]
        project["description"] = results["root"]["metadata"]["description"]

        blocks.update(results["blocks"])
        sequences.append(results["sequence"])
    return { "project": project, "blocks": blocks, "sequences": sequences }
