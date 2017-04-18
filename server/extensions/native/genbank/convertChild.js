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
const cp = require('child_process');

process.on('message', (message) => {
  //whether we are importing or exporting
  const conversion = message.type === 'import' ? 'from_genbank' : 'to_genbank';

  const command = `python convert.py ${conversion} ${message.input} ${message.output}`;

  cp.exec(command, function runPython(err, stdout) {
    if (err) {
      console.log('Python childProcess error: ' + command);
      console.log(err);
      console.log(err.stack);
      return process.send({ id: message.id, success: false, error: err, result: stdout });
    }

    process.send({ id: message.id, success: true, result: stdout });
  });
});
