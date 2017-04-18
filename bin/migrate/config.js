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
import path from 'path';

export const AUTH_API = process.env.API_END_POINT || "http://54.148.144.244:8080/api";
console.log('AUTH API:', AUTH_API);

export const storagePath = process.env.STORAGE || path.resolve(__dirname, '../../storage');
console.log('STORAGE PATH:', storagePath);

export const projectPath = path.resolve(storagePath, 'projects');
console.log('PROJECT PATH:', projectPath);
