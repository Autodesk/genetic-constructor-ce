/*
 Copyright 2016 Autodesk,Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
import rejectingFetch from './utils/rejectingFetch';
import { headersGet, headersPost } from './utils/headers';
import { dataApiPath } from './utils/paths';
import { generatePseudoMd5, getSequencesFromMap } from '../utils/sequenceMd5';

const getSequenceUrl = (md5, range) => {
  if (range) {
    const psuedoMd5 = generatePseudoMd5(md5, range);
    return dataApiPath(`sequence/${psuedoMd5}]`);
  }
  return dataApiPath(`sequence/${md5 || ''}`);
};

const cacheSequence = (md5, sequence) => {
  //do nothing for now... will need to handle byte range somehow
  //setLocal(md5, sequence);
};

//expects pseudoMd5, or realMd5 and optional range
export const getSequence = (md5, range) => {
  if (!md5) {
    return Promise.resolve(null);
  }

  const url = getSequenceUrl(md5, range);

  //const cached = getLocal(md5);
  //if (cached) {
  //  return Promise.resolve(cached);
  //}

  return rejectingFetch(url, headersGet())
    .then((resp) => resp.text())
    .then(sequence => {
      cacheSequence(md5, sequence);
      return sequence;
    });
};

//expects map in form { blockId: pseudoMd5 }
export const getSequences = (blockIdsToMd5s) => {
  return getSequencesFromMap(blockIdsToMd5s, (seqMd5) => getSequence(seqMd5));
};

export const writeSequence = (sequence) => {
  const url = getSequenceUrl();
  const stringified = JSON.stringify({ sequence });

  return rejectingFetch(url, headersPost(stringified))
    .then(resp => resp.text())
    .then(md5 => {
      cacheSequence(md5, sequence);
      return md5;
    });
};
