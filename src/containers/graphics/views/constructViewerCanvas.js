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
import invariant from 'invariant';
import { connect } from 'react-redux';
import { projectAddConstruct } from '../../../actions/projects';
import {
  blockCreate,
  blockAddComponent,
  blockClone,
  blockRename,
} from '../../../actions/blocks';
import { uiSpin } from '../../../actions/ui';
import { focusConstruct, focusBlocks } from '../../../actions/focus';
import {
  projectGetVersion,
  projectGet,
} from '../../../selectors/projects';
import DnD from '../dnd/dnd';
import ConstructViewer from './constructviewer';
import MouseTrap from '../mousetrap';
import { block as blockDragType } from '../../../constants/DragTypes';

import '../../../styles/constructviewercanvas.css';

const defaultDropMessage = 'Drop blocks here to create a new construct.';
const droppingMessage = 'Building new construct...';

export class ConstructViewerCanvas extends Component {
  static propTypes = {
    uiSpin: PropTypes.func.isRequired,
    blockCreate: PropTypes.func.isRequired,
    blockClone: PropTypes.func.isRequired,
    blockRename: PropTypes.func.isRequired,
    projectAddConstruct: PropTypes.func.isRequired,
    focusConstruct: PropTypes.func.isRequired,
    focusBlocks: PropTypes.func.isRequired,
    projectGet: PropTypes.func.isRequired,
    children: PropTypes.array.isRequired,
    currentProjectId: PropTypes.string.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      dropMessage: defaultDropMessage,
    };
  }

  /**
   * register as drop target when mounted, use -1 for zorder to ensure
   * higher values ( constructviewers ) will get dropped on first
   */
  componentDidMount() {
    // monitor drag overs to autoscroll the canvas when the mouse is near top or bottom
    DnD.registerMonitor(ReactDOM.findDOMNode(this), {
      monitorOver: this.mouseScroll.bind(this),
      monitorEnter: () => {},
      monitorLeave: this.endMouseScroll.bind(this),
    });

    // drop target drag and drop handlers
    DnD.registerTarget(ReactDOM.findDOMNode(this.refs.dropTarget), {
      drop: this.onDrop.bind(this),
      dragEnter: () => {
        ReactDOM.findDOMNode(this.refs.dropTarget).classList.add('cvc-hovered');
      },
      dragLeave: () => {
        ReactDOM.findDOMNode(this.refs.dropTarget).classList.remove('cvc-hovered');
      },
      dragEnd: () => {
        this.setState({
          dropMessage: droppingMessage,
        });
      },
      zorder: -1,
    });

    // mouse trap is used for coordinate transformation
    this.mouseTrap = new MouseTrap({
      element: ReactDOM.findDOMNode(this),
    });
  }

  /**
   * scroll to top when a new construct viewer is added
   */
  componentWillReceiveProps(nextProps) {
    if (nextProps.children.length > this.props.children.length) {
      ReactDOM.findDOMNode(this).scrollTop = 0;
    }
  }

  /**
   * unregister DND handlers
   */
  componentWillUnmount() {
    DnD.unregisterTarget(ReactDOM.findDOMNode(this.refs.dropTarget));
    DnD.unregisterMonitor(ReactDOM.findDOMNode(this));
    this.mouseTrap.dispose();
    this.mouseTrap = null;
  }

  /**
   * create a new construct, add dropped block to it
   */
  onDrop(globalPosition, payload, event) {
    // clone construct and add to project if a construct from inventory otherwise
    // treat as a list of one or more blocks
    //if the block is from the inventory, we've cloned it and dont need to worry about forcing the projectId when we add the components
    const fromInventory = payload.source.indexOf('inventory') >= 0;
    //dont need to check if array, since inventory drags always are single items
    if (fromInventory && payload.type === blockDragType && payload.item.isConstruct()) {
      const construct = this.props.blockClone(payload.item.id);
      this.props.projectAddConstruct(this.props.currentProjectId, construct.id, true);
      this.props.focusConstruct(construct.id);
    } else {
      const construct = this.props.blockCreate();
      this.props.projectAddConstruct(this.props.currentProjectId, construct.id, true);
      const constructViewer = ConstructViewer.getViewerForConstruct(construct.id);
      invariant(constructViewer, 'expect to find a viewer for the new construct');
      constructViewer.addItemAtInsertionPoint(payload, null, null);
      this.props.focusConstruct(construct.id);
    }
  }

  /**
   * track clicks to unselect blocks
   */
  onMouseDown = (evt) => {
    this.down = evt.target === ReactDOM.findDOMNode(this) && evt.button === 0;
  };

  onMouseUp = (evt) => {
    if (this.down && evt.button === 0) {
      this.down = false;
      evt.preventDefault();
      evt.stopPropagation();
      this.props.focusBlocks([]);
    }
  };

  /**
   * true if current project is a sample project
   */
  isSampleProject() {
    return this.props.projectGet(this.props.currentProjectId).rules.frozen;
  }

  /**
   * end mouse scrolling
   */
  endMouseScroll() {
    this.autoScroll(0);
  }

  /**
   * auto scroll in the given direction -1, towards top, 0 stop, 1 downwards.
   */
  autoScroll(direction) {
    invariant(direction >= -1 && direction <= 1, 'bad direction -1 ... +1');
    this.autoScrollDirection = direction;

    // we need a bound version of this.autoScrollUpdate to use for animation callback to avoid
    // creating a closure at 60fps
    if (!this.autoScrollBound) {
      this.autoScrollBound = this.autoScrollUpdate.bind(this);
    }
    // cancel animation if direction is zero
    if (this.autoScrollDirection === 0) {
      if (this.autoScrollRequest) {
        window.cancelAnimationFrame(this.autoScrollRequest);
        this.autoScrollRequest = 0;
      }
    } else {
      // setup animation callback as required
      if (!this.autoScrollRequest) {
        this.autoScrollRequest = window.requestAnimationFrame(this.autoScrollBound);
      }
    }
  }

  autoScrollUpdate() {
    invariant(this.autoScrollDirection === -1 || this.autoScrollDirection === 1, 'bad direction for autoscroll');
    const el = ReactDOM.findDOMNode(this);
    el.scrollTop += this.autoScrollDirection * 8;
    // start a new request unless the direction has changed to zero
    this.autoScrollRequest = this.autoScrollDirection ? window.requestAnimationFrame(this.autoScrollBound) : 0;
  }

  /**
   * start, continue or stop autoscroll based on given global mouse position
   */
  mouseScroll(globalPosition) {
    const local = this.mouseTrap.globalToLocal(globalPosition, ReactDOM.findDOMNode(this));
    const box = this.mouseTrap.element.getBoundingClientRect();
    // autoscroll threshold is clamped at a percentage of height otherwise when the window is short
    // it can become impossible to target a specific element
    const edge = Math.max(0, Math.min(100, box.height * 0.25));
    if (local.y < edge) {
      this.autoScroll(-1);
    } else {
      if (local.y > box.height - edge) {
        this.autoScroll(1);
      } else {
        // cancel the autoscroll
        this.autoScroll(0);
      }
    }
  }

  /**
   * render the component, the scene graph will render later when componentDidUpdate is called
   */
  render() {
    // map construct viewers so we can pass down mouseScroll and endMouseScroll as properties
    const constructViewers = this.props.children.map(constructViewer => {
      return React.cloneElement(constructViewer, {
        mouseScroll: this.mouseScroll.bind(this),
        endMouseScroll: this.endMouseScroll.bind(this),
        currentProjectId: this.props.currentProjectId,
      });
    });

    // get class name for drop target which might hide it
    const dropClasses = `cvc-drop-target${this.isSampleProject() ? ' cvc-hidden' : ''}`;

    // map construct viewers so we can propagate projectId and any recently dropped blocks
    return (
      <div className="ProjectPage-constructs no-vertical-scroll" onMouseDown={this.onMouseDown}
           onMouseUp={this.onMouseUp}>
        <div className={dropClasses} ref="dropTarget" key="dropTarget">Drop blocks here to create a new construct.</div>
        ;
        {constructViewers}
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    projects: state.projects,
  };
}

export default connect(mapStateToProps, {
  uiSpin,
  focusConstruct,
  focusBlocks,
  projectAddConstruct,
  blockCreate,
  blockRename,
  blockAddComponent,
  projectGetVersion,
  projectGet,
  blockClone,
})(ConstructViewerCanvas);
