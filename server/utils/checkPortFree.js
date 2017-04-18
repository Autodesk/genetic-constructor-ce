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

import net from 'net';
import { HOST_PORT, HOST_NAME } from '../urlConstants';

export default function checkPortFree(port = HOST_PORT, host = HOST_NAME) {
  return new Promise((resolve, reject) => {
    const tester = net.createServer()
      .once('error', (err) => {
        if (err.code !== 'EADDRINUSE') {
          return reject(false);
        }
        reject(err);
      })
      .once('listening', () => {
        tester.once('close', () => {
          resolve(true);
        }).close();
      })
      .listen({
        port,
        host,
        exclusive: true,
      });
  })
    .catch(() => { throw new Error(`Port ${port} on ${host} already in use!`); });
}
