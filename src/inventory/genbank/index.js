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
 Genbank refers to files that we have parsed on our server, and source files are expected to have been saved on our server as well.
 This is (not yet) a search mechanism - NCBI is probably what youre looking for to search for genbank files
 */

import { extensionApiPath } from '../../middleware/utils/paths';

export const name = 'Genbank';

export const sourceUrl = ({ url, id }) => {
  if (!id && !url) {
    return null;
  }
  return url || extensionApiPath('genbank', `file/${id}`);
};
