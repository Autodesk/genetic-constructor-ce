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
import Block from '../../models/Block';
import { connect } from 'react-redux';
import { blockClone, blockLoad, blockStash } from '../../actions/blocks';
import { block as blockDragType } from '../../constants/DragTypes';
import { getBlockRoles, getBlocksWithRole } from '../../middleware/querying';
import { symbolMap } from '../../inventory/roles';

//bit of a hack, since we are not storing this information in the store (since its really derived data) but need to update it
import { lastAction, subscribe } from '../../store/index';
import * as ActionTypes from '../../constants/ActionTypes';

import InventoryListGroup from './InventoryListGroup';
import InventoryList from './InventoryList';
import Spinner from '../ui/Spinner';

//note - must match storage API
const noRoleKey = 'none';

export class InventoryRoleMap extends Component {
  static propTypes = {
    blockStash: PropTypes.func.isRequired,
    blockClone: PropTypes.func.isRequired,
    blockLoad: PropTypes.func.isRequired,
  };

  state = {
    loadingMap: true,
    loadedTypes: {},
    typeMap: {},
  };

  componentDidMount() {
    //returns a map { <rolekey> : number }
    getBlockRoles().then(typeMap => this.setState({
      typeMap,
      loadingMap: false,
    }));

    //update the state map when roles change (since otherwise we only upload when component loads)
    //hack - ideally this would be derived data. However, to derive, need all the blocks in the store. So, we'll patch it.
    //apolgies for denseness, but intend to get rid of this before too long
    this.storeSubscriber = subscribe(() => {
      const action = lastAction();
      //todo - should handle creating new blocks and stuff
      //usually, not looking at this section when creating new blocks? ignoring for now...
      if (action.type === ActionTypes.BLOCK_SET_ROLE) {
        const { oldRole, block } = action;
        const oldRoleEff = oldRole || noRoleKey;
        const newRole = block.rules.role || noRoleKey;

        const newTypeMap = Object.assign({}, this.state.typeMap, {
          [oldRoleEff]: this.state.typeMap[oldRoleEff] - 1,
          [newRole]: (this.state.typeMap[newRole] || 0) + 1,
        });
        const newLoadedTypes = Object.assign({}, this.state.loadedTypes, {
          [oldRoleEff]: (this.state.loadedTypes[oldRoleEff] || []).filter(roleBlock => block.id !== roleBlock.id),
          [newRole]: [...(this.state.loadedTypes[newRole] || []), block],
        });
        this.setState({
          typeMap: newTypeMap,
          loadedTypes: newLoadedTypes,
        });
      }
    });
  }

  componentWillUnmount() {
    this.storeSubscriber();
  }

  onToggleType = (nextState, type) => {
    if (!nextState) return;
    //no caching for now...
    //when update to a cache, this should live update (right now, updates only when change tabs)

    //loading
    this.setRoleType(type, false);

    getBlocksWithRole(type)
      .then(blockMap => {
        const blocks = Object.keys(blockMap).map(blockId => new Block(blockMap[blockId]));
        this.setRoleType(type, blocks);
      });
  };

  onBlockDrop = (item, target) => {
    //get components if its a construct and add blocks to the store
    //note - this may be a very large query
    //note - used to unhide blocks but lets see what desired behavior is
    return this.props.blockLoad(item.id, item.projectId, true, true)
      .then(blocks => blocks[item.id]);
  };

  //false is for loading
  setRoleType(type, blocks = false) {
    this.setState({
      loadedTypes: Object.assign(this.state.loadedTypes, { [type]: blocks }),
    });
  }

  render() {
    const { typeMap, loadedTypes, loadingMap } = this.state;

    const content = loadingMap ?
      <Spinner /> :
      Object.keys(typeMap).sort().map(type => {
        const count = typeMap[type];
        const name = symbolMap[type] || type;
        const items = loadedTypes[type] || [];
        const isLoading = loadedTypes[type] === false;
        return (
          <InventoryListGroup key={type}
                              title={name + ` (${count})`}
                              isLoading={isLoading}
                              onToggle={(nextState) => this.onToggleType(nextState, type)}
                              dataAttribute={`roleMap ${name}`}>
            <InventoryList inventoryType={blockDragType}
                           onDrop={this.onBlockDrop}
                           items={items}
                           dataAttributePrefix={`roleMap ${name}`}/>
          </InventoryListGroup>
        );
      });

    return (
      <div className="InventoryRoleMap">
        {content}
      </div>
    );
  }
}

export default connect(() => ({}), {
  blockStash,
  blockLoad,
  blockClone,
})(InventoryRoleMap);
