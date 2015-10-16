import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';

export class AboutPage extends Component {
  constructor (props) {
    super(props);

    setInterval(() => {
      this.setState({
        counter: this.state.counter + 1000
      });
    }, 1000);
  }

  state = {
    counter: +Date.now()
  }

  static propTypes = {}

  render () {
    return (
      <div>
        <h1>We're cool! This is our About Page</h1>
        <p>{(new Date(this.state.counter)).toLocaleString()}</p>
      </div>
    );
  }
}

export default connect()(AboutPage);
