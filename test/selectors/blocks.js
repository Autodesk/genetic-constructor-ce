import { expect, assert } from 'chai';
import { range } from 'lodash';
import * as actions from '../../src/actions/blocks';
import * as selectors from '../../src/selectors/blocks';
import blocksReducer from '../../src/reducers/blocks';
import { simpleStore } from '../store/mocks';
import Block from '../../src/models/Block';

describe('Selectors', () => {
  describe('Blocks', () => {
    describe('Parents, Children, etc.', () => {
      const storeBlock = new Block();
      const initialState = {
        [storeBlock.id]: storeBlock,
      };
      const blockStore = simpleStore(initialState, blocksReducer, 'blocks');

      //in before(), create a tree, where the initial block is the root, with a single lineage, where each node has multiple sibling
      const depth = 5;
      const siblings = 3;
      const root = storeBlock.id;
      const lineage = [root];
      let leaf;

      before(() => {
        leaf = range(depth).reduce((parentId, index) => {
          const blockIds = range(siblings).map(() => {
            const block = blockStore.dispatch(actions.blockCreate());
            blockStore.dispatch(actions.blockAddComponent(parentId, block.id));
            return block.id;
          });

          const procreator = blockIds[0];
          lineage.push(procreator);

          return procreator;
        }, root);
      });

      it('blockGetParents() works + returns blocks', () => {
        const parents = blockStore.dispatch(selectors.blockGetParents(leaf));

        expect(parents.length).to.equal(depth);
        expect(parents.map(parent => parent.id).reverse().concat(leaf)).to.eql(lineage);
      });

      it('blockGetParentRoot() gets root block', () => {
        const parent = blockStore.dispatch(selectors.blockGetParentRoot(leaf));

        expect(parent.id).to.equal(root);
      });

      it('blockGetSiblings()', () => {
        const sibs = blockStore.dispatch(selectors.blockGetSiblings(leaf));
        expect(sibs.length).to.equal(siblings);

        const parents = blockStore.dispatch(selectors.blockGetParents(leaf));
        const parent = parents[0];
        expect(parent.components).to.eql(sibs.map(sib => sib.id));
      });

      it('blockGetIndex()', () => {
        const index = blockStore.dispatch(selectors.blockGetIndex(leaf));
        expect(index).to.equal(0);

        const parents = blockStore.dispatch(selectors.blockGetParents(leaf));
        const parent = parents[0];
        expect(parent.components[0]).to.eql(leaf);
      });

      it('blockGetComponentsByDepth()', () => {
        const byDepth = blockStore.dispatch(selectors.blockGetComponentsByDepth(root));
        const keys = Object.keys(byDepth);
        expect(typeof byDepth).to.equal('object');
        expect(keys.length).to.equal(depth * siblings);
        assert(keys.every(key => {
          return byDepth[key] >= 1 && byDepth[key] <= 5;
        }), 'wrong values for depth');
      });
    });
  });

  describe('Spec v Sketch', () => {
    const childA = new Block({
      sequence: {
        length: 20,
        url: 'somewhere',
      },
    });
    const parentA = new Block({
      components: [childA.id],
    });
    const childB = new Block({});
    const parentB = new Block({
      components: [childB.id],
    });
    const initialState = {
      [parentA.id]: parentA,
      [parentB.id]: parentB,
      [childA.id]: childA,
      [childB.id]: childB,
    };
    const blockStore = simpleStore(initialState, blocksReducer, 'blocks');
    const sequence = 'actgactgactgactagctacgatcgtacgactgacgtactcg';

    before(function setupSketchSpec() {
      this.timeout(20000);
      return blockStore.dispatch(actions.blockSetSequence(childA.id, sequence))
        .catch(() => {
          console.error('uh oh - probably shouldnt catch this....');
        });
    });

    it('blockIsSpec() for one block', () => {
      const isSpecA = blockStore.dispatch(selectors.blockIsSpec(childA.id));
      expect(isSpecA).to.equal(true);

      const isSpecB = blockStore.dispatch(selectors.blockIsSpec(childB.id));
      expect(isSpecB).to.equal(false);
    });

    it('blockIsSpec() recursively', () => {
      const isSpecA = blockStore.dispatch(selectors.blockIsSpec(parentA.id));
      expect(isSpecA).to.equal(true);

      const isSpecB = blockStore.dispatch(selectors.blockIsSpec(parentB.id));
      expect(isSpecB).to.equal(false);
    });
  });
});
