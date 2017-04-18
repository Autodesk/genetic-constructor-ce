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
import ReactDom from 'react-dom';

import '../styles/InputSimple.css';

export default class InputSimple extends Component {
  static propTypes = {
    value: PropTypes.string.isRequired,
    refKey: PropTypes.any, //can pass a key, if updating with each change, if key is different then will trigger blur/focus on component change
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    readOnly: PropTypes.bool,
    default: PropTypes.string,
    updateOnBlur: PropTypes.bool, //its probably best to not update on blur... see midupdate caveat below
    useTextarea: PropTypes.bool,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onEscape: PropTypes.func,
    maxLength: PropTypes.number,
  };

  static defaultProps = {
    onFocus: () => {},
    onBlur: () => {},
    onEscape: () => {},
    maxLength: 4096,
  };

  constructor(props) {
    super();

    //we need to maintain state internally so we do not need to update on all changes
    this.state = {
      value: props.value,
    };

    // annoyingly, props can update before document click listeners are registered
    // won't always trigger a blur event, e.g. if click outside and props change
    // want to make sure blur is always called even if click outside, so register our own listener
    // this likely will call the new function passed as onBlur, but for us for now, this is ok (ends transaction)
    // want to always ensure that blur function is called
    this.midupdate = null;
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.refKey !== this.props.refKey) {
      if (this.midupdate) {
        this.midupdate();
        this.midupdate = null;
      }
    }

    if (nextProps.value !== this.props.value) {
      this.setState({ value: nextProps.value });
    }
  }

  handleFocus = (event) => {
    this.props.onFocus(event);
  };

  handleBlur = (event) => {
    if (this.props.updateOnBlur) {
      this.handleSubmission(event.target.value);
    }
    this.props.onBlur(event);
  };

  handleKeyUp = (event) => {
    if (this.props.readOnly) {
      event.preventDefault();
      return;
    }
    //escape
    if (event.keyCode === 27) {
      this.props.onEscape(event);
      this.refs.input.blur();
      return;
    }
    //enter
    if (event.keyCode === 13 || !this.props.updateOnBlur) {
      this.handleSubmission(event.target.value);
    }
  };

  handleSubmission = (value) => {
    if (!this.props.readOnly) {
      this.props.onChange(value);
    }
  };

  handleChange = (event) => {
    this.setState({ value: event.target.value });

    if (!this.props.updateOnBlur) {
      this.handleSubmission(event.target.value);
    }

    if (!this.midupdate) {
      this.midupdate = () => {
        //todo - verify calling correct versions of these functions
        if (document.activeElement === ReactDom.findDOMNode(this.refs.input)) {
          this.props.onBlur();
          this.props.onFocus();
        }
      };
    }
  };

  render() {
    return (
      <div className={'InputSimple no-vertical-scroll' +
      (this.props.readOnly ? ' readOnly' : '')}>
        {(this.props.useTextarea) &&
        <textarea
          ref="input"
          rows="5"
          value={this.state.value}
          maxLength={this.props.maxLength}
          className="InputSimple-input"
          disabled={this.props.readOnly}
          placeholder={this.props.placeholder}
          onChange={this.handleChange}
          onBlur={this.handleBlur}
          onFocus={this.handleFocus}
          onKeyUp={this.handleKeyUp}/>
        }
        {(!this.props.useTextarea) &&
        <input
          size="30"
          ref="input"
          value={this.state.value}
          maxLength={this.props.maxLength}
          disabled={this.props.readOnly}
          className="InputSimple-input"
          placeholder={this.props.placeholder}
          onChange={this.handleChange}
          onBlur={this.handleBlur}
          onFocus={this.handleFocus}
          onKeyUp={this.handleKeyUp}/>
        }
      </div>
    );
  }
}
