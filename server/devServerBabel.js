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
/*
alternative to babel-node, we can use node directly and require babel this way, and it patches node so that it will essentially support our ES6 syntax.

Prefer this method to babel-node, as babel-node creates a new child process to handle execution. That child (which for us starts the server) does not get killed immediately / properly so the port remains in use, and subsequently trying to start the server errors.
*/

require('babel-core/register');
require('./server');
