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
import * as ActionTypes from '../constants/ActionTypes';
import * as instanceMap from '../store/instanceMap';

const initialState = {};

if (process.env.NODE_ENV === 'test') {
  const testProject = require('../../test/res/testProject').project;
  Object.assign(initialState, {
    test: testProject,
  });
}

export default function projects(state = initialState, action) {
  switch (action.type) {
  case ActionTypes.PROJECT_CREATE :
  case ActionTypes.PROJECT_LOAD :
  case ActionTypes.PROJECT_MERGE :
  case ActionTypes.PROJECT_RENAME :
  case ActionTypes.PROJECT_REMOVE_CONSTRUCT:
  case ActionTypes.PROJECT_ADD_CONSTRUCT :
  case ActionTypes.PROJECT_FILE_WRITE :
    const { project } = action;
    instanceMap.saveProject(project);
    return Object.assign({}, state, { [project.id]: project });

  case ActionTypes.PROJECT_SNAPSHOT :
  case ActionTypes.PROJECT_SAVE :
    const { projectId, version, time } = action;
    const gotProject = state[projectId];
    const updatedProject = gotProject.updateVersion(version, time);
    instanceMap.saveProject(updatedProject);
    return Object.assign({}, state, { [projectId]: updatedProject });

  case ActionTypes.PROJECT_LIST :
    const { projects } = action;
    instanceMap.saveProject(...projects);
    const zippedProjects = projects.reduce((acc, project) => Object.assign(acc, { [project.id]: project }), {});
    //prefer state versions to zipped versions
    return Object.assign({}, zippedProjects, state);

  case ActionTypes.PROJECT_DELETE : {
    const { projectId } = action;
    const nextState = Object.assign({}, state);
    delete nextState[projectId];
    instanceMap.removeProject(projectId);
    return nextState;
  }

  default :
    return state;
  }
}
