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
import { role as roleDragType } from '../../constants/DragTypes';
import Block from '../../models/Block';
import InventoryItem from './InventoryItem';

export default class InventoryItemRole extends Component {
  static propTypes = {
    role: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }).isRequired,
  };

  constructor(props) {
    super(props);

    //this comes from inventory/roles.js
    const symbol = this.props.role;

    //make this a block so that it shows up in the inspector properly
    this.roleBlock = new Block({
      id: symbol.id,
      metadata: {
        name: symbol.name,
        color: null,
      },
      rules: {
        role: symbol.id === 'null' ? null : symbol.id,
      },
    });
  }

  render() {
    const { role, ...rest } = this.props;

    return (
      <div className="InventoryItemRole">
        <InventoryItem {...rest}
          inventoryType={roleDragType}
          svg={role.id}
          item={this.roleBlock}
          dataAttribute={`sbol ${role.id}`}/>
      </div>
    );
  }
}
