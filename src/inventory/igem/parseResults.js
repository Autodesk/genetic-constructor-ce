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
import invariant from 'invariant';
import Block from '../../models/Block';
import Annotation from '../../models/Annotation';
import { merge } from 'lodash';

function normalizePartType(inputType) {
  let partType = inputType.toLowerCase();
  if (partType === 'orf') {
    partType = 'cds';
  }

  return partType;
}

function parseBasicFields(result) {
  const { name, part_type } = result;
  const partType = normalizePartType(part_type);

  return {
    metadata: {
      name: name,
    },
    rules: {
      role: partType,
    },
    source: {
      source: 'igem',
      id: name,
    },
  };
}

//sync
export function parseSearchResult(result) {
  return new Block(parseBasicFields(result));
}

//async
export function parseFullResult(result, searchResult) {
  const { sequence } = result;
  const basics = parseBasicFields(result);
  const annotations = (result.metadata.features && Array.isArray(result.metadata.features.feature)) ?
    result.metadata.features.feature.map(feature => new Annotation({
      isForward: feature.direction === 'forward',
      start: parseInt(feature.startpos, 10),
      end: parseInt(feature.endpos, 10),
      name: feature.title || '',
      type: feature.type || '',
    })) :
    [];

  const additional = {
    metadata: {
      description: result.metadata.part_short_desc,
      author: result.metadata.part_author,
      created: (new Date(result.metadata.part_entered)).valueOf(),
    },
    sequence: {
      annotations,
    },
    source: {
      url: result.metadata.part_url,
    },
  };

  const overrides = {
    id: searchResult.id,
  };

  const block = new Block(merge(basics, additional, overrides));
  return block.setSequence(sequence, false, true);
}

export function parseResults(results) {
  invariant(Array.isArray(results), 'results must be an array');

  return results.map(parseSearchResult);
}
