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
import { inspectorToggleVisibility } from '../actions/ui';
import { _getFocused } from '../selectors/focus';

import InspectorRole from '../components/Inspector/InspectorRole';
import InspectorBlock from '../components/Inspector/InspectorBlock';
import InspectorProject from '../components/Inspector/InspectorProject';

import '../styles/Inspector.css';
import '../styles/SidePanel.css';

export class Inspector extends Component {
  static propTypes = {
    isVisible: PropTypes.bool.isRequired,
    inspectorToggleVisibility: PropTypes.func.isRequired,
    readOnly: PropTypes.bool.isRequired,
    isAuthoring: PropTypes.bool.isRequired,
    forceIsConstruct: PropTypes.bool.isRequired,
    type: PropTypes.string.isRequired,
    focused: PropTypes.any.isRequired,
    project: PropTypes.object,
    construct: PropTypes.object,
    orders: PropTypes.array.isRequired,
    overrides: PropTypes.object.isRequired,
  };

  toggle = (forceVal) => {
    this.props.inspectorToggleVisibility(forceVal);
  };

  render() {
    const { isVisible, focused, project, construct, orders, overrides, type, readOnly, forceIsConstruct, isAuthoring } = this.props;

    // inspect instances, or construct if no instance or project if no construct or instances
    let inspect;
    switch (type) {
    case 'role' :
      inspect = (<InspectorRole roleId={focused} readOnly/>);
      break;
    case 'project':
      inspect = (<InspectorProject instance={focused}
                                   orders={orders}
                                   readOnly={readOnly}/>);
      break;
    case 'construct':
    default:
      inspect = (<InspectorBlock instances={focused}
                                 overrides={overrides}
                                 orders={orders}
                                 readOnly={readOnly}
                                 isAuthoring={isAuthoring}
                                 project={project}
                                 construct={construct}
                                 forceIsConstruct={forceIsConstruct}/>);
      break;
    }

    return (
      <div className={'SidePanel Inspector' +
      (isVisible ? ' visible' : '') +
      (readOnly ? ' readOnly' : '')}>

        <div className="SidePanel-heading">
          <button tabIndex="-1" className="button-nostyle SidePanel-heading-trigger Inspector-trigger"
                  onClick={() => this.toggle()}/>
          <div className="SidePanel-heading-content">
            <span className="SidePanel-heading-title">Inspector</span>
            <button tabIndex="-1" className="button-nostyle SidePanel-heading-close"
                    onClick={() => this.toggle(false)}/>
          </div>
        </div>

        <div className="SidePanel-content no-vertical-scroll">
          {inspect}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  const { isVisible } = state.ui.inspector;

  const { level, blockIds, constructId } = state.focus;
  const currentProject = state.projects[props.projectId];

  const currentConstruct = state.blocks[constructId];

  //delegate handling of focus state handling to selector
  const { type, readOnly, focused } = _getFocused(state, true, props.projectId);

  //handle overrides if a list option
  const overrides = {};
  if (type === 'option') {
    const blockId = state.focus.blockIds[0];
    const block = state.blocks[blockId];
    if (!!block) {
      Object.assign(overrides, {
        color: block.getColor(),
        role: block.getRole(false),
      });
    }
  }

  const forceIsConstruct = (level === 'construct') ||
    blockIds.some(blockId => currentProject.components.indexOf(blockId) >= 0);

  const isAuthoring = !!state.focus.constructId && state.blocks[state.focus.constructId].isAuthoring() && focused.length === 1 && type !== 'project' && !readOnly;

  const orders = Object.keys(state.orders)
    .map(orderId => state.orders[orderId])
    .filter(order => order.projectId === currentProject.id && order.isSubmitted())
    .sort((one, two) => one.status.timeSent - two.status.timeSent);

  return {
    isVisible,
    type,
    readOnly,
    forceIsConstruct,
    project: currentProject,
    construct: currentConstruct,
    focused,
    orders,
    overrides,
    isAuthoring,
  };
}

export default connect(mapStateToProps, {
  inspectorToggleVisibility,
})(Inspector);
