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
import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import autosaveInstance from '../../store/autosave/autosaveInstance';
import { getProjectSaveState } from '../../store/saveState';
import { uiSaveFailure } from '../../actions/ui';

import '../../styles/AutosaveTracking.css';

export class autosaveTracking extends Component {
  static propTypes = {
    projectId: PropTypes.string.isRequired,
    uiSaveFailure: PropTypes.func.isRequired,
  };

  state = {
    text: '',
  };

  componentDidMount() {
    this.interval = setInterval(() => {
      this.forceUpdate();
    }, 500);
  }

  componentDidUpdate() {
    const { projectId, uiSaveFailure } = this.props;
    const saveState = getProjectSaveState(projectId);
    const { saveSuccessful, lastErrOffline } = saveState;

    //there was an error saving, they are in a bad state
    if (!saveSuccessful && !lastErrOffline) {
      uiSaveFailure();
      clearInterval(this.interval);
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    const { projectId } = this.props;
    const saveState = getProjectSaveState(projectId);
    const { updated, saveDelta, saveSuccessful } = saveState;
    const dirty = autosaveInstance.isDirty();

    let text;
    if (!saveSuccessful) {
      text = `Last Saved: ${(new Date(updated)).toLocaleTimeString()}`;
    } else if (dirty || saveDelta > 15000) {
      text = '';
    } else if (saveDelta <= 500) {
      //we're not actually saving... we're just faking it...
      text = 'Saving...';
    } else {
      text = 'Project Saved';
    }

    return (<span className="AutosaveTracking">{text}</span>);
  }
}

export default connect(() => ({}), {
  uiSaveFailure,
})(autosaveTracking);
