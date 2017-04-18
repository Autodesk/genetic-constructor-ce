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
import { transact, commit } from '../../store/undo/actions';

import InventoryItem from './InventoryItem';

import '../../styles/InventoryList.css';

export class InventoryList extends Component {
  static propTypes = {
    inventoryType: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
    })).isRequired,
    dataAttributePrefix: PropTypes.string,
    onDrop: PropTypes.func, //passed to items
    onSelect: PropTypes.func, //passed to items
    transact: PropTypes.func,
    commit: PropTypes.func,
  };

  static defaultProps = {
    dataAttributePrefix: '',
  };

  render() {
    const { items, inventoryType, dataAttributePrefix, onDrop, onSelect, transact, commit } = this.props;

    return (
      <div className="InventoryList no-vertical-scroll">
        {items.map(item => {
          return (
            <InventoryItem key={item.id}
                           inventoryType={inventoryType}
                           onDragStart={transact}
                           onDragComplete={commit}
                           onDrop={onDrop}
                           onSelect={onSelect}
                           item={item}
                           dataAttribute={`${dataAttributePrefix} ${item.id}`}/>
          );
        })}
      </div>
    );
  }
}

export default connect(() => ({}), {
  transact,
  commit,
})(InventoryList);
