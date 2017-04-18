import * as fileSystem from '../../../data/middleware/fileSystem';
import invariant from 'invariant';
import Block from '../../../../src/models/Block';
import parse from 'csv-parse';
import md5 from 'md5';

//one of these fields is required for each block attempting to import
const requiredFields = ['name', 'description', 'role', 'sequence'];

const roleMassageMap = {
  CDS: 'cds',
  promoter: 'promoter',
  terminator: 'terminator',
  gene: 'cds',
  mat_peptide: 'cds',
};

const zip = (keys, vals) => keys.reduce(
  (acc, key, ind) => Object.assign(acc, { [key]: vals[ind] }), {}
);

const mapPartFields = (importedObject) => {
  //fields based on array at top
  const {
    name = 'New Block',
    description = '',
    role = null,
    sequence = null,
    color,
    index = 0,
    fileName = 'CSV Import',
    ...rest,
  } = importedObject;

  //todo - rest of fields should remove the @ symbol
  //can update docs to say this is not necessary

  return {
    metadata: {
      name,
      description,
      color,
      csv_row: index,
      csv_file: fileName,
    },
    rules: {
      role,
    },
    notes: {
      ...rest,
    },
    sequence: sequence, //this field is removed later to conform to schema
  };
};

export function convertCsv(csvContents, fileName, fileUrl) {
  invariant(typeof csvContents === 'string', 'expected a string');

  let fields;
  const sequenceHash = {}; //hash of md5s, update as we go through blocks, write at end

  return new Promise((resolve, reject) => {
    parse(csvContents, {}, (err, output) => {
      if (err) return reject(err);
      resolve(output);
    });
  })
    .then(lines => {
      //remove top rows
      fields = lines.shift(1);

      console.log('csvjs import - using fields: ' + fields.join(', ') + ' for file ' + fileName);

      //todo - ensure these are fields, beyond just making sure a required field is present
      if (!fields.some(fieldName => requiredFields.indexOf(fieldName) >= 0)) {
        return Promise.reject('no required fields present');
      }

      const blockMap = lines
        //remove empty lines
        .filter(line => line.some(field => !!field))
        //make object with appropriate keys
        .map(line => zip(fields, line))
        //assign the index before we do more filtering, and the file name
        //hack - assumes that none were filtered
        .map((part, index) => Object.assign(part, {
          index: `${index + 1}`,
          fileName,
        }))
        //remove parts which do not have any required fields
        .filter(part => requiredFields.some(field => !!part[field]))
        //assign the role
        .map((part, index) => Object.assign(part, {
          role: roleMassageMap[part.role] || part.role || null,
        }))
        //map fields to block fields
        .map(part => mapPartFields(part))
        //assign the source
        .map(part => {
          return Object.assign(part, {
            source: {
              source: 'csv',
              id: fileName,
              url: fileUrl,
            },
          });
        })
        //update the sequence field
        .map(part => {
          const { sequence } = part;

          //only assign seqeuence information if we have a sequence
          if (!!sequence) {
            const sequenceMd5 = md5(sequence);
            Object.assign(part, {
              sequence: {
                md5: sequenceMd5,
                length: sequence.length,
                initialBases: '' + sequence.substr(0, 6),
              },
            });

            Object.assign(sequenceHash, {
              [sequenceMd5]: sequence,
            });
          }

          //wrap in the block scaffold
          return Block.classless(part);
        })
        //convert to map for blockMap
        .reduce((acc, block) => Object.assign(acc, { [block.id]: block }), {});

      return {
        blocks: blockMap,
        sequences: sequenceHash,
      };
    });
}

export default function convertFromFile(csvPath, fileName, fileUrl) {
  invariant(csvPath, 'need a csv path');

  return fileSystem.fileRead(csvPath, false)
    .then((contents) => convertCsv(contents, fileName, fileUrl));
}
