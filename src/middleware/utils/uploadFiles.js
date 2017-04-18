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
import rejectingFetch from './rejectingFetch';
import invariant from 'invariant';
import { isFile } from './fileReader';

export default function uploadFiles(url, headers = {}, ...files) {
  invariant(url && typeof url === 'string', 'first arg is url');
  invariant(typeof headers === 'object' && !headers.name, 'must pass headers object');
  invariant(files.every(file => isFile(file)), 'must only pass files');

  const formData = new FormData();
  files.forEach(file => formData.append('data', file, file.name));

  //define these here so content type not automatically applied so webkit can define its own boundry
  const fullHeaders = Object.assign({
    method: 'POST',
    credentials: 'same-origin',
    body: formData,
  }, headers);

  return rejectingFetch(url, fullHeaders);
}
