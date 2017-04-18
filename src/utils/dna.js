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
const makeRegexp = (string) => {
  return new RegExp(`^[${string}]*$`, 'gi');
};

//use functions which return a new regex so that .test() and .exec() which use lastIndex should not have effect on multiple calls

// bases for dna ( strict )
export const dnaStrict = 'acgtu';
export const dnaStrictRegexp = () => makeRegexp(dnaStrict);

// bases for dna loose including special chars ( regex format )
export const dnaLoose = 'acgturyswkmbdhvn\\.\\-';
export const dnaLooseRegexp = () => makeRegexp(dnaLoose);
