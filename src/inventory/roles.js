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

//todo - should break this into constants and host in /constants/ - this isn't really inventory specific

/**
 * Genetic Constructor includes a set of roles, inspired by SBOL visual, but extended to include types which accommodate the hierarchical nature of constructs.
 * @name roles
 * @memberOf module:Constants
 */

export const symbolMap = {
  //include null for string matching, but the value will be the object null in blocks, not the string 'null'
  'null': 'No Symbol',
  promoter: 'Promoter',
  cds: 'CDS',
  terminator: 'Terminator',
  operator: 'Operator',
  insulator: 'Insulator',
  originReplication: 'Origin of Replication',
  rbs: 'RBS',
  protease: 'Protease',
  ribonuclease: 'Ribonuclease',
  proteinStability: 'Protein Stability',
  rnaStability: 'RNA stability',
  restrictionSite: 'Restriction Site',
  structural: 'Structural',
};

export const roleMassager = {
  'gene': 'cds',
  'ribosome entry site': 'rbs',
  'ribonuclease site': 'ribonuclease',
  'rna stability element': 'rnaStability',
  'protease site': 'protease',
  'protein stability element': 'proteinStability',
  'origin of replication': 'originReplication',
  'restriction site': 'restrictionSite',
  'regulatory': 'promoter',
  'mat_peptide': 'cds',
  'rep_origin': 'originReplication',
};

/*
 proposed roles:
 restrictionEnzyme (this is in SBOL)
 structural
   connector
 regulatory
 tag
   reporter
   marker
   selection
 */


const symbols = Object.keys(symbolMap).map(key => ({
  id: key,
  name: symbolMap[key],
}));

export default symbols;
