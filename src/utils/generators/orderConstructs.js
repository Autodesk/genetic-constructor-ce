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

/**
 * Given positional possiblities, generate combinations deterministically
 *
 * Note - called on client and server - do not use Node buffers
 *
 * @param combos {Array.<Array.<number>>} Positional options, e.g. [ [1,2,3], [4,5,6], [7] ]
 */
//actually generate each combination as a string, since this can be a huge memory hog otherwise
//note - string poops out at about 2^27 chars, so whole things as string works poorly
export default function saveCombinations(combos) {
  invariant(Array.isArray(combos), 'must pass an array');

  const len = combos.reduce((acc, row) => acc * row.length, 1);

  invariant(len <= Math.pow(10, 7), 'too many combinatorials until combination generation is optimized, got ' + len);

  const collector = new Array(len).fill();
  let counter = 0;

  /**
   * Given positional possiblities, generate combinations deterministically
   *
   * @param position = 0
   * @param currentPermutation = []
   */
  function generateCombos(position, currentPermutation) {
    //const options = combos[position];
    for (let index = 0; index < combos[position].length; index++) {
      currentPermutation[position] = combos[position][index]; //just re-assign so dont bash memory to bits

      if (position === combos.length - 1) {
        collector[counter] = currentPermutation.slice();
        //collector[counter] = '["' + currentPermutation.join('","') + '"]';
        counter++;
      } else {
        generateCombos(position + 1, currentPermutation);
      }
    }
  }

  generateCombos(0, []);
  return collector;

  /*
  //strings cap at 2^27 characters so are not long enough
  let str = '[';

  function generateCombos(position, currentPermutation) {
    const options = combos[position];

    for (let index = 0; index < options.length; index++) {
      currentPermutation[position] = options[index]; //just re-assign so dont bash memory to bits

      if (position === combos.length - 1) {
        str = str + `["${currentPermutation.join('","')}"],`;
      } else {
        generateCombos(position + 1, currentPermutation);
      }
    }
  }

  generateCombos(0, []);

  return str.slice(0, -1) + ']';
  */
}
