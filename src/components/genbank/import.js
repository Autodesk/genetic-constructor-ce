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
  uiShowGenBankImport,
  uiSpin,
} from '../../actions/ui';
import { projectGet, projectListAllBlocks } from '../../selectors/projects';
import { projectSave, projectList, projectLoad, projectOpen } from '../../actions/projects';
import { importFile as importGenbankFile } from '../../middleware/genbank';
import { importFile as importCsvFile } from '../../middleware/csv';

import '../../../src/styles/genbank.css';

/**
 * Genbank import dialog.
 */
class ImportGenBankModal extends Component {

  static propTypes = {
    projectOpen: PropTypes.func.isRequired,
    currentProjectId: PropTypes.string.isRequired,
    open: PropTypes.bool.isRequired,
    uiShowGenBankImport: PropTypes.func.isRequired,
    uiSpin: PropTypes.func.isRequired,
    projectLoad: PropTypes.func.isRequired,
    projectSave: PropTypes.func.isRequired,
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
    this.setState({
      error: null,
    });

    if (this.state.files.length) {
      this.setState({
        processing: true,
      });
      this.props.uiSpin('Importing your file... Please wait');
      const projectId = this.state.destination === 'current project' ? this.props.currentProjectId : '';

      const file = this.state.files[0];
      const isCSV = file.name.toLowerCase().endsWith('.csv');
      const importer = isCSV ? importCsvFile : importGenbankFile;

      //if saving into current project, save the current project first (and force the save) so its on the server
      const savePromise = !!projectId ?
        this.props.projectSave(this.props.currentProjectId, true) :
        Promise.resolve();

      savePromise
        .then(() => importer(projectId, file))
        .then(projectId => {
          this.props.uiSpin();
          if (projectId === this.props.currentProjectId) {
            //true to forcibly reload the project, avoid our cache
            this.props.projectLoad(projectId, true);
          } else {
            this.props.projectOpen(projectId);
          }
          this.setState({
            processing: false,
          });
          this.props.uiShowGenBankImport(false);
        })
        .catch(error => {
          this.props.uiSpin();
          this.setState({
            error: `Error uploading file: ${error}`,
            processing: false,
          });
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
    return (
      <div>
        <ModalWindow
          open
          title="Import GenBank File"
          payload={(
            <form
              disabled={this.state.processing}
              onSubmit={this.onSubmit.bind(this)}
              id="genbank-import-form"
              className="gd-form genbank-import-form">
              <div className="title">Import</div>
              <div className="radio">
                <div>Import data to:</div>
                <input
                  checked={this.state.destination === 'new project'}
                  type="radio"
                  name="destination"
                  disabled={this.state.processing}
                  onChange={() => this.setState({destination: 'new project'})}
                  />
                <div>New Project</div>
              </div>
              <div className="radio">
                <div/>
                <input
                  checked={this.state.destination === 'current project'}
                  type="radio"
                  name="destination"
                  disabled={this.state.processing}
                  onChange={() => this.setState({destination: 'current project'})}
                  />
                <div>Current Project</div>
              </div>
              <Dropzone
                onDrop={this.onDrop.bind(this)}
                className="dropzone"
                activeClassName="dropzone-hot"
                multiple={false}>
                <div className="dropzone-text">Drop File Here</div>
              </Dropzone>
              {this.showFiles()}
              {this.state.error ? <div className="error visible">{this.state.error}</div> : null}
              <button type="submit" disabled={this.state.processing}>Upload</button>
              <button
                type="button"
                disabled={this.state.processing}
                onClick={() => {
                  this.props.uiShowGenBankImport(false);
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
            this.props.uiShowGenBankImport(false);
          }}
        />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    open: state.ui.modals.showGenBankImport,
  };
}

export default connect(mapStateToProps, {
  uiShowGenBankImport,
  uiSpin,
  projectSave,
  projectGet,
  projectListAllBlocks,
  projectList,
  projectLoad,
  projectOpen,
})(ImportGenBankModal);
