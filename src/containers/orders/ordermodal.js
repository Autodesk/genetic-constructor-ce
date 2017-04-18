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
import {
  uiShowOrderForm,
  uiSpin,
} from '../../actions/ui';
import {
  orderSubmit,
  orderDetach,
} from '../../actions/orders';
import { projectSave } from '../../actions/projects';
import ModalWindow from '../../components/modal/modalwindow';
import Page1 from './page1';
import Page2 from './page2';
import Page3 from './page3';
import NavLeftRight from './nav-left-right';

import '../../../src/styles/form.css';
import '../../../src/styles/ordermodal.css';

class OrderModal extends Component {
  static propTypes = {
    uiShowOrderForm: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    projectId: PropTypes.string.isRequired,
    uiSpin: PropTypes.func.isRequired,
    projectSave: PropTypes.func.isRequired,
    orderDetach: PropTypes.func.isRequired,
    orderSubmit: PropTypes.func.isRequired,
    order: PropTypes.object,
  };

  state = {
    page: 1,
    error: null,
  };

  componentWillReceiveProps(nextProps) {
    // page 1 on opening and create order
    if (!this.props.open && nextProps.open) {
      this.setState({
        page: nextProps.order.isSubmitted() ? 3 : 1,
      });
    }
  }

  onSubmit = (evt) => {
    evt.preventDefault();
    if (this.props.order.isSubmitted()) {
      this.props.uiShowOrderForm(false);
      return;
    }

    // currently we allow a max of 10K combinations
    const count = this.props.order.parameters.onePot
      ? this.props.order.numberCombinations
      : this.props.order.parameters.permutations;

    if (count > 10000) {
      this.setState({ error: 'The maximum number of assemblies is 10,000' });
      return;
    }

    this.setState({ error: null });
    this.props.uiSpin('Submitting order... Please wait.');
    this.props.projectSave(this.props.order.projectId)
      .then(() => this.props.orderSubmit(this.props.order.id))
      .then(() => {
        this.props.uiSpin();
        this.setState({ page: 3 });
      })
      .catch((response) => {
        this.props.uiSpin();
        this.setState({ error: response.statusText || 'Unknown' });
      });
  };

  onClose = (evt) => {
    this.props.uiShowOrderForm(false);
    this.setState({ error: null });
    if (!this.props.order.isSubmitted()) {
      this.props.orderDetach(this.props.order.id);
    }
  };

  nav(inc) {
    let page = this.state.page + inc;
    if (page < 1) page = 3;
    if (page > 3) page = 1;
    this.setState({ page });
  }

  modalButtons() {
    if (!this.props.order.isSubmitted()) {
      return (
        <div className="buttons">
          <button
            disabled={!this.props.order.metadata.name}
            type="submit">Submit Order
          </button>
          <button
            type="button"
            onClick={() => this.onClose()}>Cancel
          </button>
        </div>
      );
    }

    return (
      <div className="buttons">
        <button type="submit">Done</button>
      </div>
    );
  }

  render() {
    // no render when not open
    if (!this.props.open) {
      return null;
    }
    const leftText = ['', 'Change Settings', 'Review Assemblies'][this.state.page - 1];
    const rightText = ['Review Assemblies', 'Order Details', ''][this.state.page - 1];
    const titleText = ['Order DNA', 'Review Assemblies', 'Order Details'][this.state.page - 1];

    const error = this.state.error ?
      <label className="error">{'Order Error: ' + this.state.error.substr(0, 1024)}</label> : null;

    return (<ModalWindow
      open={this.props.open}
      title="Order DNA"
      closeOnClickOutside
      closeModal={() => this.onClose()}
      payload={
        <form className="gd-form order-form" onSubmit={this.onSubmit}>
          <div className="title">{titleText}</div>
          <div>
            <Page1 open={this.state.page === 1} order={this.props.order}/>
            <Page2 open={this.state.page === 2} order={this.props.order}/>
            <Page3 open={this.state.page === 3} order={this.props.order}/>
          </div>
          {error}
          <div className="actions">
            <NavLeftRight
              onClick={this.nav.bind(this, -1)}
              left
              text={leftText}
              visible={this.state.page > 1}/>
            {this.modalButtons()}
            <NavLeftRight
              onClick={this.nav.bind(this, 1)}
              left={false}
              text={rightText}
              visible={this.state.page < 3 && !(this.state.page === 2 && !this.props.order.isSubmitted())}/>
          </div>
        </form>}

    />);
  }
}

function mapStateToProps(state, props) {
  return {
    open: state.ui.modals.showOrderForm,
    project: state.projects[props.projectId],
    order: state.orders[state.ui.modals.orderId],
  };
}

export default connect(mapStateToProps, {
  uiShowOrderForm,
  uiSpin,
  projectSave,
  orderSubmit,
  orderDetach,
})(OrderModal);
