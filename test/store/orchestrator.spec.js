import { expect } from 'chai';
import store from '../../src/store/index';
import orchestrator from '../../src/store/api';
import * as actions from '../../src/actions/_expose';
import * as selectors from '../../src/actions/_expose';

describe('Store', () => {
  describe('Orchestrator', () => {
    const sections = ['blocks', 'clipboard', 'projects', 'ui', 'inventory', 'inspector'];

    it('should have sections corresponding to store', () => {
      const storeKeys = Object.keys(store.getState());
      const orchestratorKeys = Object.keys(orchestrator);

      expect(sections.every(key => {
        return !!storeKeys[key] && !!orchestratorKeys[key];
      }));
    });

    it('includes all actions and selectors', () => {
      expect(sections.every(section => {
        const merged = Object.assign({},
          actions[section],
          selectors[section]
        );

        return Object.keys(merged).every(func => {
          typeof orchestrator[section][func] === 'function';
        });
      }));
    });

    it('actions dont require dispatch', () => {
      const blockAction = orchestrator.blocks.blockCreate;
      expect(typeof blockAction).to.equal('function');

      //expect this will handle dispatch
      const block = blockAction();
      expect(typeof block).to.not.equal('function');
      expect(block.id).to.be.defined;

      const blockState = store.getState().blocks;
      expect(blockState[block.id]).to.eql(block);
    });

    it('selectors dont require dispatch', () => {
      const child = orchestrator.blocks.blockCreate();
      const parent = orchestrator.blocks.blockCreate({
        components: [child.id],
      });

      const blockSelector = orchestrator.blocks.blockGetParents;
      expect(typeof blockSelector).to.equal('function');

      const foundParents = blockSelector(child.id);
      expect(typeof foundParents).to.not.equal('function');
      expect(foundParents[0].id).to.equal(parent.id);
    });

    it('should be exposed as `api` on the window');
  });
});
