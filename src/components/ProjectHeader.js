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
import ReactDOM from 'react-dom';
import {connect } from 'react-redux';
import {
  inspectorToggleVisibility,
  uiInlineEditor,
} from '../actions/ui';
import { focusPrioritize } from '../actions/focus';
import { projectRename } from '../actions/projects';
import Box2D from '../containers/graphics/geometry/box2d';

import '../styles/ProjectHeader.css';
import '../styles/inline-editor.css';

class ProjectHeader extends Component {
  static propTypes = {
    project: PropTypes.object.isRequired,
    isFocused: PropTypes.bool.isRequired,
    inspectorToggleVisibility: PropTypes.func.isRequired,
    uiInlineEditor: PropTypes.func.isRequired,
    focusPrioritize: PropTypes.func.isRequired,
    projectRename: PropTypes.func.isRequired,
  };

  state = {
    hover: false,
  };


  onClick = () => {
    this.props.inspectorToggleVisibility(true);
    this.props.focusPrioritize('project');
    const name = this.props.project.metadata.name || 'Untitled Project';
    if (!this.props.project.rules.frozen) {
      this.props.uiInlineEditor(value => {
        this.props.projectRename(this.props.project.id, value);
      }, name, this.titleEditorBounds(), 'inline-editor-project', ReactDOM.findDOMNode(this));
    }
  };

  onMouseEnter = () => {
    this.setState({hover: true});
  }

  onMouseLeave = () => {
    this.setState({hover: false});
  }

  titleEditorBounds() {
    return new Box2D(ReactDOM.findDOMNode(this.refs.title).getBoundingClientRect()).inflate(0, 4);
  }

  render() {
    const { project, isFocused } = this.props;
    const hover = this.state.hover && !this.props.project.rules.frozen
      ? <div className="inline-editor-hover inline-editor-hover-project">
          <span>{project.metadata.name || 'Untitled Project'}</span>
          <img src="/images/ui/inline_edit.svg"/>
        </div>
      : null;
    return (
      <div className={'ProjectHeader' + (isFocused ? ' focused' : '')}
           onClick={this.onClick}
           onMouseEnter={this.onMouseEnter}
           onMouseLeave={this.onMouseLeave}
      >
        <div className="ProjectHeader-info">
          <div ref="title" className="ProjectHeader-title">{project.metadata.name || 'Untitled Project'}</div>
          <div className="ProjectHeader-description">{project.metadata.description}</div>
        </div>

        <div className="ProjectHeader-actions"></div>
        {hover}
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    isFocused: state.focus.level === 'project' && !state.focus.forceProject,
  };
}

export default connect(mapStateToProps, {
  inspectorToggleVisibility,
  focusPrioritize,
  uiInlineEditor,
  projectRename,
})(ProjectHeader);
