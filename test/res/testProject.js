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
import Block from '../../src/models/Block';
import Project from '../../src/models/Project';

import exampleWithAnnotations from './exampleWithAnnotations';
import dummyBlocks from '../../data/egf_parts/partList.json';

const annotationExample = new Block(exampleWithAnnotations);

const [child1, child2, child3, child4, child5, child6, child7] = dummyBlocks;

const root1 = new Block({
  components: [annotationExample.id, child1.id, child2.id, child3.id],
});

export const blocks = [
  root1,
  annotationExample,
  new Block(child1),
  new Block(Object.assign({}, child2, {
    components: [child4.id, child5.id],
  })),
  new Block(child3),
  new Block(Object.assign({}, child4)),
  new Block(Object.assign({}, child5, {
    components: [child6.id, child7.id],
  })),
  new Block(Object.assign({}, child6)),
  new Block(Object.assign({}, child7)),
];

export const project = new Project({
  id: 'test',
  metadata: {
    name: 'My Test Project',
    description: 'Create a versatile and robust templating system for combinatorial recombinant designs using Yeast parts from EGF.',
  },
  components: [root1.id],
});
