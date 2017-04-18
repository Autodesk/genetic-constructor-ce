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
import ModalWindow from '../modal/modalwindow';
import Dropzone from 'react-dropzone';
import {
  uiShowPartsCSVImport,
  uiSpin,
} from '../../actions/ui';
import {
  blockStash,
  blockOptionsAdd,
} from '../../actions/blocks';
import Block from '../../models/Block';
import { importFile } from '../../middleware/csv';
import invariant from 'invariant';

import '../../../src/styles/partscsv.css';

/**
 * Genbank import dialog.
 */
class ImportPartsCSVModal extends Component {
  static propTypes = {
    open: PropTypes.bool.isRequired,
    uiShowPartsCSVImport: PropTypes.func.isRequired,
    uiSpin: PropTypes.func.isRequired,
    blockOptionsAdd: PropTypes.func.isRequired,
    blockStash: PropTypes.func.isRequired,
    listBlock: PropTypes.object,
  };

  constructor() {
    super();
    this.state = {
      files: [],
      error: null,
      processing: false,
      destination: 'new project', // or 'current project'
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.open && !this.props.open) {
      this.setState({
        files: [],
        error: null,
      });
    }
  }

  onDrop(files) {
    this.setState({ files });
  }

  onSubmit(evt) {
    evt.preventDefault();

    // validate the prefix
    const prefix = parseInt(this.refs.prefixInput.value, 10);
    const suffix = parseInt(this.refs.suffixInput.value, 10);

    if (!isFinite(prefix) || prefix < 0 || prefix >= 10000) {
      this.setState({
        error: 'Please enter a valid prefix between 0 and 10000.',
      });
      return;
    }

    if (!isFinite(suffix) || suffix < 0 || suffix >= 10000) {
      this.setState({
        error: 'Please enter a valid suffix between 0 and 10000.',
      });
      return;
    }

    // clear any previous error
    this.setState({
      error: null,
    });

    // continue if we have files
    if (this.state.files.length) {
      this.setState({
        processing: true,
      });
      this.props.uiSpin('Importing your parts... Please wait');
      const file = this.state.files[0];
      importFile('convert', file)
      .then(({ project, blocks }) => {
        const blockModels = Object.keys(blocks)
        .map(blockId => new Block(blocks[blockId]))
        .map(block => block.setSequenceTrim(prefix, suffix));
        this.props.blockStash(...blockModels);
        this.props.blockOptionsAdd(this.props.listBlock.id, ...blockModels.map(block => block.id));
        this.props.uiShowPartsCSVImport(false);
        this.setState({
          processing: false,
        });
        this.props.uiSpin();
      })
      .catch(reason => {
        this.setState({
          error: reason.statusText,
          processing: false,
        });
        this.props.uiSpin();
      });
    }
  }

  showFiles() {
    const files = this.state.files.map((file, index) => {
      return <div className="file-name" key={index}>{file.name}</div>;
    });
    return files;
  }

  render() {
    if (!this.props.open) {
      return null;
    }
    invariant(this.props.listBlock, 'expected a list block to be in the modal');

    return (
      <div>
        <ModalWindow
          open
          payload={(
            <form
              disabled={this.state.processing}
              onSubmit={this.onSubmit.bind(this)}
              id="genbank-import-form"
              className="gd-form genbank-import-form">
              <div className="title">Import Parts into List Block</div>
              <div>
                <div className="prefix-container">
                  <label>Prefix</label>
                  <input ref="prefixInput" type="number" defaultValue="0" min="0" max="10000"/>
                </div>
                <div className="prefix-container">
                  <label>Suffix</label>
                  <input ref="suffixInput" type="number" defaultValue="0" min="0" max="10000"/>
                </div>
              </div>
              <Dropzone
                onDrop={this.onDrop.bind(this)}
                className="dropzone"
                activeClassName="dropzone-hot"
                multiple={false}>
                <div className="dropzone-text">Drop Files Here</div>
              </Dropzone>
              {this.showFiles()}
              {this.state.error ? <div className="error visible">{this.state.error}</div> : null}
              <button type="submit" disabled={this.state.processing}>Upload</button>
              <button
                type="button"
                disabled={this.state.processing}
                onClick={() => {
                  this.props.uiShowPartsCSVImport(false);
                }}>Cancel
              </button>
              <div className="link">
                <span>Format documentation and sample .CSV files can be found
                    <a className="blue-link" href="https://geneticconstructor.readme.io/docs/csv-upload" target="_blank"> here</a>
                </span>
              </div>
            </form>
          )}
          closeOnClickOutside
          closeModal={buttonText => {
            this.props.uiShowPartsCSVImport(false);
          }}
        />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    open: state.ui.modals.showPartsCSVImport,
    listBlock: state.ui.modals.listBlock,
  };
}

export default connect(mapStateToProps, {
  uiShowPartsCSVImport,
  uiSpin,
  blockOptionsAdd,
  blockStash,
})(ImportPartsCSVModal);
