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
import { uiShowDNAImport } from '../../actions/ui';
import { blockGetSequence, blockSetSequence } from '../../actions/blocks';
import { focusBlocks } from '../../actions/focus';
import { uiSetGrunt } from '../../actions/ui';
import ModalWindow from '../modal/modalwindow';
import { blockCreate, blockAddComponent } from '../../actions/blocks';
import { dnaLoose, dnaLooseRegexp } from '../../utils/dna';

import '../../../src/styles/form.css';
import '../../../src/styles/importdnaform.css';

class DNAImportForm extends Component {

  static propTypes = {
    uiShowDNAImport: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    blockSetSequence: PropTypes.func.isRequired,
    blockCreate: PropTypes.func.isRequired,
    blockAddComponent: PropTypes.func.isRequired,
    uiSetGrunt: PropTypes.func.isRequired,
    focusedBlocks: PropTypes.array.isRequired,
    focusBlocks: PropTypes.func.isRequired,
    blockGetSequence: PropTypes.func.isRequired,
    blocks: PropTypes.object.isRequired,
    currentConstruct: PropTypes.object,
  };

  constructor() {
    super();
    this.state = {
      inputValid: true,
      validLength: 0,
      // we don't want to render until we have the sequence
      haveSequence: false,
    };
  }

  componentWillReceiveProps(nextProps) {
    // we need a focused block that is not frozen or locked to operate on.
    if (!this.props.open && nextProps.open) {
      if (nextProps.focusedBlocks.length !== 1) {
        this.props.uiShowDNAImport(false);
        this.props.uiSetGrunt(`Sequence data must be added to a selected block. Please select a single block and try again.`);
        return;
      }
      const ncc = nextProps.currentConstruct;
      const authoring = ncc.isTemplate() && ncc.isAuthoring();
      if (ncc.isFrozen() || (!authoring && (ncc.isFixed() || ncc.isTemplate()))) {
        this.props.uiShowDNAImport(false);
        this.props.uiSetGrunt(`You cannot add sequence to a template block.`);
        return;
      }
      const block = this.props.blocks[this.props.focusedBlocks[0]];
      if (block.isList()) {
        this.props.uiShowDNAImport(false);
        this.props.uiSetGrunt(`You cannot add sequence to a list block.`);
        return;
      }
      if (block.components.length) {
        this.props.uiShowDNAImport(false);
        this.props.uiSetGrunt(`You cannot add sequence to a block with child components.`);
        return;
      }
      // can edit the sequence of blocks that were previously manually edited or have no source
      if (!(block.source.source === '' || block.source.source === 'user')) {
        this.props.uiShowDNAImport(false);
        this.props.uiSetGrunt(`You cannot add sequence to a block obtained from ${block.source.source}`);
        return;
      }
      block.getSequence()
        .then(sequence => {
          if (this.refs.sequenceTextArea) {
            this.refs.sequenceTextArea.value = sequence || '';
          }
          this.setState({
            inputValid: true,
            validLength: sequence ? sequence.length : 0,
            sequence: sequence || '',
            haveSequence: true,
          });
        })
        .catch(() => {
          this.props.uiShowDNAImport(false);
          this.props.uiSetGrunt(`There was a problem fetching that blocks sequence.`);
          return;
        });
    }
  }

  onSequenceChanged(evt) {
    const source = evt.target.value;
    if (source) {
      // strip anything except atgc and whitespace
      const cleanRegex = new RegExp(`[^${dnaLoose}]`, 'gmi');
      const clean = source.replace(cleanRegex, '');
      if (clean !== source) {
        evt.target.value = clean;
      }
      // check for valid sequence
      // ( you should not be able to enter an invalid sequence but just in case )
      const dnaRegex = dnaLooseRegexp();
      const isValid = dnaRegex.test(clean);
      this.setState({
        inputValid: isValid,
        validLength: clean.length,
        sequence: clean,
      });
    } else {
      this.setState({
        inputValid: true,
        validLength: 0,
        sequence: null,
      });
    }
  }

  onSubmit(evt) {
    evt.preventDefault();
    // be sure we have a valid sequence before continuing
    if (this.state.inputValid
      && this.state.validLength
      && this.state.sequence
      && this.state.validLength === this.state.sequence.length) {
      this.setSequenceAndClose(this.props.focusedBlocks[0], this.state.sequence);
    }
  }

  setSequenceAndClose(blockId, sequence) {
    this.props.blockSetSequence(blockId, sequence)
      .then(block => {
        // close the dialog, focus the block we inserted into and message the user.
        this.props.uiShowDNAImport(false);
        this.props.focusBlocks([blockId]);
        this.props.uiSetGrunt(`Sequence was successfully inserted.`);
      })
      .catch(reason => {
        // show the error dialog
        this.props.uiShowDNAImport(false);
        this.props.uiSetGrunt(`There was a problem inserting that DNA: ${reason.toString()}`);
      });
  }

  render() {
    // no render when not open
    if (!this.props.open || !this.state.haveSequence) {
      return null;
    }

    return (<ModalWindow
      open={this.props.open}
      title="Add Sequence"
      closeOnClickOutside
      closeModal={(buttonText) => {
        this.props.uiShowDNAImport(false);
      }}
      payload={
          <form className="gd-form importdnaform" onSubmit={this.onSubmit.bind(this)}>
            <div className="title">Add Sequence</div>
            <textarea
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  this.onSubmit(event);
                }
              }}
              placeholder="Type or paste DNA sequence data here."
              rows="10"
              autoComplete="off"
              autoFocus
              maxLength="10000000"
              spellCheck="false"
              ref="sequenceTextArea"
              defaultValue={this.state.sequence}
              onChange={this.onSequenceChanged.bind(this)}/>
            <label style={{textAlign: 'right'}}>{`Length: ${this.state.validLength}`}</label>
            <div className={`error ${!this.state.inputValid ? 'visible' : ''}`}>The sequence is not valid</div>
            <div style={{width: '75%', textAlign: 'center'}}>
              <button type="submit" disabled={!(this.state.inputValid && this.state.validLength)}>Add</button>
              <button
                type="button"
                onClick={() => {
                  this.props.uiShowDNAImport(false);
                }}>Cancel
              </button>
            </div>
          </form>}

    />);
  }
}

function mapStateToProps(state) {
  return {
    open: state.ui.modals.showDNAImport,
    focusedBlocks: state.focus.blockIds,
    currentConstruct: state.blocks[state.focus.constructId],
    blocks: state.blocks,
  };
}

export default connect(mapStateToProps, {
  uiShowDNAImport,
  blockGetSequence,
  blockSetSequence,
  uiSetGrunt,
  blockCreate,
  blockAddComponent,
  focusBlocks,
})(DNAImportForm);
