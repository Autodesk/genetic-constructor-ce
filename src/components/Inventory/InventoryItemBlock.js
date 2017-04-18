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
import invariant from 'invariant';
import Block from '../../models/Block';
import { block as blockDragType } from '../../constants/DragTypes';

import InventoryItem from './InventoryItem';

//note - Supports templates - assumes that no additional work is needed when cloning templates than just blocks. Right now, this assumption is true because the whole project is loaded when you toggle it (and therefore all template options + components will be in the store)
// Use InventoryConstruct if you have a block that may be a construct (with components) OR a block, and it will delegate properly (and show construct with toggler if it is indeed a construct)

export default class InventoryItemBlock extends Component {
  static propTypes = {
    block: (props, propName) => {
      if (!(Block.validate(props[propName]) && props[propName] instanceof Block)) {
        return new Error('must pass a real block (Block model) to InventoryItemBlock');
      }
    },
    defaultName: PropTypes.string.isRequired,
  };

  componentDidMount() {
    invariant(this.props.block.isTemplate() || !this.props.block.isConstruct(), 'Do not use InventoryItemBlock when you want to show components, use InventoryConstruct');
  }

  render() {
    const { block, defaultName, ...rest } = this.props;

    const isTemplate = block.isTemplate();
    const isFrozen = block.isFrozen();
    const isConstruct = block.isConstruct();
    const type = isTemplate ? 'template' : (isConstruct ? 'construct' : 'block'); //eslint-disable-line no-nested-ternary

    return (
      <div className="InventoryItemBlock">
        <InventoryItem {...rest}
          dataAttribute={`${type} ${block.id}`}
          inventoryType={blockDragType}
          defaultName={defaultName || block.getName()}
          svg={isFrozen ? 'lock' : null}
          svgProps={{width: '0.75em', height: '100%', fill: 'rgba(255,255,255,0.75)'}}
          item={block}
          itemDetail={isTemplate ? 'Template' : null}/>
      </div>
    );
  }
}
