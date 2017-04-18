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
import { blockMerge, blockSetListBlock, blockFreeze, blockSetHidden } from '../../actions/blocks';
import Checkbox from '../ui/Checkbox';

import '../../styles/TemplateRules.css';

export class TemplateRules extends Component {
  static propTypes = {
    block: PropTypes.object.isRequired,
    readOnly: PropTypes.bool.isRequired,
    isConstruct: PropTypes.bool.isRequired,
    blockMerge: PropTypes.func.isRequired,
    blockFreeze: PropTypes.func.isRequired,
    blockSetListBlock: PropTypes.func.isRequired,
    blockSetHidden: PropTypes.func.isRequired,
  };

  constructor() {
    super();
    this.rules = [
      ['hidden',
        'Hidden',
        (value) => this.props.blockSetHidden(this.props.block.id, value),
        () => this.props.isConstruct ],
      ['list',
        'List Block',
        (value) => this.props.blockSetListBlock(this.props.block.id, value),
        () => this.props.block.isConstruct()],
      /*
      ['frozen',
        'Frozen',
        (value) => this.props.blockFreeze(this.props.block.id, false)],
      */
    ];
  }

  render() {
    const { isConstruct, readOnly, block } = this.props;

    return (
      <div className="TemplateRules">
        {this.rules.map(([rule, name, func, hideIf = () => {}]) => {
          if (hideIf() === true) { return null; }
          return (
            <div className="TemplateRules-rule"
                 key={rule}>
              <Checkbox checked={block.rules[rule]}
                        disabled={readOnly || (rule === 'frozen' && isConstruct)}
                        onChange={(value) => {
                          if (!readOnly) {
                            func(value);
                          }
                        }}/>
              <span className="TemplateRules-name">{name}</span>
            </div>
          );
        })}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({});

export default connect(mapStateToProps, {
  blockMerge,
  blockFreeze,
  blockSetListBlock,
  blockSetHidden,
})(TemplateRules);
