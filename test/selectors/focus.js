import {expect, assert} from 'chai';
import {range} from 'lodash';
import {combineReducers} from 'redux';
import * as blockActions from '../../src/actions/blocks';
import * as actions from '../../src/actions/focus';
import * as blockSelectors from '../../src/selectors/blocks';
import * as selectors from '../../src/selectors/focus';
import blocksReducer from '../../src/reducers/blocks';
import focusReducer from '../../src/reducers/focus';
import {simpleStore} from '../store/mocks';
import Block from '../../src/models/Block';

describe('Selectors', () => {
  describe('Focus', () => {
    const storeBlock = new Block();
    const initialState = {
      blocks: {
        [storeBlock.id]: storeBlock,
      },
    };
    const reducer = combineReducers({
      blocks: blocksReducer,
      focus: focusReducer,
    });
    const store = simpleStore(initialState, reducer);

    //in before(), create a tree, where the initial block is the root, with a single lineage, where each node has multiple sibling
    const depth = 5;
    const siblings = 3;
    const root = storeBlock.id;
    const lineage = [root];
    let leaf;
    let focusParent;
    let middleChild;
    let focus1;
    let focus2;

    /* structure:

      root
      |
      focusParent, middleChild, focus1
      |
      focus12, -, -
      |
      ...
      |
      leaf
     */

    before(() => {
      leaf = range(depth).reduce((parentId, index) => {
        const blockIds = range(siblings).map(() => {
          const block = store.dispatch(blockActions.blockCreate());
          store.dispatch(blockActions.blockAddComponent(parentId, block.id));
          return block.id;
        });

        const procreator = blockIds[0];
        lineage.push(procreator);

        return procreator;
      }, root);

      //focus some blocks
      //note that only the first one has children here
      [focusParent, middleChild, focus1] = store.dispatch(blockSelectors.blockGet(root)).components;
      [focus2] = store.dispatch(blockSelectors.blockGet(focusParent)).components;
      store.dispatch(actions.focusBlocks([focus1, focus2]));
    });

    it('focusGetBlockRange()', () => {
      const focused = store.dispatch(selectors.focusGetBlocks());
      const bounds = store.dispatch(selectors.focusGetBlockRange());
      expect(focused.map(block => block.id)).to.eql([focus1, focus2]);
      expect(bounds.map(block => block.id)).to.eql([focusParent, middleChild, focus1]);
    });
  });
});
