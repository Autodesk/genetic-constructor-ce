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

import { assert, expect } from 'chai';
import * as blockActions from '../../src/actions/blocks';
import * as blockSelectors from '../../src/selectors/blocks';
import * as actions from '../../src/actions/projects';
import * as selectors from '../../src/selectors/projects';
import configureStore from '../../src/store/configureStore';
import Block from '../../src/models/Block';
import Project from '../../src/models/Project';

describe('Actions', () => {
  describe('Projects', () => {
    let store;
    let block;
    let project;
    const extraProjectId = Project.classless().id;

    before(() => {
      store = configureStore();
      block = store.dispatch(blockActions.blockCreate());
    });

    it('projectCreate() makes a project', () => {
      project = store.dispatch(actions.projectCreate({
        components: [block.id],
      }));

      assert(Project.validate(project), 'should be valid');
      expect(store.getState().projects[project.id]).to.equal(project);
    });

    describe('Files', () => {
      const namespace = 'testSpace';
      const fileName = 'myFile';
      const fileContents = 'blah' + Math.random();

      it('projectFileWrite() updates the project', () => {
        assert(project.files.length === 0, 'should have no files');
        return store.dispatch(actions.projectFileWrite(project.id, namespace, fileName, fileContents))
          .then(proj => {
            project = proj;
            assert(project.files.length === 1, 'should have updated files');
            assert(project.files[0].namespace === namespace, 'should have same namespace');
            assert(project.files[0].name === fileName, 'should have name as file name');
          });
      });

      it('projectFileRead() gets the file', () => {
        return store.dispatch(selectors.projectFileRead(project.id, namespace, fileName))
          .then(contents => {
            expect(contents).to.equal(fileContents);
          });
      });
    });
  });
});
