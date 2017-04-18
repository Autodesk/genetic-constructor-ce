/*
 need to install npm package csv-parse (not listed in package json)

 Take the spreadsheet andrea has and export as csv files - one file for parts, one file for connectors

 Ensure that the header rows match those below. After importing, verify that the sample project loads without problem, and ideally that all constructs can be ordered.

 call like this (from project root):
 - note you can skip the forced output path and they will update here
 - note you will need babel-node installed globally to run this, or just add it to your path temproarily from package's node modules

 babel-node ./data/egf_parts/convertCsv.js /path/to/parts.csv true forced/path/to/output.json
 babel-node ./data/egf_parts/convertCsv.js /path/to/connectors.csv false forced/path/to/output.json

 do not import this file into client bundle. it will break it because it requires not specific packages.
 */

import * as fileSystem from '../../server/data/middleware/fileSystem';
import invariant from 'invariant';
import Block from '../../src/models/Block';
import parse from 'csv-parse';
import md5 from 'md5';
import path from 'path';
import { templateSymbols } from './templateUtils';

//edit these dependent on the spreadsheet
const partFields = ['position', 'part', 'shortName', 'category', 'subCategory', 'sequence', 'description', 'id'];
const connectorFields = ['connector', 'positions', 'sequence', 'id'];

//header and empty row
const headerRows = 2;

//converting categories
const roleMap = {
  'Homology Arm': 'structural',
  'inverted terminal repeat sequences (ITRs)': '',
  'Insulators': 'insulator',
  'Promoters': 'promoter',
  'RNA regulatory sequences': 'regulatory',
  'Site-specific recombinases recognition sites': 'restrictionSite',
  'Peptide Tags': '',
  'Site-specific recombinases': 'restrictionSite',
  'RNA-Binding proteins': '',
  'Fluorescent Reporter': 'reporter',
  'Peptide Linker': 'structural',
  '2A-like peptide sequences': '',
  'IRES (Internal Ribosome Entry Sequence)': 'rbs',
  'Selection Markers': 'selection',
  'Dimerization domain': 'structural',
  'Bioluminescent Reporters': 'reporter',
  'Structural proteins': 'structural',
  'PolyA transcription terminators': 'terminator',
  'Transcription Factor': '',
  'Episomal elements': 'structural',
};

//this version entirely removes the linkers
//const trimSequence = (sequence, isAtStart = false, front = "5'-CGTCTCnNNNN".length, back = "NNNNnGAGACG-3'".length) => {

//this version keeps the last 4 base pairs of overhang so linkers exist between the parts
const trimSequence = (sequence, isAtStart = false, front = "5'-CGTCTCnNNNN".length, back = "nGAGACG-3'".length) => {
  const len = sequence.length;
  const frontTrim = isAtStart ? front - 4 : front;
  return sequence.substring(frontTrim, len - back);
};

const zip = (keys, vals) => keys.reduce(
  (acc, key, ind) => Object.assign(acc, { [key]: vals[ind] }), {}
);

const mapPartFields = (imported) => {
  //fields based on array at top
  const { id, part, description, position, role, sequence, category, subCategory, shortName, ...rest } = imported;
  const roleWithBackup = role || templateSymbols[position];

  return {
    metadata: {
      name: part,
      description: description,
      shortName,
      egfPosition: position,
    },
    source: {
      source: 'egf',
      id,
    },
    rules: {
      role: roleWithBackup,
    },
    notes: {
      category,
      'sub-category': subCategory,
      ...rest,
    },
    sequence: sequence, //this field is removed later to conform to schema
  };
};

const mapConnectorFields = (imported) => {
  //fields based on array at top
  const { connector, positions, sequence, id } = imported;

  return {
    metadata: {
      name: connector,
      egfPosition: positions,
    },
    source: {
      source: 'egf',
      id,
    },
    rules: {
      role: 'structural',
    },
    sequence: sequence, //this field is removed later to conform to schema
  };
};

const defaultOutputPath = path.join(__dirname, './partList.json');
const connectorOutputPath = path.join(__dirname, './connectorList.json');

export default function convertCsv(csvPath, isPartInput = 'true', outputPath) {
  invariant(csvPath, 'need a csv path as command line arg');

  const isPart = !(/^false$/i).test(isPartInput);
  const md5sWritten = {}; //hash of md5s writing so don't try to open duplicate files

  return fileSystem.fileRead(csvPath, false)
    .then(contents => {
      return new Promise((resolve, reject) => {
        parse(contents, {}, (err, output) => {
          if (err) return reject(err);
          resolve(output);
        });
      });
    })
    //remove top rows
    .then(lines => lines.slice(headerRows))
    //remove empty lines
    .then(lines => lines.filter(line => line.some(field => !!field)))
    //make object with appropriate keys
    .then(lines => lines.map(line => zip(isPart ? partFields : connectorFields, line)))
    //assign role (for parts, overridden for connectors)
    .then(parts => parts.map(part => Object.assign(part, { role: roleMap[part.category] || null })))
    //map fields to block fields
    .then(parts => parts.map(part => isPart ? mapPartFields(part) : mapConnectorFields(part)))
    //write sequences to /data/, update sequence field
    .then(parts => Promise.all(parts.map(part => {
      const untrimmed = part.sequence;
      const isFirstPosition = part.metadata.egfPosition === '1' || part.metadata.egfPosition.substring(0, 2) === '1-';
      const sequence = trimSequence(untrimmed, isFirstPosition);
      const sequenceMd5 = md5(sequence);
      const filePath = path.join(__dirname, './sequences', sequenceMd5);
      const updatedPart = Object.assign(part, {
        sequence: {
          md5: sequenceMd5,
          length: sequence.length,
          initialBases: '' + sequence.substr(0, 6),
        },
      });

      if (md5sWritten[sequenceMd5] === true) {
        return Promise.resolve(updatedPart);
      }

      md5sWritten[sequenceMd5] = true;
      return fileSystem.fileWrite(filePath, sequence, false)
        .then(() => {
          return updatedPart;
        });
    })))
    //make blocks
    .then(parts => parts.map(part => new Block(part)))
    //write the JSON
    .then(blocks => {
      const path = outputPath || (isPart ? defaultOutputPath : connectorOutputPath);
      return fileSystem.fileWrite(path, blocks);
    });
}

convertCsv.apply(null, process.argv.slice(2));
