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
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { projectList } from '../../actions/projects';
import { blockStash } from '../../actions/blocks';

import InventoryProject from './InventoryProject';
import Spinner from '../ui/Spinner';

export class InventoryProjectList extends Component {
  static propTypes = {
    currentProject: PropTypes.string.isRequired,
    projects: PropTypes.object.isRequired,
    blockStash: PropTypes.func.isRequired,
    projectList: PropTypes.func.isRequired,
  };

  state = {
    isLoading: true,
  };

  //will retrigger on each load
  componentDidMount() {
    this.props.projectList()
      .then(() => this.setState({ isLoading: false }));
  }

  render() {
    const { projects, currentProject } = this.props;
    const { isLoading } = this.state;

    if (isLoading) {
      return <Spinner />;
    }

    return (!Object.keys(projects).length)
      ?
      (<p>no projects</p>)
      :
      <div className="InventoryProjectList">
        {Object.keys(projects)
          .map(projectId => projects[projectId])
          .sort((one, two) => two.metadata.created - one.metadata.created)
          .map(project => {
            const projectId = project.id;
            const isActive = (projectId === currentProject);

            return (
              <InventoryProject key={projectId}
                                project={project}
                                isActive={isActive}/>
            );
          })}
      </div>
      ;
  }
}

function mapStateToProps(state, props) {
  const { projects } = state;

  return {
    projects,
  };
}

export default connect(mapStateToProps, {
  blockStash,
  projectList,
})(InventoryProjectList);
