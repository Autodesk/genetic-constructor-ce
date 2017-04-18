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
import { createListRollup } from '../_utils/rollup';
import Order from '../../src/models/Order';

const numLists = 4;
const numOpts = 5;

export const makeOrderRoll = (lists = numLists, opts = numOpts) => createListRollup(numLists, numOpts);

//todo - dont require sending positional combinations to server. share code better.
//only works when single depth, either block or list block (no hierarchy)
export const makeOrderPositionals = (roll, indexWanted = 0) => {
  const componentId = roll.project.components[indexWanted];

  const combos = roll.blocks[componentId].components
    .map(componentId => {
      const opts = Object.keys(roll.blocks[componentId].options);

      return opts.length > 0 ?
        opts.map(optionId => roll.blocks[optionId]) :
        [roll.blocks[componentId]];
    })
    .map(combo => combo.map(part => part.id));

  return { [componentId ]: combos };
};

//note, has no version
export const makeOnePotOrder = (roll, constructIndex = 0) => Order.classless({
  projectId: roll.project.id,
  constructIds: [roll.project.components[constructIndex]],
  numberCombinations: 20,               //hack - should not be required
  parameters: {
    onePot: true,
  },
});

//note, has no version
export const makeSelectionOrder = (roll, constructIndex = 0, indices = [1, 5, 9, 13, 17]) => {
  const activeIndices = indices.reduce((acc, num) => Object.assign(acc, { [num]: true }), {});

  return Order.classless({
    projectId: roll.project.id,
    constructIds: [roll.project.components[constructIndex]],
    numberCombinations: 20,               //hack - should not be required
    parameters: {
      onePot: false,
      permutations: 5,
      combinatorialMethod: 'Random Subset',
      activeIndices,
    },
  });
};
