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

import InventoryProjectList from './InventoryProjectList';
import InventoryRoleMap from './InventoryRoleMap';
import InventoryTabs from './InventoryTabs';

export default class InventoryGroupProjects extends Component {
  static propTypes = {
    currentProject: PropTypes.string.isRequired,
  };

  constructor() {
    super();

    this.inventoryTabs = [
      { key: 'project', name: 'By Project' },
      { key: 'type', name: 'By Kind' },
    ];
  }

  state = {
    groupBy: 'project',
  };

  onTabSelect = (key) => {
    this.setState({ groupBy: key });
  };

  render() {
    const { currentProject } = this.props;
    const { groupBy } = this.state;

    const currentList = groupBy === 'type'
      ?
      <InventoryRoleMap />
      :
      <InventoryProjectList currentProject={currentProject}/>;

    return (
      <div className="InventoryGroup-content InventoryGroupProjects">
        <InventoryTabs tabs={this.inventoryTabs}
                       activeTabKey={groupBy}
                       onTabSelect={(tab) => this.onTabSelect(tab.key)}/>
        <div className="InventoryGroup-contentInner no-vertical-scroll">
          {currentList}
        </div>
      </div>
    );
  }
}
