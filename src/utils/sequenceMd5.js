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

import _ from 'lodash';
import invariant from 'invariant';

/*
 terminology

 realMd5 - just a hash, as returned by md5() - e.g. 'c31e41940cd12cf9b24b0e528ab955bc'
 pseudoMd5 - hash and range specified -  e.g. 'c31e41940cd12cf9b24b0e528ab955bc[23:958]'
 */

//parses pseudoMd5 in form acde79489cad6a8da9cea[10:900]
const pseudoMd5Regex = /^([a-z0-9]{32})(\[(\d+):(\d+?)\])?$/;

//checks if a realMd5
const realMd5Regex = /^[a-f0-9]{32}$/;

export const validRealMd5 = (realMd5) => realMd5Regex.test(realMd5);

export const validPseudoMd5 = (pseudoMd5) => pseudoMd5Regex.test(pseudoMd5);

//accepts array or start and end separately
export const generatePseudoMd5 = (realMd5, start, end) => {
  if (!start && !end) {
    return realMd5;
  }
  invariant(validRealMd5(realMd5), 'cannot have byte range in md5 if specify a range');
  if (Array.isArray(start)) {
    invariant(start.length === 2, 'range must be an array of length 2');
    invariant(Number.isInteger(start[0]) && Number.isInteger(start[1]) && start[0] < start[1], 'must pass numbers, where start < end');
    return `${realMd5}[${start[0]}:${start[1]}]`;
  }
  invariant(Number.isInteger(start) && Number.isInteger(end) && start < end, 'must pass numbers, where start < end');
  return `${realMd5}[${start}:${end}]`;
};

//start and end will only be defined if byte range is specified
export const parsePseudoMd5 = (pseudoMd5) => {
  if (!pseudoMd5) {
    return {};
  }

  invariant(typeof pseudoMd5 === 'string', `must pass a string, got ${pseudoMd5}`);

  const match = pseudoMd5.match(pseudoMd5Regex);
  if (!match) {
    //todo - should return null. need to update all usages expecting object to destructure
    return {};
  }
  const [ original, hash, byteRange, start, end ] = match;
  return {
    original,
    hash,
    byteRange,
    hasRange: !!byteRange,
    start: parseInt(start, 10),
    end: parseInt(end, 10),
  };
};

// expects { blockId: pseudoMd5 }
// returns map { blockId: { hash, start, end } }
const parseBlockToMd5Map = (blockIdsToMd5s) => _.mapValues(blockIdsToMd5s, (pseudoMd5, blockId) => parsePseudoMd5(pseudoMd5));

// reduce a whole bunch of blocks with pseudoMd5s to fetch inclusive ranges of each file, rather than each range separately
// expects { blockId: pseudoMd5 }
// returns map of { realMd5: range }
// where range may be `true` to fetch the whole thing, or [earliest, latest]
const dedupeBlocksToMd5s = (blockIdsToMd5s) => {
  const blockParsedMap = parseBlockToMd5Map(blockIdsToMd5s);

  // dedupe to the things we want to fetch
  return _.reduce(blockParsedMap, (acc, parsedMd5) => {
    const { hash, start, end } = parsedMd5;

    //got an empty match
    if (!hash) {
      return acc;
    }

    //if no byte range, or already getting the whole thing, then get the whole thing
    if ((!start && !end) || acc[hash] === true) {
      return Object.assign(acc, { [hash]: true });
    }

    //if new hash, mark it
    if (!acc[hash]) {
      return Object.assign(acc, { [hash]: [start, end] });
    }

    //if we're here, have a range, and already exists, so need to expand range
    const [oldStart, oldEnd] = acc[hash];
    const nextBounds = [Math.min(start, oldStart), Math.max(end, oldEnd)];
    return Object.assign(acc, { [hash]: nextBounds });
  }, {});
};

//expects:
// fetchedMd5ToSequence - { realMd5: fetchedSequenceFragment }
// dedupedRangeMap - result of dedupeBlocksToMd5s
// blockIdsToMd5s - { blockId: [start, end] OR true }
// returns
const remapDedupedBlocks = (fetchedMd5ToSequence, dedupedRangeMap, blockIdsToMd5s) => {
  const blockParsedMap = parseBlockToMd5Map(blockIdsToMd5s);

  //generate blockId: sequence, normalizing for byte range requested
  return _.mapValues(blockParsedMap, (parsedMd5) => {
    const { hash, start = 0, end } = parsedMd5;
    const range = dedupedRangeMap[hash];
    const sequence = fetchedMd5ToSequence[hash]; //fetched sequence... may just be a range

    //if wasn't in the rangeMap, then no seq to worry about
    if (!range) {
      return null;
    }

    //if range is true, we got the whole thing
    if (range === true) {
      return sequence;
    }

    // calculate normalized range
    // start offset by fragment fetched
    const normStart = start - range[0];
    // end at normalized start + length wanted
    const normEnd = normStart + (end - start);

    const normSequence = sequence.slice(normStart, normEnd);

    return normSequence;
  });
};

//expects object in form { blockId: pseudoMd5 } and retrieval function, passed (pseudoMd5), which must return promise
//returns object in form { blockId: sequence }
export const getSequencesFromMap = (blockIdsToMd5s, retrievalFn) => {
  invariant(typeof retrievalFn === 'function', 'must pass retrieval function');

  //generates map { realMd5: range }
  const rangeMap = dedupeBlocksToMd5s(blockIdsToMd5s);

  //calc ahead to perserve order in case of object key issues, since promise.all works on arrays
  const hashes = Object.keys(rangeMap);

  return Promise.all(
    hashes.map(hash => retrievalFn(hash, rangeMap[hash]))
  )
    .then(sequences => {
      // { realMd5: sequenceDedupedRange }
      const hashToSequence = _.zipObject(hashes, sequences);

      return remapDedupedBlocks(hashToSequence, rangeMap, blockIdsToMd5s);
    });
};
