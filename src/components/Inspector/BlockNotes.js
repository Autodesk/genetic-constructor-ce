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
import React, { PropTypes } from 'react';

import '../../styles/BlockNotes.css';

export default function BlockNotes({ notes }) {
  return (
    <div className="BlockNotes">
      {Object.keys(notes).map(key => {
        const value = notes[key];
        if (!value) {
          return null;
        }
        return (
          <div className="BlockNotes-group"
               key={key}>
            <div className="BlockNotes-group-title">{key}</div>
            <div className="BlockNotes-group-value">{value}</div>
          </div>
        );
      })}
    </div>
  );
}

BlockNotes.propTypes = {
  notes: PropTypes.object.isRequired,
};
