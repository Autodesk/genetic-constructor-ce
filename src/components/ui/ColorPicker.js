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
import { getPalette } from '../../utils/color/index';
import PickerItem from './PickerItem';

import '../../styles/Picker.css';
import '../../styles/ColorPicker.css';

//todo - this has a lot of logic shared with Symbol Picker, but some differences in data structure etc. Should probably merge them though.

export default class ColorPicker extends Component {
  static propTypes = {
    readOnly: PropTypes.bool,
    current: PropTypes.number,
    onSelect: PropTypes.func,
    palette: PropTypes.string,
  };

  static defaultProps = {
    current: 0,
  };

  constructor(props) {
    super(props);
    this.palette = getPalette(props.palette);

    const paletteIndex = Number.isInteger(props.current) ? props.current : 0;
    this.state = {
      showContent: false,
      //hoverText: this.nameColor(this.props.current),
      hoverText: this.palette[paletteIndex].name,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.palette !== nextProps.palette) {
      this.palette = getPalette(nextProps.palette);
    }
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

  onMouseEnter = (str) => {
    //this.setState({ hoverText: this.nameColor(hoverText) });
    this.setState({ hoverText: str});
  };

  onMouseOut = () => {
    //this.setState({ hoverText: this.nameColor(this.props.current) });
    this.setState({ hoverText: this.getColor(this.props.current).name });
  };

  getColor(index = 0) {
    if (!Number.isInteger(index) || index < 0) {
      console.warn('current index is not an index'); //eslint-disable-line no-console
      return this.palette[0];
    }
    return this.palette[index];
  }

  render() {
    const { current, readOnly, onSelect } = this.props;

    return (
      <div className={'Picker ColorPicker' + (!!readOnly ? ' readOnly' : '')}>
        <div ref={ref => this.pickerToggler = ref}
             className="Picker-current"
             onClick={this.onClickCurrent}>
          <PickerItem isCurrent={false}
                      styles={{ backgroundColor: this.getColor(current).hex }}/>
        </div>
        {this.state.showContent && (
          <div className="Picker-content"
               onMouseOut={this.onMouseOut}>
            <div className="Picker-currentHovered">{this.state.hoverText}</div>
            <div className="Picker-options">
              {this.palette.map((obj, index) => {
                return (<PickerItem key={obj.hex}
                                    isCurrent={current === index}
                                    onMouseEnter={() => this.onMouseEnter(obj.name)}
                                    onClick={() => !readOnly && onSelect(index)}
                                    styles={{ backgroundColor: obj.hex }}/>);
              })}
            </div>
          </div>
        )}
      </div>
    );
  }
}
