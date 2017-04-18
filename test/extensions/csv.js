import path from 'path';
import fs from 'fs';
import { expect } from 'chai';
import request from 'supertest';
import { convertCsv } from '../../server/extensions/native/csv/convert';
import { extensionApiPath } from '../../src/middleware/utils/paths';
import { callExtensionApi } from '../../src/middleware/extensions'
import rejectingFetch from '../../src/middleware/utils/rejectingFetch';

describe('Extensions', () => {
  describe('CSV', () => {
    const fileName = 'simplecsv.csv';
    const filePath = path.resolve(__dirname, '../res/' + fileName);
    const fileContents = fs.readFileSync(filePath, 'utf8');

    /*
     //in the browser this works, but not node
     const file = new File([fileContents], fileName);
     const formData = new FormData();
     formData.append('data', file, file.name);
     */

    it('should convert a simple file', () => {
      return convertCsv(fileContents)
        .then(({ blocks, sequences }) => {
          expect(Object.keys(blocks).length === 1);
          expect(Object.keys(sequences).length === 1);

          const block = blocks[Object.keys(blocks)[0]];
          expect(block.metadata.name).to.equal('Blah');
          //check case of fields too
          expect(block.notes.customField).to.eql('woogity!');
        });
    });

    it.skip('should work via REST', () => {
      //we have to mock uploading the file
      const boundary = '----' + Math.random();

      //mock a file.. this is really hard to get right
      const body = `${boundary}
Content-Disposition: form-data; name="data"; filename="${filePath}"
Content-Type: application/octet-stream


${fileContents}
${boundary}
`;

      return callExtensionApi('csv', 'convert', {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body,
      })
        .then(resp => {
          expect(resp.status).to.equal(200);
          return resp.json();
        })
        .then(response => {
          const block = response.blocks[Object.keys(response.blocks)[0]];
          expect(block.metadata.name).to.equal('Blah');
        });
    });

    it('should write sequences to files');
  });
});
