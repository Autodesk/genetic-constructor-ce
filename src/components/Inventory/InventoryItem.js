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
import DnD from '../../containers/graphics/dnd/dnd';
import MouseTrap from '../../containers/graphics/mousetrap';
import RoleSvg from '../RoleSvg';
import BasePairCount from '../ui/BasePairCount';
import {
  block as blockDragType,
  role as roleDragType,
} from '../../constants/DragTypes';

import {
  inspectorToggleVisibility,
  uiSetGrunt,
  uiSpin,
} from '../../actions/ui';
import { focusForceBlocks, focusRole } from '../../actions/focus';

import '../../styles/InventoryItem.css';

export class InventoryItem extends Component {
  static propTypes = {
    inventoryType: PropTypes.string.isRequired,
    item: PropTypes.shape({
      metadata: PropTypes.shape({
        name: PropTypes.string.isRequired,
        image: PropTypes.string,
      }).isRequired,
    }).isRequired,
    itemDetail: PropTypes.string, //gray text shown after
    proxyText: PropTypes.string,
    image: PropTypes.string, //takes precedence over svg
    svg: PropTypes.string, //right now, SBOL SVG ID
    svgProps: PropTypes.object,
    defaultName: PropTypes.string,
    dataAttribute: PropTypes.string,
    onDrop: PropTypes.func, //can return promise (e.g. update store), value is used for onDrop in DnD registered drop target. Can pass value from promise to use for drop as payload, or undefined
    onDropFailure: PropTypes.func,
    onDragStart: PropTypes.func, //transact
    onDragComplete: PropTypes.func, //commit
    onSelect: PropTypes.func, //e.g. when clicked
    forceBlocks: PropTypes.array.isRequired,
    focusBlocks: PropTypes.array.isRequired,
    inspectorToggleVisibility: PropTypes.func.isRequired,
    focusRole: PropTypes.func.isRequired,
    focusForceBlocks: PropTypes.func.isRequired,
    uiSetGrunt: PropTypes.func.isRequired,
    uiSpin: PropTypes.func.isRequired,
  };

  static defaultProps = {
    svgProps: {},
    dataAttribute: '',
  };

  state = {
    loading: false,
    loaded: null,
    loadError: false,
    skipFocus: false,
  };

  componentDidMount() {
    this.mouseTrap = new MouseTrap({
      element: this.itemElement,
      mouseDrag: this.mouseDrag.bind(this),
    });
  }

  mouseDrag(event, localPosition, startPosition, distance) {
    // cancel mouse drag and start a drag and drop
    this.mouseTrap.cancelDrag();
    // get global point as starting point for drag
    const globalPoint = this.mouseTrap.mouseToGlobal(event);

    if (this.state.loadError) {
      return;
    }

    //onDragStart handler
    if (this.props.onDragStart) {
      this.props.onDragStart(this.props.item);
    }

    // start DND
    DnD.startDrag(this.makeDnDProxy(), globalPoint, {
      item: this.props.item,
      type: this.props.inventoryType,
      source: 'inventory',
    }, {
      onDrop: (target, position) => {
        if (this.props.onDrop) {
          return this.props.onDrop(this.props.item, target, position);
        }
      },
      onDropFailure: (error, target) => {
        this.props.uiSetGrunt(`There was an error creating a block for ${this.props.item.metadata.name}`);
        this.props.uiSpin();
        if (this.props.onDropFailure) {
          return this.props.onDropFailure(error, target);
        }
      },
      onDragComplete: (target, position, payload) => {
        if (this.props.onDragComplete) {
          this.props.onDragComplete(payload.item, target, position);
        }
      },
    });
  }

  /**
   * make a drag and drop proxy for the item
   */
  makeDnDProxy() {
    const proxy = document.createElement('div');
    proxy.className = 'InventoryItemProxy';
    proxy.innerHTML = this.props.proxyText || this.props.item.metadata.name || this.props.defaultName;
    const svg = this.itemElement.querySelector('svg');
    if (svg) {
      const svgClone = svg.cloneNode(true);
      svgClone.removeAttribute('data-reactid');
      proxy.appendChild(svgClone);
    }
    return proxy;
  }

  handleClick = () => {
    const { item, onSelect, inventoryType, inspectorToggleVisibility, focusForceBlocks, focusRole } = this.props;

    this.setState({ skipFocus: false });

    if (this.state.loading) {
      return;
    }

    //may want to clear prior focus when loading starts, currently do not

    const promise = (!!onSelect && !this.state.loaded) ? onSelect(item) : Promise.resolve(this.state.loaded || item);

    //handler, so if click somewhere else, shouldnt focus selection on resolve
    const onClickHandler = (evt) => {
      if (!this.itemElement.contains(evt.target)) {
        this.setState({ skipFocus: true });
      }
      document.removeEventListener('click', onClickHandler);
    };

    //if onselect, has a promise, may take a while, show loading status
    if (onSelect) {
      this.setState({ loading: true });
      document.addEventListener('click', onClickHandler);
    }

    promise.then(result => {
      if (!this.state.skipFocus) {
        //todo - this shouldnt be responsibility of this generic component. move into specific components.
        if (inventoryType === blockDragType) {
          focusForceBlocks([result]);
        } else if (inventoryType === roleDragType) {
          focusRole(result.id);
        }
        inspectorToggleVisibility(true);
      }
      if (onSelect) {
        this.setState({ loadError: false, loaded: result });
      }
    })
      .catch(err => {
        console.log(err); //eslint-disable-line no-console
        if (onSelect) {
          this.setState({ loadError: true });
        }
      })
      .then(() => this.setState({ loading: false, skipFocus: false }));
  };

  render() {
    const { item, itemDetail, image, svg, svgProps, defaultName, inventoryType, dataAttribute, forceBlocks, focusBlocks } = this.props;
    const { loading, loadError, skipFocus } = this.state;
    const isSelected = forceBlocks.some(block => item.id === block.id) || focusBlocks.some(focusId => item.id === focusId);

    const hasSequence = item.sequence && item.sequence.length > 0;
    const itemName = item.metadata.name || defaultName || 'Unnamed';
    const dataAttr = !!dataAttribute ? dataAttribute : `${inventoryType} ${item.id}`;

    return (
      <div className={'InventoryItem' +
      ((!!image || !!svg) ? ' hasImage' : '') +
      ((!!loading && !skipFocus) ? ' loading' : '') +
      ((!!loadError) ? ' loadError' : '') +
      (!!isSelected ? ' selected' : '')}
           ref={(el) => this.itemElement = el}
           data-inventory={dataAttr}>
        <a className="InventoryItem-item"
           onClick={this.handleClick}>
          {image && (<span className="InventoryItem-image" style={{ backgroundImage: `url(${image})` }}/>)}
          {(svg && !image) ? <RoleSvg symbolName={svg} color="white" {...svgProps} styles={{}}/> : null}
          <span className="InventoryItem-text" title={loadError ? 'Error Loading Item' : itemName}>
            {itemName}
          </span>
          {itemDetail && <span className="InventoryItem-detail">{itemDetail}</span>}
          {(!itemDetail && hasSequence) &&
          <span className="InventoryItem-detail"><BasePairCount count={item.sequence.length}/></span>}
        </a>
      </div>
    );
  }
}

export default connect((state) => {
  return {
    focusBlocks: state.focus.blockIds,
    forceBlocks: state.focus.forceBlocks,
  };
}, {
  focusForceBlocks,
  focusRole,
  inspectorToggleVisibility,
  uiSetGrunt,
  uiSpin,
})(InventoryItem);
