import Project from '../../src/models/Project';
import Rollup from '../../src/models/Rollup';

import makeTemplates from './templates';
// import { baseExamples, blocks as exampleBlocks } from './examples';

function makeProject(componentIds) {
  const project = Project.classless({
    rules: { frozen: true },
    metadata: {
      name: 'EGF Sample Templates',
      description: `This project includes a set of templates - combinatorial constructs with biological function - which can be fabricated at the Edinburgh Genome Foundry. This sample project is locked. To use the templates, drag them from the inventory list on the left, into one of your own projects.`,
    },
    components: componentIds,
  });

  project.id = 'egf_' + project.id;

  return project;
}

//make the blocks, make the project, return the rollup
//note that project ID will be set when write the rollup, so dont need to handle that here explicitly
export default function makeEgfRollup() {
  const blocks = makeTemplates();

  //todo - the examples if we want them

  const constructIds = blocks.templates.map(block => block.id);
  const project = makeProject(constructIds);

  //this function sets the projectId on the blocks
  return Rollup.fromArray(project, ...blocks.templates, ...blocks.blocks);
}
