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
import symbols, { symbolMap } from '../../inventory/roles';
import PickerItem from './PickerItem';

import '../../styles/Picker.css';
import '../../styles/SymbolPicker.css';

export default class SymbolPicker extends Component {
  static propTypes = {
    readOnly: PropTypes.bool,
    current: PropTypes.any,
    onSelect: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = {
      showContent: false,
      hoverText: this.makeHoverText(props.current),
    };
  }

  onClickCurrent = () => {
    const handleDocumentClick = (evt) => {
      this.setState({ showContent: false });
      document.removeEventListener('click', handleDocumentClick);
    };
    if (this.state.showContent || this.props.readOnly) return; //dont register more than once

    document.addEventListener('click', handleDocumentClick);
    this.setState({ showContent: true });
  };

  onMouseEnter = (hoverText) => {
    this.setState({ hoverText });
  };

  onMouseOut = () => {
    this.setState({ hoverText: this.makeHoverText(this.props.current) });
  };

  onClick = (id) => {
    const { readOnly, onSelect } = this.props;
    const next = id === 'null' ? null : id;

    if (!readOnly) {
      onSelect(next);
    }
  };

  makeHoverText(symbolId) {
    return symbolMap[symbolId] || symbolId || 'No Symbol';
  }

  render() {
    const { current, readOnly } = this.props;
    const noSymbol = 'emptyBlock';
    const currentSymbol = current || ((current === false) ? null : noSymbol);

    return (
      <div className={'Picker SymbolPicker' + (!!readOnly ? ' readOnly' : '')}>
        <div className="Picker-current"
             onClick={this.onClickCurrent}>
          <PickerItem isCurrent={false}
                      svg={currentSymbol}/>
        </div>
        {this.state.showContent && (
          <div className="Picker-content"
               onMouseOut={this.onMouseOut}>
            <div className="Picker-currentHovered">{this.state.hoverText}</div>
            <div className="Picker-options">
              {symbols.map(symbolObj => {
                const { id, name } = symbolObj;

                return (<PickerItem key={id}
                                    isCurrent={current === id}
                                    name={name}
                                    svg={id}
                                    onMouseEnter={() => this.onMouseEnter(name)}
                                    onMouseOut={(evt) => evt.stopPropagation()}
                                    onClick={() => this.onClick(id)}
                />);
              })}
            </div>
          </div>
        )}
      </div>
    );
  }
}
