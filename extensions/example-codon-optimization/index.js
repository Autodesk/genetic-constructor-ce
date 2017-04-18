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

// Optimize a sequence for a given organism.
// Note - Naive! Does nothing to account for repeats, GC content, etc.
const optimizeSequence = (sequence, organism) => {
  //handle null etc.
  if (typeof sequence !== 'string') {
    return sequence;
  }

  if (organism && (organism !== 'human' || organism !== 'yeast')) {
    throw new Error('invalid organism');
  }

  //todo - handle non multiple of three

  const table = organism === 'human' ? getHumanTable() : getYeastTable();
  const aminos = generateAminos(sequence, table);
  const optimized = optimizedSequenceFromAnimos(aminos, table);

  return optimized;
};

//given  a block (which may have hierarch), clone it and all its children, and optimize the sequences
const optimizeBlock = (blockId, organism) => {
  const clone = constructor.api.blocks.blockClone(blockId);

  //if its a construct, get all the blocks and put in a map {blockId : sequence}
  let promise;
  if (clone.isConstruct()) {
    const leaves = constructor.api.blocks.blockFlattenConstructAndLists(clone.id);

    promise = Promise.all(leaves.map(leaf => constructor.api.blocks.blockGetSequence(leaf.id)))
      .then(sequences => leaves.reduce((acc, leaf, index) => Object.assign(acc, { [leaf.id]: sequences[index] }), {}));
  }
  //if its a block, just get the sequence and put it in a map
  else {
    promise = constructor.api.blocks.blockGetSequence(clone.id)
      .then(sequence => ({ [clone.id]: sequence }));
  }

  //optimize the sequence map
  promise.then(map => {
    const optimized = {};

    Object.keys(map).forEach(blockId => {
      const seq = map[blockId];
      const opt = optimizeSequence(seq, organism);
      Object.assign(optimized, { [blockId]: opt });
    });

    return optimized;
  })
    .then(optimizedMap => {
      return Promise.all(Object.keys(optimizedMap).map(blockId => {
        const optSeq = optimizedMap[blockId];
        return constructor.api.blocks.blockSetSequence(blockId, optSeq);
      }));
    })
    .then(optimizedBlocks => {
      const projectId = constructor.api.projects.projectGetCurrentId();
      const construct = constructor.api.blocks.blockCreate({
        metadata: {
          name: 'Optimized Construct',
        },
        components: [clone.id],
      });
      return constructor.api.projects.projectAddConstruct(projectId, construct.id);
    })
    .catch((err) => {
      console.error('there was an error');
      console.error(err);
    });
};

//expose on the window
window.optimizeBlock = optimizeBlock;

// helpers
// these are hoisted up

function optimizedSequenceFromAnimos(aminos, table) {
  // incredibly naive!
  // Make a map of the most frequent codons
  const bestCodons = table.reduce((acc, codonObj) => {
    const { codon, aa, fraction } = codonObj;

    //if no codon defined, or this ones fraction is higher
    if (!acc[aa] || acc[aa] < fraction) {
      Object.assign(acc, { [aa]: codon });
    }

    return acc;
  }, {});

  return aminos.split('')
    .map(aa => bestCodons[aa])
    .join('');
}

//generate string of amino acids from sequence
function generateAminos(sequence, table) {
  const map = table.reduce((acc, codonObj) => Object.assign(acc, { [codonObj.codon]: codonObj.aa }), {});
  return sequence
  //break up into chunks of three
    .match(/.{1,3}/g)
    //if we can't find the codon (e.g. length is 1 or 2), just effectively skip it by returning empty string
    .map(codon => map[codon] || '')
    .join('');
}

//returns table in array of objects: { codon, aa, fraction }
function parseTable(tableString) {
  return tableString
    .trim()
    .replace(/U/gi, 'T')
    .replace(/\n/, '  ')
    .split('  ')
    .map(codonString => codonString.split(' '))
    .map(([codon, aa, fraction]) => ({
      codon,
      aa,
      fraction: parseFloat(fraction),
    }));
}

function getHumanTable() {
  return parseTable(`
UUU F 0.46  UCU S 0.19  UAU Y 0.44  UGU C 0.46
UUC F 0.54  UCC S 0.22  UAC Y 0.56  UGC C 0.54
UUA L 0.08  UCA S 0.15  UAA * 0.30  UGA * 0.47
UUG L 0.13  UCG S 0.05  UAG * 0.24  UGG W 1.00

CUU L 0.13  CCU P 0.29  CAU H 0.42  CGU R 0.08
CUC L 0.20  CCC P 0.32  CAC H 0.58  CGC R 0.18
CUA L 0.07  CCA P 0.28  CAA Q 0.27  CGA R 0.11
CUG L 0.40  CCG P 0.11  CAG Q 0.73  CGG R 0.20

AUU I 0.36  ACU T 0.25  AAU N 0.47  AGU S 0.15
AUC I 0.47  ACC T 0.36  AAC N 0.53  AGC S 0.24
AUA I 0.17  ACA T 0.28  AAA K 0.43  AGA R 0.21
AUG M 1.00  ACG T 0.11  AAG K 0.57  AGG R 0.21

GUU V 0.18  GCU A 0.27  GAU D 0.46  GGU G 0.16
GUC V 0.24  GCC A 0.40  GAC D 0.54  GGC G 0.34
GUA V 0.12  GCA A 0.23  GAA E 0.42  GGA G 0.25
GUG V 0.46  GCG A 0.11  GAG E 0.50  GGG G 0.25`);
}

function getYeastTable() {
  return parseTable(`
UUU F 0.59  UCU S 0.26  UAU Y 0.56  UGU C 0.63
UUC F 0.41  UCC S 0.16  UAC Y 0.44  UGC C 0.37
UUA L 0.28  UCA S 0.21  UAA * 0.47  UGA * 0.30
UUG L 0.29  UCG S 0.10  UAG * 0.23  UGG W 1.00

CUU L 0.13  CCU P 0.31  CAU H 0.64  CGU R 0.14
CUC L 0.06  CCC P 0.15  CAC H 0.36  CGC R 0.06
CUA L 0.14  CCA P 0.42  CAA Q 0.69  CGA R 0.07
CUG L 0.11  CCG P 0.12  CAG Q 0.31  CGG R 0.04

AUU I 0.46  ACU T 0.35  AAU N 0.59  AGU S 0.16
AUC I 0.26  ACC T 0.22  AAC N 0.41  AGC S 0.11
AUA I 0.27  ACA T 0.30  AAA K 0.58  AGA R 0.48
AUG M 1.00  ACG T 0.14  AAG K 0.42  AGG R 0.21

GUU V 0.39  GCU A 0.38  GAU D 0.65  GGU G 0.47
GUC V 0.21  GCC A 0.22  GAC D 0.35  GGC G 0.19
GUA V 0.21  GCA A 0.29  GAA E 0.70  GGA G 0.22
GUG V 0.19  GCG A 0.11  GAG E 0.30  GGG G 0.12`);
}
