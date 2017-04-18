from Bio import Seq
from Bio import SeqIO
from Bio import SeqFeature
from genbank_import import name_qualifier_table
import json

def is_filler(block):
    # It's a filler block when it has no name, it has a sequence, and no color
    return block["metadata"]["name"] == "" and ("sequence" in block and "sequence" in block["sequence"] and block["sequence"]["sequence"] != "") \
           and ("initialBases" in block["metadata"] and block["metadata"]["initialBases"] != "")

def convert_block_name(sf, block):
    # The name of the feature should go in the appropriate place in genbank
    if "name" in block["metadata"] and block["metadata"]["name"] != "":
        if "genbank" in block["metadata"] and "name_source" in block["metadata"]["genbank"]:
            sf.qualifiers[block["metadata"]["genbank"]["name_source"]] = block["metadata"]["name"]
        else:
            genbank_type = sf.type.lower()
            if genbank_type in name_qualifier_table and len(name_qualifier_table[genbank_type]) != 0:
                sf.qualifiers[name_qualifier_table[genbank_type][0]] = block["metadata"]["name"]
            # Unfortunately if the name doesn't fit in genbank we have to drop it!

def add_GC_info(sf, block, allblocks):
    encoded_data = { "GC": { "name": block["metadata"]["name"], "type": "block", "id": block["id"], "parents": [] } }

    # The color
    if "color" in block["metadata"] and block["metadata"]["color"] != "":
        encoded_data["GC"]["color"] = block["metadata"]["color"]

    # The description in the GD_Description qualifier
    if "description" in block["metadata"] and block["metadata"]["description"] != "":
        encoded_data["GC"]["description"] = block["metadata"]["description"]

    if "genbank" in block["metadata"] and "note" in block["metadata"]["genbank"]:
        encoded_data["note"] = block["metadata"]["genbank"]["note"]

    for potential_parent in allblocks:
        if block["id"] in potential_parent["components"]:
            encoded_data["GC"]["parents"].append(potential_parent["id"])

    sf.qualifiers["note"] = json.dumps(encoded_data).replace("\"", "'").replace("\n", " ")

def add_features(block, allblocks, gb, start):
    # Disregard fillers... don't create features for them
    if is_filler(block):
        return start + block["sequence"]["length"]

    # For handling list blocks!
    if "current_option" in block:
        option = [b for b in allblocks if b["id"] == block["current_option"]][0]
        return add_features(option, allblocks, gb, start)

    # Add Myself as a feature
    sf = SeqFeature.SeqFeature()
    # Set the type based on the original type or the role type
    if "genbank" in block["metadata"] and "type" in block["metadata"]["genbank"]:
        sf.type = block["metadata"]["genbank"]["type"]
    elif "rules" in block and "role" in block["rules"] and block["rules"]["role"] is not None and block["rules"]["role"] != "":
        sf.type = block["rules"]["role"]
    else:
        sf.type = "misc_feature"

    # Set up the location of the feature
    feature_strand = 1
    if "strand" in block["metadata"]:
        feature_strand = block["metadata"]["strand"]

    # And copy all the other qualifiers that came originally from genbank
    if "genbank" in block["metadata"]:
        for annot_key, annot_value in block["metadata"]["genbank"].iteritems():
            if annot_key not in ["name_source", "note"]:
                sf.qualifiers[annot_key] = annot_value

    convert_block_name(sf, block)

    add_GC_info(sf, block, allblocks)

    convert_annotations(block, gb, start)

    # Add my children as features
    child_start = start
    for i in range(0, len(block["components"])):
        block_id = block["components"][i]
        bl = [b for b in allblocks if b["id"] == block_id][0]
        child_start = add_features(bl, allblocks, gb, child_start)

    if child_start != start:
        # The end is where the last child ended...
        end = child_start
    else:
        # No children, look at the block's length
        if "sequence" in block:
            end = start + block["sequence"]["length"]
        else:
            end = start

    sf.location = SeqFeature.FeatureLocation(start, end, strand=feature_strand)
    gb.features.append(sf)

    return end

# Parameters: the block to take annotations from,
# the biopython SeqRecord object to add the annotations to,
# the start position of the current block
def convert_annotations(block, gb, start):
    if "sequence" not in block:
        return

    # Add My annotations as features
    for annotation in block["sequence"]["annotations"]:
        gb_annot = SeqFeature.SeqFeature()
        annotation_type = "misc_feature"

        if "role" in annotation and annotation["role"] != "":
            annotation_type = annotation["role"]

        for key, value in annotation.iteritems():
            if key not in ["start", "end", "notes", "strand", "color", "role", "isForward"]:
                gb_annot.qualifiers[key] = value
            elif key == "notes" and "genbank" in annotation["notes"]:
                for gb_key, gb_value in annotation["notes"]["genbank"].iteritems():
                    if gb_key not in ["type", "note"]:
                        gb_annot.qualifiers[gb_key] = gb_value
                    elif gb_key == "type":
                        annotation_type = gb_value

        gc_info = { "GC": { "name": annotation["name"], "type": "annotation", "parents": [block["id"]] } }
        if "color" in annotation:
            gc_info["GC"]["color"] = annotation["color"]
        if "notes" in annotation and "genbank" in annotation["notes"] and "note" in annotation["notes"]["genbank"]:
            gc_info["note"] = annotation["notes"]["genbank"]["note"]
        gb_annot.qualifiers["note"] = json.dumps(gc_info).replace("\"", "'")

        if "start" in annotation:
            strand = 1
            if "isForward" in annotation and annotation["isForward"] == -1:
                strand = -1
            # Remember: annotations start and end are relative to the block
            gb_annot.location = SeqFeature.FeatureLocation(annotation["start"] + start, annotation["end"] + start + 1, strand)

        gb_annot.type = annotation_type

        gb.features.append(gb_annot)


# Return the full sequence from a block,
# building it from the sequence of children
def build_sequence(block, allblocks):
    seq = ""
    if len(block["components"]) > 0:
        for component in block["components"]:
            child_block = [b for b in allblocks if b["id"] == component][0]
            seq = seq + build_sequence(child_block, allblocks)
    else:
        # For handling list blocks!
        if "current_option" in block:
            option = [b for b in allblocks if b["id"] == block["current_option"]][0]
            seq = seq + build_sequence(option, allblocks)
        if "sequence" in block and "sequence" in block["sequence"] and block["sequence"]["sequence"]:
            seq = block["sequence"]["sequence"]
    return seq

def get_children_ids(block, allblocks):
    # Remove filler blocks from the list of children ids! Then add the children ids to the genbank file
    children = list(block["components"])
    for child_id in block["components"]:
        child_block = [b for b in allblocks if b["id"] == child_id][0]
        if is_filler(child_block):
            children.remove(child_id)
    return children

# Take a project structure and a list of all the current blocks, convert this data to a genbank file and store it
# in filename. If you pass a construct in, only convert that particular construct.
def project_to_genbank(filename, project, allblocks, construct_id=None):
    if construct_id is not None:
        blocks = [construct_id]
    else:
        blocks = project["components"]

    seq_obj_lst = []

    # For each of the construct in the project
    for block_id in blocks:
        block = [b for b in allblocks if b["id"] == block_id][0]
        if not block:
            continue

        # Grab the original ID that came from genbank before if available, otherwise the GD Name as the name
        if "genbank" in block["metadata"] and "id" in block["metadata"]["genbank"]:
            genbank_id = block["metadata"]["genbank"]["id"]
        elif "genbank" in block["metadata"] and "name" in block["metadata"]["genbank"]:
            genbank_id = block["metadata"]["genbank"]["name"]
        else:
            genbank_id = "GC_DNA"

        sequence = build_sequence(block, allblocks)
        seq_obj = SeqIO.SeqRecord(Seq.Seq(sequence,Seq.Alphabet.DNAAlphabet()), genbank_id)

        # Create a 'source' feature
        sf = SeqFeature.SeqFeature()
        sf.type = "source"
        sf.location = SeqFeature.FeatureLocation(0, len(seq_obj.seq))

        add_GC_info(sf, block, allblocks)

        if "genbank" in block["metadata"]:
            # Set up all the annotations in the genbank record. These came originally from genbank.
            if "annotations" in block["metadata"]["genbank"]:
                for annot_key, annot_value in block["metadata"]["genbank"]["annotations"].iteritems():
                    seq_obj.annotations[annot_key] = annot_value
            # Set up all the references in the genbank record. These came originally from genbank.
            if "references" in block["metadata"]["genbank"]:
                for ref in block["metadata"]["genbank"]["references"]:
                    genbank_ref = SeqFeature.Reference()
                    genbank_ref.authors = ref['authors']
                    genbank_ref.comment = ref['comment']
                    genbank_ref.consrtm = ref['consrtm']
                    genbank_ref.journal = ref['journal']
                    genbank_ref.medline_id = ref['medline_id']
                    genbank_ref.pubmed_id = ref['pubmed_id']
                    genbank_ref.title = ref['title']
                    if "references" not in seq_obj.annotations:
                        seq_obj.annotations["references"] = []
                    seq_obj.annotations["references"].append(genbank_ref)
            # Add the original annotations to the source feature
            if "feature_annotations" in block["metadata"]["genbank"]:
                for annot_key, annot_value in block["metadata"]["genbank"]["feature_annotations"].iteritems():
                    sf.qualifiers[annot_key] = annot_value

        seq_obj.features.append(sf)

        if "description" in block["metadata"]:
            seq_obj.description = block["metadata"]["description"]
        if "genbank" in block["metadata"] and "name" in block["metadata"]["genbank"]:
            seq_obj.name = block["metadata"]["genbank"]["name"]
        elif "name" in block["metadata"]:
            seq_obj.name = block["metadata"]["name"].replace(" ", "")[:5]
        else:
            seq_obj.name = "GC_DNA"

        convert_annotations(block, seq_obj, 0)

        # Add a block for each of the features, recursively
        start = 0
        for child_id in block['components']:
            child_block = [b for b in allblocks if b["id"] == child_id][0]
            start = add_features(child_block, allblocks, seq_obj, start)

        seq_obj_lst.append(seq_obj)

    SeqIO.write(seq_obj_lst, open(filename, "w"), "genbank")


# Returns a list of blocks that are optional from this block down in the hierarchy
def get_optional_children(block, allblocks):
    result = []
    if block.get("options") is not None and len(block["options"]) > 0:
        # Is there at least one "enabled" option?
        for option_id, option_value in block["options"].iteritems():
            if option_value:
                result.append(block)
                return result
    else:
        for child_id in block["components"]:
            child = [b for b in allblocks if b["id"] == child_id][0]
            childs_options = get_optional_children(child, allblocks)
            result.extend(childs_options)
    return result

def next_viable_option(options, current_option=None):
    select_next = False
    for option_id, option_enabled in options.iteritems():
        if current_option == option_id:
            select_next = True
            continue
        if option_enabled and (select_next or current_option is None):
            return option_id
    return None

def build_first_optional_construct(optional_children):
    for block in optional_children:
        block["current_option"] = next_viable_option(block["options"], current_option=block.get("current_option"))

def build_next_optional_construct(optional_children):
    for block in optional_children:
        next_option = next_viable_option(block["options"], current_option=block.get("current_option"))
        if next_option is not None:
            block["current_option"] = next_option
            return True
        else:
            # Back to the first option
            block["current_option"] = next_viable_option(block["options"])
    return False

# Take a project and create a file. This file can be a genbank file or a zip with
# lots of genbank files, depending on whether the project has list blocks in it.
from pprint import pprint
import zipfile
import os
def export_project(filename, project, allblocks):
    all_options = [block["id"] for block in allblocks if block.get("options") is not None and len(block["options"]) > 0]

    # There are no list blocks
    if len(all_options) == 0:
        print "No options!"
        project_to_genbank(filename, project, allblocks)
        return

    # There are list blocks. We need to create a zip file with all the combinations. Include in the zip file the non-list-block constructs
    constructs = project["components"]
    project_name = project["metadata"]["name"] or 'Untitled Project'
    name_prefix = project_name + " - "
    construct_number = 1

    zf = zipfile.ZipFile(filename, mode='w')

    for construct_id in constructs:
        construct = [b for b in allblocks if b["id"] == construct_id][0]

        optional_children = get_optional_children(construct, allblocks)
        if len(optional_children) > 0:
            build_first_optional_construct(optional_children)

            gb_filename = name_prefix + construct["metadata"]["name"] + " - " + str(construct_number) + ".gb"
            gb_filepath = '/tmp/' + gb_filename
            construct_number = construct_number + 1

            project_to_genbank(gb_filepath, project,
                               allblocks, construct_id=construct_id)
            zf.write(gb_filepath, gb_filename)
            os.remove(gb_filepath)

            while build_next_optional_construct(optional_children):
                gb_filename = name_prefix + construct["metadata"]["name"] + " - " + str(construct_number) + ".gb"
                gb_filepath = '/tmp/' + gb_filename
                construct_number = construct_number + 1

                project_to_genbank(gb_filepath, project,
                                   allblocks, construct_id=construct_id)
                zf.write(gb_filepath, gb_filename)
                os.remove(gb_filepath)

        else:
            gb_filename = name_prefix + construct["metadata"]["name"] + " - " + str(construct_number) + ".gb"
            gb_filepath = '/tmp/' + gb_filename
            construct_number = construct_number + 1
            project_to_genbank(gb_filepath, project, allblocks, construct_id=construct_id)
            zf.write(gb_filepath, gb_filename)
            os.remove(gb_filepath)

    zf.close()
