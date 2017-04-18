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
//fetch only supports absolute paths
//include a check for tests, hardcode for now
export const serverRoot = (global.location && (/http/gi).test(global.location.protocol)) ?
  `${global.location.protocol}//${global.location.host}/` :
  'http://localhost:3000/';

export const serverPath = (path) => serverRoot + path;
export const registerPath = () => serverRoot + 'register';
export const authPath = (path) => serverRoot + 'auth/' + path;
export const dataApiPath = (path) => serverRoot + 'data/' + path;
export const orderApiPath = (path) => serverRoot + 'order/' + path;
export const extensionsPath = (id) => serverRoot + 'extensions/' + id;
export const reportApiPath = (path) => serverRoot + 'report/' + path;
export const extensionApiPath = (extension, path) => serverRoot + `extensions/api/${extension}/${path}`;
export const projectFilePath = (projectId, namespace, fileName, version) => dataApiPath(`file/${projectId}/${namespace}${!!fileName ? ('/' + fileName) : ''}${!!version ? ('/' + version) : ''}`);
export const jobPath = (projectId, namespace, fileName) => dataApiPath(`jobs/${projectId}/${namespace}${!!fileName ? ('/' + fileName) : ''}`);
