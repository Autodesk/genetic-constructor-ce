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
import { connect } from 'react-redux';
import SceneGraph2D from '../../containers/graphics/scenegraph2d/scenegraph2d';
import Layout from '../../containers/graphics/views/layout';
import { orderGenerateConstructs } from '../../actions/orders';
import invariant from 'invariant';
import UpDown from './updown';
import Block from '../../models/Block';

import '../../../src/styles/ordermodal.css';
import '../../../src/styles/SceneGraphPage.css';

class ConstructPreview extends Component {
  static propTypes = {
    blocks: PropTypes.object.isRequired,
    order: PropTypes.object.isRequired,
    orderGenerateConstructs: PropTypes.func.isRequired,
  };

  constructor(props) {
    super();
    this.generateConstructs(props);
  }

  state = {
    index: 1,
  };

  /**
   * construct scene graph and layout once mounted
   *
   */
  componentDidMount() {
    // create the scene graph we are going to use to display the construct
    this.sg = new SceneGraph2D({
      width: this.dom.clientWidth,
      height: this.dom.clientHeight,
      availableWidth: this.dom.clientWidth,
      availableHeight: this.dom.clientHeight,
      parent: this.sceneGraphEl,
    });
    // create the layout object
    this.layout = new Layout(this, this.sg, {
      showHeader: false,
      insetX: 10,
      insetY: 10,
      baseColor: 'lightgray',
    });

    //trigger a render because we've set components, and can't do it in the constructor
    this.forceUpdate();
  }

  componentWillUpdate(nextProps, nextState) {
    //if the props changed... valid so long as state is only the page
    if (this.state === nextState) {
      this.generateConstructs(nextProps);
    }
  }

  componentDidUpdate() {
    if (this.constructs.length) {
      this.containerEl.scrollTop = 0;
      invariant(this.props.order.constructIds.length === 1, 'expect exactly 1 construct per order');
      const parentConstruct = this.props.blocks[this.props.order.constructIds[0]];
      const construct = this.constructs[this.state.index - 1];
      const constructIndex = this.state.index;
      const componentIds = construct;
      this.layout.update({
        construct: new Block({
          metadata: {
            color: parentConstruct.metadata.color || 'lightgray',
          },
          components: componentIds,
          rules: {
            fixed: false,
          },
        }),
        blocks: this.props.blocks,
        currentBlocks: [],
        currentConstructId: constructIndex,
        blockColor: (blockId) => {
          return this.blockColor(blockId);
        },
      });
      this.sg.update();
    }
  }

  /**
   * when the value is changed in the up down
   */
  onChangeConstruct = (index) => {
    this.setState({ index });
  };

  get dom() {
    return ReactDOM.findDOMNode(this);
  }

  get sceneGraphEl() {
    return this.dom.querySelector('.scenegraph');
  }

  get containerEl() {
    return this.dom.querySelector('.container');
  }

  /**
   * gets called with the id of an option. Return the color for the owning block
   */
  blockColor(optionId) {
    this.optionColorHash = this.optionColorHash || {};
    const hashedColor = this.optionColorHash[optionId];
    if (hashedColor) {
      return hashedColor;
    }
    const parentConstruct = this.props.blocks[this.props.order.constructIds[0]];
    const blockIndex = parentConstruct.components.findIndex((blockId, index) => {
      const block = this.props.blocks[blockId];
      const optionIds = Object.keys(block.options);
      return optionIds.indexOf(optionId) >= 0;
    });
    if (blockIndex >= 0) {
      // we have the index of the parent block
      this.optionColorHash[optionId] = this.props.blocks[parentConstruct.components[blockIndex]].getColor();
      return this.optionColorHash[optionId];
    }
    return 'lightgray';
  }

  generateConstructs(props = this.props) {
    this.constructs = props.orderGenerateConstructs(props.order.id);
  }

  render() {
    const label = `of ${this.constructs ? this.constructs.length : 1} combinations`;
    return (
      <div className="preview">
        <div className="top-row">
          <label className="review">Reviewing assembly</label>
          <UpDown
            min={1}
            max={this.constructs ? this.constructs.length : 1}
            value={this.state.index}
            enabled={!!(this.constructs && this.constructs.length)}
            onChange={this.onChangeConstruct}
          />
          <label className="of">{label}</label>
        </div>
        <div className="container">
          <div className="scenegraph"></div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    blocks: state.blocks,
  };
}

export default connect(mapStateToProps, {
  orderGenerateConstructs,
})(ConstructPreview);
