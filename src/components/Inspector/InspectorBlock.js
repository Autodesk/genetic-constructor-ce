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
import Block from '../../models/Block';
import { transact, commit, abort } from '../../store/undo/actions';
import { blockMerge, blockSetColor, blockSetRole, blockRename } from '../../actions/blocks';
import { uiShowOrderForm } from '../../actions/ui';
import InputSimple from './../InputSimple';
import ColorPicker from './../ui/ColorPicker';
import SymbolPicker from './../ui/SymbolPicker';
import BlockSource from './BlockSource';
import ListOptions from './ListOptions';
import TemplateRules from './TemplateRules';
import OrderList from './OrderList';
import InspectorRow from './InspectorRow';
import BlockNotes from './BlockNotes';

export class InspectorBlock extends Component {
  static propTypes = {
    readOnly: PropTypes.bool.isRequired,
    instances: PropTypes.arrayOf((propValue, key) => {
      const instance = propValue[key];
      if (!(Block.validate(instance) && instance instanceof Block)) {
        return new Error('Must pass valid instances of blocks to the inspector, got ' + JSON.stringify(instance));
      }
    }).isRequired,
    project: PropTypes.object.isRequired,
    construct: PropTypes.object.isRequired, //top-level
    isAuthoring: PropTypes.bool.isRequired,
    overrides: PropTypes.shape({
      color: PropTypes.string,
      role: PropTypes.string,
    }).isRequired,
    orders: PropTypes.array.isRequired,
    blockSetColor: PropTypes.func.isRequired,
    blockSetRole: PropTypes.func.isRequired,
    blockMerge: PropTypes.func.isRequired,
    blockRename: PropTypes.func.isRequired,
    transact: PropTypes.func.isRequired,
    commit: PropTypes.func.isRequired,
    abort: PropTypes.func.isRequired,
    uiShowOrderForm: PropTypes.func.isRequired,
    forceIsConstruct: PropTypes.bool,
  };

  static defaultProps = {
    forceIsConstruct: false,
  };

  setBlockName = (name) => {
    this.props.instances.forEach((block) => {
      this.props.blockRename(block.id, name);
    });
  };

  setBlockDescription = (description) => {
    this.props.instances.forEach((block) => {
      this.props.blockMerge(block.id, { metadata: { description } });
    });
  };

  selectColor = (color) => {
    this.startTransaction();
    this.props.instances.forEach((block) => {
      this.props.blockSetColor(block.id, color);
    });
    this.endTransaction();
  };

  selectSymbol = (symbol) => {
    this.startTransaction();
    this.props.instances.forEach((block) => {
      this.props.blockSetRole(block.id, symbol);
    });
    this.endTransaction();
  };

  startTransaction = () => {
    this.props.transact();
  };

  endTransaction = (shouldAbort = false) => {
    if (shouldAbort === true) {
      this.props.abort();
      return;
    }
    this.props.commit();
  };

  handleOpenOrder = (orderId) => {
    this.props.uiShowOrderForm(true, orderId);
  };

  /**
   * color of selected instance or null if multiple blocks selected
   */
  currentColor() {
    const { instances, overrides } = this.props;
    if (!!overrides.color) {
      return overrides.color;
    }
    if (instances.length === 1) {
      return instances[0].metadata.color;
    }
    return null;
  }

  /**
   * role symbol of selected instance or null if multiple blocks selected
   */
  currentRoleSymbol() {
    const { instances, overrides } = this.props;
    if (!!overrides.role) {
      return overrides.role;
    }
    if (instances.length === 1) {
      return instances[0].getRole(false);
    }
    //false is specially handled in symbol picker as blank, and is different than null (no symbol)
    return false;
  }

  /**
   * current name of instance or null if multi-select
   */
  currentName(useGetName = true) {
    if (this.props.instances.length === 1) {
      const defaultName = this.props.forceIsConstruct ? 'New Construct' : null;
      return useGetName ? this.props.instances[0].getName(defaultName) : this.props.instances[0].metadata.name;
    }
    return '';
  }

  /**
   * current name of instance or null if multi-select
   */
  currentDescription() {
    if (this.props.instances.length === 1) {
      return this.props.instances[0].metadata.description || '';
    }
    return '';
  }

  allBlocksWithSequence() {
    return this.props.instances.every(instance => !!instance.sequence.length);
  }

  currentSequenceLength() {
    if (this.allBlocksWithSequence()) {
      const reduced = this.props.instances.reduce((acc, instance) => acc + (instance.sequence.length || 0), 0);
      return reduced + ' bp';
    }
    return this.props.instances.length > 1 ?
      'Incomplete Sketch' :
      'No Sequence';
  }

  currentAnnotations() {
    if (this.props.instances.length > 1) {
      return [];
    } else if (this.props.instances.length === 1) {
      return this.props.instances[0].sequence.annotations;
    }
    return [];
  }

  currentSource() {
    const lenInstances = this.props.instances.length;
    const firstBlock = this.props.instances[0];
    const firstSource = firstBlock.source;
    const { id: firstId, source: firstName } = firstSource;
    const firstHasSource = !!firstName;

    if (firstHasSource && (lenInstances === 1 ||
      this.props.instances.every(block => block.source.id === firstId && block.source.source === firstName))) {
      return (<BlockSource block={firstBlock}/>);
    }
    if (lenInstances > 1) {
      return (<p>Multiple Sources</p>);
    }
    return null;
  }

  render() {
    const { instances, construct, orders, readOnly, forceIsConstruct, isAuthoring } = this.props;
    const singleInstance = instances.length === 1;
    const isList = singleInstance && instances[0].isList();
    const isTemplate = singleInstance && instances[0].isTemplate();
    const isConstruct = singleInstance && instances[0].isConstruct();
    const inputKey = instances.map(inst => inst.id).join(',');
    const anyIsConstructOrTemplateOrList = instances.some(instance => instance.isConstruct() || instance.isTemplate() || instance.isList());
    const palette = construct ? construct.metadata.palette : null;

    const defaultType = forceIsConstruct ? 'Construct' : 'Block';
    const type = singleInstance ? instances[0].getType(defaultType) : 'Blocks';

    const currentSourceElement = this.currentSource();
    const annotations = this.currentAnnotations();

    const hasSequence = this.allBlocksWithSequence();
    const hasNotes = singleInstance && Object.keys(instances[0].notes).length > 0;

    const relevantOrders = orders.filter(order => singleInstance && order.constructIds.indexOf(instances[0].id) >= 0);

    return (
      <div className="InspectorContent InspectorContentBlock">

        <InspectorRow heading={type}>
          <InputSimple refKey={inputKey}
                       placeholder={this.currentName(true) || 'Enter a name'}
                       readOnly={readOnly}
                       onChange={this.setBlockName}
                       onFocus={this.startTransaction}
                       onBlur={this.endTransaction}
                       onEscape={() => this.endTransaction(true)}
                       maxLength={64}
                       value={this.currentName(false)}/>
        </InspectorRow>

        <InspectorRow heading="Description">
          <InputSimple refKey={inputKey + 'desc'}
                       placeholder="Enter a description"
                       useTextarea
                       readOnly={readOnly}
                       onChange={this.setBlockDescription}
                       onFocus={this.startTransaction}
                       onBlur={this.endTransaction}
                       onEscape={() => this.endTransaction(true)}
                       maxLength={1024}
                       value={this.currentDescription()}/>
        </InspectorRow>

        <InspectorRow heading="Source"
                      condition={!!currentSourceElement}>
          {currentSourceElement}
        </InspectorRow>

        <InspectorRow heading="Sequence Length"
                      condition={hasSequence}>
          <p><strong>{this.currentSequenceLength()}</strong></p>
        </InspectorRow>

        {/* todo - this should have its own component */}
        <InspectorRow heading={ type + ' Metadata'}
                      hasToggle
                      condition={hasNotes}>
          <div className="InspectorContent-section">
            <BlockNotes notes={instances[0].notes}/>
          </div>
        </InspectorRow>

        <InspectorRow heading="Order History"
                      hasToggle
                      condition={relevantOrders.length > 0}>
          <div className="InspectorContent-section">
            <OrderList orders={relevantOrders}
                       onClick={(orderId) => this.handleOpenOrder(orderId)}/>
          </div>
        </InspectorRow>

        <InspectorRow heading="Color & Symbol">
          <div className="InspectorContent-pickerWrap">
            <ColorPicker current={this.currentColor()}
                         readOnly={readOnly}
                         palette={palette}
                         onSelect={this.selectColor}/>

            <SymbolPicker current={this.currentRoleSymbol()}
                          readOnly={readOnly || (!isAuthoring && (isConstruct || isTemplate || isList || forceIsConstruct || anyIsConstructOrTemplateOrList)) }
                          onSelect={this.selectSymbol}/>
          </div>
        </InspectorRow>

        <InspectorRow heading={type + ' Rules'}
                      condition={isAuthoring}>
          <TemplateRules block={instances[0]}
                         readOnly={!isAuthoring}
                         isConstruct={isTemplate}/>
        </InspectorRow>

        <InspectorRow heading="Annotations"
                      condition={annotations.length > 0}>
          <div className="InspectorContentBlock-Annotations">
            {annotations.map((annotation, idx) => {
              return (
                <span className="InspectorContentBlock-Annotation"
                      key={idx}>
                {annotation.name || annotation.description || '?'}
              </span>
              );
            })}
          </div>
        </InspectorRow>

        <InspectorRow heading="List Options"
                      condition={isList}>
          <ListOptions toggleOnly={!isAuthoring}
                       block={instances[0]}/>
        </InspectorRow>

      </div>
    );
  }
}

export default connect(() => ({}), {
  blockSetColor,
  blockSetRole,
  blockRename,
  blockMerge,
  transact,
  commit,
  abort,
  uiShowOrderForm,
})(InspectorBlock);
