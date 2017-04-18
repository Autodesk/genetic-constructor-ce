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
import ImportGenBankModal from '../components/genbank/import';
import ImportPartsCSVModal from '../components/importpartscsv/importpartscsv';
import ImportDNAForm from '../components/importdna/importdnaform';
import OrderModal from '../containers/orders/ordermodal';
import SaveErrorModal from '../components/modal/SaveErrorModal';

import ConstructViewer from './graphics/views/constructviewer';
import ConstructViewerCanvas from './graphics/views/constructViewerCanvas';
import ProjectDetail from '../components/ProjectDetail';
import ProjectHeader from '../components/ProjectHeader';
import Spinner from '../components/ui/Spinner';
import Inventory from './Inventory';
import Inspector from './Inspector';
import { projectList, projectLoad, projectCreate, projectOpen } from '../actions/projects';
import { uiSetGrunt } from '../actions/ui';
import { focusConstruct } from '../actions/focus';
import { orderList } from '../actions/orders';
import autosaveInstance from '../store/autosave/autosaveInstance';
import loadAllExtensions from '../extensions/loadExtensions';

import '../styles/ProjectPage.css';
import '../styles/SceneGraphPage.css';

class ProjectPage extends Component {
  static propTypes = {
    userId: PropTypes.string,
    projectId: PropTypes.string.isRequired,
    project: PropTypes.object, //if have a project (not fetching)
    constructs: PropTypes.array, //if have a project (not fetching)
    orders: PropTypes.array, //if have a project (not fetching)
    projectCreate: PropTypes.func.isRequired,
    projectList: PropTypes.func.isRequired,
    projectLoad: PropTypes.func.isRequired,
    projectOpen: PropTypes.func.isRequired,
    uiSetGrunt: PropTypes.func.isRequired,
    focusConstruct: PropTypes.func.isRequired,
    orderList: PropTypes.func.isRequired,
  };

  componentDidMount() {
    // todo - use react router History to do this:
    // https://github.com/mjackson/history/blob/master/docs/ConfirmingNavigation.md
    window.onbeforeunload = window.onunload = this.onWindowUnload;

    //load extensions (also see componentWillReceiveProps)
    if (!!this.props.userId) {
      loadAllExtensions();
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!!nextProps.project && Array.isArray(nextProps.project.components) && (!this.props.projectId || nextProps.projectId !== this.props.projectId)) {
      //focus construct if there is one
      if (nextProps.project.components.length) {
        this.props.focusConstruct(nextProps.project.components[0]);
      }

      //get all the projects orders lazily, will re-render when have them
      //run in project page so only request them when we actually load the project
      this.props.orderList(nextProps.projectId);
    }

    //reload extensions if user changed
    //could be smarter about this... but probably not an issue since log the user out and refrresh the page
    if (this.props.userId !== nextProps.userId && nextProps.userId) {
      loadAllExtensions();
    }
  }

  componentWillUnmount() {
    window.onbeforeunload = window.onunload = () => {};
  }

  onWindowUnload(evt) {
    if (autosaveInstance.isDirty() && process.env.NODE_ENV === 'production') {
      return 'Project has unsaved work! Please save before leaving this page';
    }
  }

  render() {
    const { project, projectId, constructs } = this.props;

    //handle project not loaded
    if (!project || !project.metadata) {
      this.props.projectLoad(projectId, false, true)
        .then(project => {
          if (project.id !== projectId) {
            this.props.projectOpen(project.id);
          }
        });
      return (<Spinner styles={{fontSize: '40px', margin: '2em auto'}}/>);
    }

    // build a list of construct viewers
    const constructViewers = constructs.filter(construct => construct).map(construct => {
      return (
        <ConstructViewer key={construct.id}
                         projectId={projectId}
                         constructId={construct.id}/>
      );
    });

    return (
      <div className="ProjectPage">
        <ImportGenBankModal currentProjectId={projectId}/>
        <ImportDNAForm />
        <ImportPartsCSVModal />
        <SaveErrorModal />
        <OrderModal projectId={projectId} />

        <Inventory projectId={projectId}/>

        <div className="ProjectPage-content">

          <ProjectHeader project={project}/>

          <ConstructViewerCanvas currentProjectId={projectId}>
            {constructViewers}
          </ConstructViewerCanvas>

          <ProjectDetail project={project}/>
        </div>

        <Inspector projectId={projectId}/>
      </div>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const userId = state.user.userid;

  const projectId = ownProps.params.projectId;
  const project = state.projects[projectId];

  if (!project) {
    return {
      projectId,
    };
  }

  const constructs = project.components.map(componentId => state.blocks[componentId]);
  const orders = Object.keys(state.orders)
    .map(orderId => state.orders[orderId])
    .filter(order => order.projectId === projectId && order.isSubmitted())
    .sort((one, two) => one.status.timeSent - two.status.timeSent);

  return {
    projectId,
    project,
    constructs,
    orders,
    userId,
  };
}

export default connect(mapStateToProps, {
  projectList,
  projectLoad,
  projectCreate,
  projectOpen,
  uiSetGrunt,
  focusConstruct,
  orderList,
})(ProjectPage);
