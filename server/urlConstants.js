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
export const HOST_PORT = process.env.PORT || 3000;
export const HOST_NAME = '0.0.0.0';

//e.g. to call the server from itself
export const INTERNAL_HOST = 'http://' + HOST_NAME + ':' + HOST_PORT;

//external URL, locally same as INTERNAL_HOST
export const HOST_URL = process.env.HOST_URL || INTERNAL_HOST;

//platform API (e.g. auth), default for running locally
export const API_END_POINT = process.env.API_END_POINT || 'http://localhost:8080/api';

//storage API - mounted locally for local dev, otherwise external
export const STORAGE_URL = process.env.STORAGE_API || (INTERNAL_HOST + '/api');
