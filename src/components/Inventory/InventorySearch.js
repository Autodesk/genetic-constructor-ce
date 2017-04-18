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

import '../../styles/InventorySearch.css';

export default class InventorySearch extends Component {
  static propTypes = {
    searchTerm: PropTypes.string.isRequired,
    onSearchChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    isSearching: PropTypes.bool,
    disabled: PropTypes.bool,
  };

  handleSearchChange = (event) => {
    this.props.onSearchChange(event.target.value);
  };

  render() {
    return (
      <div className={'InventorySearch' + (this.props.isSearching ? ' searching' : '')}>
        <input className="InventorySearch-input"
               type="text"
               disabled={!!this.props.disabled ? true : null}
               value={this.props.searchTerm}
               maxLength={100}
               placeholder={this.props.placeholder || 'Keyword, biological function'}
               onChange={this.handleSearchChange} />
        <div className="InventorySearch-progress"></div>
      </div>
    );
  }
}
