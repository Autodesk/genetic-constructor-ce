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
import {
  inventorySearch,
  inventorySearchPaginate,
  inventoryShowSourcesToggling,
  inventorySetSources,
  inventoryToggleSource,
  inventoryToggleSourceVisible,
} from '../../actions/inventory';
import { blockStash } from '../../actions/blocks';

import { registry } from '../../inventory/registry';

import InventorySources from './InventorySources';
import InventorySearch from './InventorySearch';
import InventorySearchResults from './InventorySearchResults';

export class InventoryGroupSearch extends Component {
  static propTypes = {
    searchTerm: PropTypes.string.isRequired,
    sourcesToggling: PropTypes.bool.isRequired,
    searching: PropTypes.bool.isRequired,
    sourceList: PropTypes.array.isRequired,
    sourcesVisible: PropTypes.object.isRequired,
    searchResults: PropTypes.object.isRequired,
    inventorySearch: PropTypes.func.isRequired,
    inventorySearchPaginate: PropTypes.func.isRequired,
    inventoryShowSourcesToggling: PropTypes.func.isRequired,
    inventorySetSources: PropTypes.func.isRequired,
    inventoryToggleSource: PropTypes.func.isRequired,
    inventoryToggleSourceVisible: PropTypes.func.isRequired,
    blockStash: PropTypes.func.isRequired,
  };

  onSourceToggle = (source) => {
    this.props.inventoryToggleSource(source);
    this.props.inventoryShowSourcesToggling(false);
  };

  handleSearchChange = (searchTerm) => {
    const { inventorySearch } = this.props;
    inventorySearch(searchTerm);
  };

  handleLoadMore = (source) => {
    this.props.inventorySearchPaginate(source);
  };

  render() {
    const { searchTerm, sourcesToggling, searching, sourceList, searchResults, sourcesVisible, inventoryShowSourcesToggling } = this.props;

    return (
      <div className={'InventoryGroup-content InventoryGroupSearch'}>
        <InventorySearch searchTerm={searchTerm}
                         isSearching={searching}
                         disabled={sourcesToggling}
                         onSearchChange={(value) => this.handleSearchChange(value)}/>

        <InventorySources registry={registry}
                          sourceList={sourceList}
                          toggling={sourcesToggling}
                          onToggleVisible={(nextState) => inventoryShowSourcesToggling(nextState)}
                          onSourceToggle={(source) => this.onSourceToggle(source)}/>

        {!sourcesToggling && (
          <InventorySearchResults searchTerm={searchTerm}
                                  sourcesToggling={sourcesToggling}
                                  sourcesVisible={sourcesVisible}
                                  searching={searching}
                                  searchResults={searchResults}
                                  blockStash={this.props.blockStash}
                                  loadMore={(source) => this.handleLoadMore(source)}
                                  inventoryToggleSourceVisible={this.props.inventoryToggleSourceVisible}/>
        )}
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  return state.inventory;
}

export default connect(mapStateToProps, {
  inventorySearch,
  inventorySearchPaginate,
  inventoryShowSourcesToggling,
  inventorySetSources,
  inventoryToggleSource,
  inventoryToggleSourceVisible,
  blockStash,
})(InventoryGroupSearch);
