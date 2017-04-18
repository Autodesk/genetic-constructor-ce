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
/**
 *
 * @param time
 * @returns {function} accepts promise
 * @example
 *
 * //waits for a fetch, for 1 second
 * await timeLimit(1000)(fetch(path))
 */
export default function timeLimit(time = 10000) {
  return (promise) => {
    return Promise.race([
      promise,
      new Promise((resolve, reject) => {
        setTimeout(() => reject(`timed out after ${time} ms`), time);
      }),
    ]);
  };
}
