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
import { expect, assert } from 'chai';
import saveCombinations from '../../src/utils/generators/orderConstructs';
import { makeOrderPositionals } from '../../test/orders/utils';
import { createListRollup } from '../../test/_utils/rollup';

describe('Orders', () => {
  describe('saveCombinations()', () => {
    const basicNumLists = 2;
    const basicNumOpts = 3;

    const basicListRoll = createListRollup(basicNumLists, basicNumOpts);
    const basicCombosPerConstruct = makeOrderPositionals(basicListRoll);
    const basicCombos = basicCombosPerConstruct[basicListRoll.project.components[0]];

    let combos;

    it('should work', () => {
      combos = saveCombinations(basicCombos);
    });

    it('should generate arrays', () => {
      assert(Array.isArray(combos), 'array');
      assert(Array.isArray(combos[0]), 'array');

      expect(combos.length).to.equal(Math.pow(basicNumOpts, basicNumLists));
      assert(combos.every(combo => combo.length === basicNumLists), 'wrong number in combo');
    });

    it('should be determinisitic', () => {
      expect(saveCombinations(basicCombos)).to.eql(saveCombinations(basicCombos));

      const firstPartId = combos[0][0];
      const constructId = basicListRoll.project.components[0];
      const firstListBlockId = basicListRoll.blocks[constructId].components[0];
      const firstOptionId = Object.keys(basicListRoll.blocks[firstListBlockId].options)[0];

      expect(firstPartId).to.equal(firstOptionId);

      //todo better test all spots
    });

    it('should work for a million of combinations', () => {
      const numOpts = 10;
      const numLists = 6;
      const bigList = createListRollup(numLists, numOpts);
      const bigCombosPerConstruct = makeOrderPositionals(bigList);
      const bigCombos = bigCombosPerConstruct[bigList.project.components[0]];

      const combos = saveCombinations(bigCombos);

      expect(combos.length).to.equal(Math.pow(numOpts, numLists));
    });

    //todo - track memory use
    it.skip('should work for MANY millions of combinations');
  });
});
