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
import Block from '../../../src/models/Block';

describe('Model', () => {
  describe('Block', () => {
    describe('Rules', () => {
      let block;
      let template;
      beforeEach(() => {
        block = new Block();
        template = new Block({ rules: { fixed: true } });
      });

      it('should not allow adding components when fixed', () => {
        expect(() => template.addComponent(block.id)).to.throw();
      });

      it('should not allow adding components when fixed, unless authoring', () => {
        expect(() => template.setAuthoring(true).addComponent(block.id)).to.not.throw();
      });

      it('should reset components when set to list block', () => {
        const componented = new Block({
          components: [Block.classless().id, Block.classless().id],
        });
        const listed = componented.setListBlock(true);
        expect(listed.components).to.eql([]);
      });

      it('should reset options when set to non-list block', () => {
        const listed = new Block({
          options: {
            [Block.classless().id]: true,
            [Block.classless().id]: true,
          },
        });
        const unlisted = listed.setListBlock(false);
        expect(Object.keys(unlisted.options)).to.eql([]);
      });

      it('cannot unfreeze', () => {
        const frozen = new Block().setFrozen(true);
        expect(() => frozen.setFrozen(false)).to.throw();
      })
    });
  });
});
