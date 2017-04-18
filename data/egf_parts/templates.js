import { makeComponents, templateFromComponents } from './templateUtils';
import _ from 'lodash';
import Block from '../../src/models/Block';
import connectorList from './connectorList.json';
import partList from './partList.json';

export default function makeTemplates() {
  const created = [];

  //make all the parts and connectors which are shared within the project, but unique to this project
  const parts = _.map(partList, part => new Block(part, false));
  const connectors = _.map(connectorList, conn => new Block(conn, false));

  created.push(...parts, ...connectors);

  //create dict for easier lookups
  const partDict = _.groupBy(parts, 'metadata.egfPosition');
  _.forEach(parts, (part) => {
    Object.assign(partDict, { [part.metadata.name.toLowerCase()]: part });
    Object.assign(partDict, { [part.metadata.shortName.toLowerCase()]: part });
  });

  const connDict = _.reduce(connectors, (acc, conn) => {
    return Object.assign(acc, {
      [conn.metadata.egfPosition]: conn,
      [conn.metadata.name.toUpperCase()]: conn,
    });
  }, {});

  const dict = {
    parts: partDict,
    connectors: connDict,
  };

  //track the components we make, wrap makeComponents
  const make = (...terms) => {
    const components = makeComponents(dict, ...terms);
    created.push(...components);
    return components;
  };

  const components1A = make('a-c', 3, 'd-f', 6, 7, 'h-k', 11, 'l-y', 25);
  const components1B = make('a-c', 3, 'd-f', 6, 7, 'h-k', 11, 'l-y', 'y-z');
  const components2A = make('a-c', 3, 'd-f', 6, 7, 8, 9, 'j-k', 11, 'l-y', 25);
  const components2B = make('a-c', 3, 'd-f', 6, 7, 8, 9, 'j-k', 11, 'l-y', 'y-z');
//3 is basically 2, just different preferred part in #6 - gets example though
//4 is basically 2, just different preferred part in #8 - gets example though
//const components4 = make('a-c', 3, 'd-f', 6, 7, 'p2A', 9, 'j-k', 11, 'l-y', 25);
  const components5 = make('a-c', 3, 'd-f', 6, 7, '8a', '8b', 9, 'j-k', 11, 'l-y', 25);
  const components6A = make('a-c', 3, 'd-f', 6, 7, 8, 9, 'j-k', 11, 'l-r', 18, 19, 20, 21, 22, 'w-y', 25);
  const components6B = make(1, 2, 3, 'd-f', 6, 7, 'h-k', 11, 'l-r', 18, 19, 20, 21, 22, 23, 24, 'y-z');
  const components7 = make(1, 2, 3, 'd-f', 6, 7, 'h-k', 11, 'l-n', 14, 15, 16, 'q-r', 18, 19, 20, 't-v', 22, 23, 24, 'y-z');
  const components8 = make(1, 2, 3, 'd-f', 6, 7, 8, 9, 'j-k', 11, 'l-n', 14, 15, 16, 'q-r', 18, 19, 20, 21, 22, 23, 24, 'y-z');
  const components9 = make(1, 2, 3, 'd-e', 5, 6, 7, 8, 9, 'h-k', 11, 'l-w', 23, 24, 'y-z');
//const components10 = make('a-e', 5, 6, 7, 'h-ha', '8b', 9, 'j-k', 11, 'l-r', 18, 19, 20, 'u-v', 22, 'w-z'); //connector A-E is missing
  const components11A = make('a-b BsaI-X', 'b-c', 3, 'd-e', 5, 6, 7, 'h-k', 11, 'l-y', 'y-z BsaI-Y');
  const components11B = make('a-b BsaI-1', 'b-c', 3, 'd-f', 6, 7, 'h-ha', '8b', 9, 'j-k', 11, 'l-r', 18, 19, 20, 21, 22, 'w-y', 'y-z BsaI-Y');
//12 is the same as 1A, just different preferred parts in #6
  const components13A = make(1, 2, 3, 'd-f', 6, 7, 8, 9, 10, 11, 'l-n', 14, 15, 16, 'q-w', 23, 24, 'y-z');
  const components13B = make(1, 2, 3, 'd-f', 6, 7, 'h-ha', '8b', 9, 10, 11, 'l-n', 14, 15, 16, 'q-w', 23, 24, 'y-z');

//export the templates
  const templates = [
    templateFromComponents(
      components1A,
      {
        metadata: {
          name: '1A - Episomal, single tagged protein',
          description: 'Episomal vector with one transcription unit for expression of a tagged protein',
        },
        notes: {
          Category: 'Stable transfection',
          Subcategory: 'Episomal vector',
          Application: null,
          'Coding sequence design': 'Tagged protein',
          'Transcription Units': 1,
          'Transcription Unit Structure': 'Monocistronic',
          'Selection Marker': 'Absent',
        },
      },
    ),

    templateFromComponents(
      components1B,
      {
        metadata: {
          name: '1B - Single tagged protein',
          description: 'Vector with one transcription unit for expression of a tagged protein',
        },
        notes: {
          Category: 'Transient transfection',
          Application: null,
          'Coding sequence design': 'Targeting of proteins to cellular compartments',
          'Transcription Units': 1,
          'Transcription Unit Structure': 'Monocistronic',
          'Selection Marker': 'Absent',
        },
      },
    ),

    templateFromComponents(
      components2A,
      {
        metadata: {
          name: `2A - Episomal, single tagged fusion protein`,
          description: `Episomal vector with one transcription unit for expression of a tagged fusion protein`,
        },
        notes: {
          Category: 'Stable transfection',
          Subcategory: 'Episomal vector',
          Application: 'Targeting of proteins to cellular compartments',
          'Coding sequence design': 'Tagged protein; Fusion protein with linker',
          'Transcription Units': 1,
          'Transcription Unit Structure': 'Mixed',
          'Selection Marker': 'Absent',
        },
      }
    ),

    templateFromComponents(
      components2B,
      {
        metadata: {
          name: `2B - Single tagged fusion protein`,
          description: `Vector with one transcription unit for expression of a tagged fusion protein`,
        },
        notes: {
          Category: 'Stable transfection',
          Subcategory: 'Episomal vector',
          Application: 'Targeting of proteins to cellular compartments',
          'Transcription Units': 1,
          'Transcription Unit Structure': 'Monocistronic',
          'Coding sequence design': 'Tagged protein; Fusion protein with linker',
          'Selection Marker': 'Absent',
        },
      }
    ),

    // 3 is variant of 2A, but the same template

    // 4 is variant of 2A, but the same template

    templateFromComponents(
      components5,
      {
        metadata: {
          name: `5 - Episomal, single biscistronic unit`,
          description: `Episomal vector with one bicistronic transcription unit (IRES)`,
        },
        notes: {
          Category: 'Stable transfection',
          Subcategory: 'Episomal vector',
          Application: 'Targeting of proteins to cellular compartments',
          'Transcription Units': 1,
          'Transcription Unit Structure': 'Bicistronic',
          'Coding sequence design': 'Tagged protein',
          'Selection Marker': 'Absent',
        },
      }
    ),

    templateFromComponents(
      components6A,
      {
        metadata: {
          name: `6A - Episomal, Two bicistronic units`,
          description: `Episomal vector with two bicistronic transcription units`,
        },
        notes: {
          Category: 'Stable transfection',
          Subcategory: 'Episomal vector',
          Application: null,
          'Transcription Units': 2,
          'Transcription Unit Structure': 'Bicistronic',
          'Coding sequence design': null,
          'Selection Marker': 'Absent',
        },
      }
    ),

    templateFromComponents(
      components6B,
      {
        metadata: {
          name: `6B - Two proteins, no selection`,
          description: `Vector with two transcription units (without selection cassette) for genomic integration`,
        },
        notes: {
          Category: 'Stable transfection',
          Subcategory: 'Episomal vector',
          Application: null,
          'Transcription Units': 2,
          'Transcription Unit Structure': 'Monocistronic; Mixed',
          'Coding sequence design': null,
          'Selection Marker': 'Absent',
        },
      }
    ),

    templateFromComponents(
      components7,
      {
        metadata: {
          name: `7 - Two tagged proteins, selection marker`,
          description: `Vector with two transcription units and selection cassette for genomic integration and expression of tagged proteins`,
        },
        notes: {
          Category: 'Stable transfection',
          Subcategory: 'PiggyBac (PB) Transposon system (random integration)',
          Application: null,
          'Transcription Units': 3,
          'Transcription Unit Structure': 'Monocistronic',
          'Coding sequence design': 'Tagged protein',
          'Selection Marker': 'Present',
        },
      }
    ),

    templateFromComponents(
      components8,
      {
        metadata: {
          name: `8 - Two fusion proteins, selection marker`,
          description: `Vector with two transcription units and selection cassette for genomic integration and expression of fusion proteins`,
        },
        notes: {
          Category: 'Stable transfection',
          Subcategory: 'PiggyBac (PB) Transposon system (random integration)',
          Application: null,
          'Transcription Units': 3,
          'Transcription Unit Structure': 'Monocistronic',
          'Coding sequence design': 'Tagged protein; Fusion protein with Peptide Linker',
          'Selection Marker': 'Present',
        },
      }
    ),

    templateFromComponents(
      components9,
      {
        metadata: {
          name: '9 - Homologous recombination target vector',
          description: 'Homologous recombination–mediated Genome targeting',
        },
        notes: {
          Category: 'Stable transfection',
          Subcategory: 'Episomal vector',
          Application: 'Landing Pad',
          'Transcription Units': 2,
          'Transcription Unit Structure': 'Bisitronic',
          'Coding sequence design': null,
          'Selection Marker': 'Present',
        },
      },
    ),

    /*
     templateFromComponents(
     components10,
     {
     metadata: {
     name: `Template 10`,
     description: `Vector for integration into a landing pad`,
     },
     notes: {
     Category: 'Stable transfection',
     Subcategory: 'Recombinase–mediated Genome targeting',
     Application: 'Integration into a genomic landing pad',
     'Transcription Units': 2,
     'Transcription Unit Structure': 'Bicistronic; Monocistronic',
     'Coding sequence design': null,
     'Selection Marker': 'Present',
     },
     }
     ),
     */

    templateFromComponents(
      components11A,
      {
        metadata: {
          name: `11A - Hierarchical assembly vector, part A `,
          description: `Hierarchical assembly vector, used with Template 11B`,
        },
        notes: {
          Category: 'Transient transfection',
          Subcategory: null,
          Application: null,
          'Transcription Units': 1,
          'Transcription Unit Structure': 'Monocistronic',
          'Coding sequence design': null,
          'Selection Marker': 'Absent',
        },
      }
    ),

    templateFromComponents(
      components11B,
      {
        metadata: {
          name: `11B - Hierarchical assembly vector, part 2`,
          description: `Hierarchical assembly vector, used with Template 11A`,
        },
        notes: {
          Category: 'Transient transfection',
          Subcategory: null,
          Application: null,
          'Transcription Units': 1,
          'Transcription Unit Structure': 'Bicistronic',
          'Coding sequence design': null,
          'Selection Marker': 'Absent',
        },
      }
    ),

    templateFromComponents(
      components13A,
      {
        metadata: {
          name: `13A - Two proteins, one bicistronic unit (p2A), selection marker`,
          description: `Vector with one bicistronic transcription unit (p2a) and selection cassette for genomic integration`,
        },
        notes: {
          Category: 'Stable transfection',
          Subcategory: 'PiggyBac (PB) Transposon system (random integration)',
          Application: 'Reporter Genes',
          'Transcription Units': 2,
          'Transcription Unit Structure': 'Mixed; Monocistronic',
          'Coding sequence design': 'Tagged protein',
          'Selection Marker': 'Present',
        },
      }
    ),

    templateFromComponents(
      components13B,
      {
        metadata: {
          name: `13B - Two proteins, bicistronic unit (IRES), selection marker`,
          description: `Vector with one bicistronic transcription unit (IRES) and selection cassette for genomic integration`,
        },
        notes: {
          Category: 'Stable transfection',
          Subcategory: 'PiggyBac (PB) Transposon system (random integration)',
          Application: 'Reporter Genes',
          'Transcription Units': 2,
          'Transcription Unit Structure': 'Bicistronic; Monocistronic',
          'Coding sequence design': 'Tagged protein',
          'Selection Marker': 'Present',
        },
      }
    ),
  ];

  return {
    blocks: created,
    templates,
  };
}
