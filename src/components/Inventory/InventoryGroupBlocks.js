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
import React, { Component } from 'react';
import BlockSchema from '../../schemas/Block';
import * as validators from '../../schemas/fields/validators';
import { escapeRegExp } from 'lodash';

import InventorySearch from './InventorySearch';
import InventoryItemBlock from './InventoryItemBlock';

export default class InventoryGroupBlocks extends Component {
  static propTypes = {
    items: ({ items }) => validators.arrayOf(item => BlockSchema.validate(item, true))(items) || null,
  };

  state = {
    searchTerm: '',
  };

  handleSearchChange = (searchTerm) => {
    this.setState({ searchTerm });
  };

  render() {
    const { items } = this.props;
    const { searchTerm } = this.state;

    //in the future, we will want smarter searching
    const searchRegex = new RegExp(escapeRegExp(searchTerm), 'gi');
    const listingItems = items.filter(item => searchRegex.test(item.metadata.name) || searchRegex.test(item.rules.role));

    return (
      <div className="InventoryGroup-content InventoryGroupBlocks">
        <InventorySearch searchTerm={searchTerm}
                         placeholder="Filter by name or biological function"
                         onSearchChange={this.handleSearchChange}/>

        <div className="InventoryGroup-contentInner no-vertical-scroll">
          {listingItems.map(item => {
            return (<InventoryItemBlock key={item.id}
                                        block={item}/>);
          })}
        </div>
      </div>
    );
  }
}

