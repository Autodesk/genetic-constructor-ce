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

import { block as blockDragType } from '../../constants/DragTypes';
import { chain } from 'lodash';

import InventoryList from './InventoryList';
import InventoryListGroup from './InventoryListGroup';

export default class InventorySearchResultsByKind extends Component {
  static propTypes = {
    searchResults: PropTypes.object.isRequired,
    sourcesVisible: PropTypes.object.isRequired,
    onListGroupToggle: PropTypes.func.isRequired,
    onItemSelect: PropTypes.func.isRequired,
    onItemDrop: PropTypes.func.isRequired,
  };

  renderChain() {
    const { searchResults, sourcesVisible, onListGroupToggle, onItemSelect, onItemDrop } = this.props;

    //todo - item.source ?? shouldn't this be item.source.source? or is this getting overridden? document.

    return chain(searchResults)
      .map((sourceResults, sourceKey) => sourceResults.map(block => block.merge({ source: sourceKey })))
      .values()
      .flatten()
      .groupBy('rules.role')
      .map((items, group) => {
        const listingItems = items;
        return (
          <InventoryListGroup title={`${group} (${listingItems.length})`}
                              disabled={!listingItems.length}
                              manual
                              isExpanded={sourcesVisible[group]}
                              onToggle={() => onListGroupToggle(group)}
                              key={group}
                              dataAttribute={`searchgroup-role ${group}`}>
            <InventoryList inventoryType={blockDragType}
                           onDrop={(item) => onItemDrop(item.source, item)}
                           onSelect={(item) => onItemSelect(item.source, item)}
                           items={listingItems}
                           dataAttributePrefix={`searchresult ${group}`}/>
          </InventoryListGroup>
        );
      });
  }

  render() {
    return (
      <div className="InventorySearchResultGroup">
        {this.renderChain().value()}
      </div>
    );
  }
}
