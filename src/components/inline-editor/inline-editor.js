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
import Box2D from '../../containers/graphics/geometry/box2d';

import '../../../src/styles/Modal.css';
import '../../../src/styles/inline-editor.css';

import {
  uiInlineEditor,
} from '../../actions/ui';

/**
 * modal window with user supplied payload and user defined ( optional )
 * buttons. The property this.props.closeModal is called when the modal is closed.
 * If the modal was closed via a button the button text is supplied.
 *
 */
class InlineEditor extends Component {
  static propTypes = {
    commit: PropTypes.func,
    value: PropTypes.string,
    position: PropTypes.object,
    extraClassName: PropTypes.string,
    target: PropTypes.object,
    uiInlineEditor: PropTypes.func,
  };

  componentDidMount() {
    window.addEventListener('resize', this.testTargetBounds);
    window.addEventListener('mousewheel', this.testTargetBounds);
  }

  componentWillReceiveProps(nextProps) {
    if (!this.props.commit && nextProps.commit) {
      // so we can focus after the first render
      this.doFocus = true;
      // get the current bounds of the target when opened, so we can determine if it changes
      this.openingBounds = new Box2D(nextProps.target.getBoundingClientRect());
    }
  }

  componentDidUpdate() {
    if (this.doFocus) {
      this.refs.input.focus();
      this.doFocus = false;
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.testTargetBounds);
    window.removeEventListener('mousewheel', this.testTargetBounds);
  }

  onCommit = () => {
    this.props.uiInlineEditor();
    this.props.commit(this.refs.input.value);
  };

  onCancel = () => {
    this.props.uiInlineEditor();
  };

  /**
   * enter key commits change, escape cancels
   */
  onKeyDown = (event) => {
    if (event.key === 'Enter') {
      this.onCommit();
    }
    if (event.key === 'Escape') {
      this.onCancel();
    }
  };

  onBlur = () => {
    this.onCommit();
  }

  /**
   * if our target element moves then cancel
   */
  testTargetBounds = () => {
    if (!this.props.commit || !this.props.target) {
      return;
    }
    if (!this.openingBounds.equals(new Box2D(this.props.target.getBoundingClientRect()))) {
      this.onCancel();
    }
  }

  /*
   * render the inline editor only when the commit callback is available
   */
  render() {
    if (!this.props.commit) {
      return null;
    }
    const styles = {
      left: this.props.position.left + 'px',
      top: this.props.position.top + 'px',
      width: this.props.position.width + 'px',
      height: this.props.position.height + 'px',
    };
    const classes = `inline-editor${this.props.extraClassName ? ' ' + this.props.extraClassName : ''}`;
    return (
      <div>
        <input
          style={styles}
          ref="input"
          defaultValue={this.props.value}
          className={classes}
          onKeyDown={this.onKeyDown}
          onBlur={this.onBlur}
          spellCheck={false}
        />
      </div>
    );
  }

}

function mapStateToProps(state, props) {
  return {
    commit: state.ui.modals.inlineEditorCommit,
    value: state.ui.modals.inlineEditorValue,
    position: state.ui.modals.inlineEditorPosition,
    extraClassName: state.ui.modals.inlineEditorClassName,
    target: state.ui.modals.inlineEditorTarget,
  };
}

export default connect(mapStateToProps, {
  uiInlineEditor,
})(InlineEditor);
