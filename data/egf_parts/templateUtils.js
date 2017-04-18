import invariant from 'invariant';
import Block from '../../src/models/Block';
import _, { merge } from 'lodash';

//note that technically, these keys are strings, and passing a number will cast to a string as the key
export const templateSymbols = {
  1: 'structural',
  2: 'insulator',
  3: 'promoter',
  4: 'rnaStability',
  5: 'regulatory',
  6: 'cds',
  7: 'cds',
  8: 'structural',
  '8a': 'structural',
  '8b': 'structural',
  9: 'cds',
  10: 'regulatory',
  11: 'terminator',
  12: 'insulator',
  13: 'restrictionEnzyme',
  14: 'promoter',
  15: 'cds',
  16: 'terminator',
  17: 'restrictionEnzyme',
  18: 'promoter',
  19: 'cds',
  20: 'structural',
  21: 'cds',
  22: 'terminator',
  23: 'insulator',
  24: 'structural',
  25: 'originReplication',
};

const termIsPartPos = term => Number.isInteger(term) || term === '8a' || term === '8b';
const stringIsConnector = (string) => (/^[a-zA-Z](-[a-zA-Z]{1,2})?( BsaI\-.)?$/gi).test(string);

// create list block with parts
//can pass specific optionId to enable only that list option
export const list = (dict, pos, optionId) => {
  const options = dict.parts[`${pos}`];

  const optionMap = options.reduce((acc, part, index) => Object.assign(acc, {
    [part.id]: (optionId ? optionId === part.id : true),
  }), {});

  const listBlock = new Block({
    metadata: {
      name: `Position ${pos}`,
    },
    rules: {
      role: templateSymbols[pos], //role as metadata, since constructs shouldn't have a role
      list: true,
    },
    options: optionMap,
    notes: {
      Position: pos,
    },
  }, false);

  return listBlock;
};

// create block which is connector
// string with numbers for positions
// letters for name ('A-C')
export const conn = (dict, term) => {
  const isPos = !isNaN(parseInt(term[0], 10));
  const key = isPos ? `${term}` : `conn ${term}`.toUpperCase();
  return dict.connectors[key];
};

//specific part by name or shortname
//frozen, can clone it yourself if you want to
export const part = (dict, term) => {
  return dict.parts[term];
};

//pass numbers for parts, strings as '#' or '#-#' for connectors (or e.g. 'A-B BsaI-X', see regex above), otherwise a part name
//may pass single part, or an array (in which case, first block is construct / list, and subsequence are options / children
export const makeComponents = (dict, ...terms) => {
  invariant(dict.parts && dict.connectors, 'must pass dict');

  return terms
    .map(term => termIsPartPos(term) ? //eslint-disable-line no-nested-ternary
      list(dict, term) :
      stringIsConnector(term) ?
        conn(dict, term) :
        part(dict, term));
};

//pass in actual list of compoennts
//mark it frozen to save a mapping call later...
//note - does not make a real block. Does not have an ID. need to wrap these appropriately.
export const templateFromComponents = (components, toMerge = {}) => {
  //invariant(components.every(comp => Block.validate(comp)), 'must pass valid blocks');

  return new Block(merge({},
    toMerge,
    {
      components: components.map(comp => comp.id),
      rules: {
        fixed: true,
        frozen: true,
      },
    },
  ), false);
};
