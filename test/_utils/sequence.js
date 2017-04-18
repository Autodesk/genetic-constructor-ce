const bases = 'ACGT'.split('');
const numBases = bases.length;

export const generateRandomSequence = (length = 100) => {
  let sequence = '';
  for (let i = 0; i < length; i++) {
    sequence = sequence + bases[Math.floor(Math.random() * numBases)];
  }
  return sequence;
};
