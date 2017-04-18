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
import { uiToggleDetailView, detailViewSelectExtension } from '../actions/ui';
import { focusDetailsExist } from '../selectors/focus';
import { extensionsByRegion, getExtensionName, onRegister } from '../extensions/clientRegistry';
import { throttle } from 'lodash';

import ExtensionView from './ExtensionView';

import '../styles/ProjectDetail.css';

const projectDetailExtensionRegion = 'projectDetail';

export class ProjectDetail extends Component {
  static propTypes = {
    uiToggleDetailView: PropTypes.func.isRequired,
    detailViewSelectExtension: PropTypes.func.isRequired,
    focusDetailsExist: PropTypes.func.isRequired,
    isVisible: PropTypes.bool.isRequired,
    currentExtension: PropTypes.any, //todo - allow null or key
    project: PropTypes.object.isRequired,
  };

  constructor() {
    super();
    this.extensions = [];
  }

  state = {
    //default open height
    openHeight: 400,
  };

  componentDidMount() {
    //listen to get relevant manifests here.
    //run on first time (key === null) in case registry is already populated.
    this.extensionsListener = onRegister((registry, key, regions) => {
      if (key === null || regions.indexOf(projectDetailExtensionRegion) >= 0) {
        this.extensions = extensionsByRegion(projectDetailExtensionRegion);
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.extensionsListener();
  }

  openExtension = (key) => {
    if (!key || key === this.props.currentExtension) {
      return;
    }

    if (!this.props.isVisible) {
      this.toggle(true);
    }

    this.props.detailViewSelectExtension(key);
  };

  /** resize things (todo - make a component that handles this) **/

  throttledDispatchResize = throttle(() => window.dispatchEvent(new Event('resize')), 50);

  handleResizableMouseDown = evt => {
    evt.preventDefault();
    this.refs.resizeHandle.classList.add('dragging');
    document.addEventListener('mousemove', this.handleResizeMouseMove);
    document.addEventListener('mouseup', this.handleResizeMouseUp);
    this.dragStart = evt.pageY;
    //cringe-worthy query selector voodoo
    //leave at least 200 px in the design canvas
    this.dragMax = document.querySelector('.ProjectPage-content').getBoundingClientRect().height - 200;
    this.openStart = this.state.openHeight;
  };

  handleResizeMouseMove = evt => {
    evt.preventDefault();
    const delta = this.dragStart - evt.pageY;
    const minHeight = 200;
    const nextHeight = Math.min(this.dragMax, Math.max(minHeight, this.openStart + delta));
    this.setState({ openHeight: nextHeight });
    this.throttledDispatchResize();
  };

  handleResizeMouseUp = evt => {
    evt.preventDefault();
    this.refs.resizeHandle.classList.remove('dragging');
    this.dragStart = null;
    this.openStart = null;
    document.removeEventListener('mousemove', this.handleResizeMouseMove);
    document.removeEventListener('mouseup', this.handleResizeMouseUp);
    window.dispatchEvent(new Event('resize'));
  };

  /** end resize things **/

  handleClickToggle = evt => {
    if (this.props.isVisible) {
      return this.toggle(false);
    }

    this.toggle(true);
    this.openExtension(this.extensions[0]);
  };

  toggle = (forceVal) => {
    this.props.uiToggleDetailView(forceVal);
  };

  render() {
    const { isVisible, currentExtension } = this.props;

    if (!this.extensions.length) {
      return null;
    }

    return (
      <div className={'ProjectDetail' + (isVisible ? ' visible' : '')}
           style={{ height: (isVisible ? `${this.state.openHeight}px` : null) }}>
        {(isVisible) && (<div ref="resizeHandle"
                              className="ProjectDetail-resizeHandle"
                              onMouseDown={this.handleResizableMouseDown}></div>)}
        <div className="ProjectDetail-heading">
          {!isVisible && (<a ref="open"
                             className={'ProjectDetail-heading-toggle' + (isVisible ? ' visible' : '')}
                             onClick={this.handleClickToggle}/>)}
          <div className={'ProjectDetail-heading-extensionList' + (isVisible ? ' visible' : '')}>
            {this.extensions.map(key => {
              const name = getExtensionName(key);
              return (
                <a key={key}
                   className={'ProjectDetail-heading-extension' + (key === currentExtension ? ' active' : '')}
                   onClick={() => this.openExtension(key)}>{name}</a>
              );
            })}
          </div>
          {isVisible && (<a ref="close"
                            className={'ProjectDetail-heading-close'}
                            onClick={() => this.toggle(false)}/>)}
        </div>
        {currentExtension && (<ExtensionView region={projectDetailExtensionRegion}
                                             isVisible={isVisible}
                                             extension={currentExtension}/>) }
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  const { isVisible, currentExtension } = state.ui.detailView;
  //const { constructId, forceBlocks, blockIds } = state.focus; //to force rendering (check for if details exist) on focus change
  return {
    isVisible,
    currentExtension,
    //blockIds,
    //constructId,
    //forceBlocks,
  };
};

export default connect(mapStateToProps, {
  uiToggleDetailView,
  detailViewSelectExtension,
  focusDetailsExist,
})(ProjectDetail);
