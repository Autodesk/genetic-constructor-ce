//examples of templates
//requires templates to have already been made

import invariant from 'invariant';
import { cloneDeep, merge } from 'lodash';
import { list } from './templateUtils';
import { baseTemplates, blocks as templateBlocks } from './templates';

//list of list blocks created while creating our examples
const created = [];

//todo - need to pass in specific instances of templates to pull from

const getTemplate = (name) => baseTemplates.find(tmpl => tmpl.metadata.name.toLowerCase().indexOf(`${name}`.toLowerCase()) === 0);

//need to find the specific one for this position, not just by name, because dependent on position
//mark it frozen to save a mapping call later...
//note - does not make a real block. Does not have an ID. need to wrap these appropriately.
const exampleOfTemplate = (template, options, toMerge = {}) => {
  let optionSpecifiedIndex = 0;
  const components = template.components
    .map(componentId => templateBlocks.find(block => block.id === componentId))
    .map(component => {
      if (!component.rules.list) {
        return component.id;
      }

      const pos = component.notes.Position;
      const desiredOption = options[optionSpecifiedIndex];
      const optionBlocks = Object.keys(component.options).map(optionId => templateBlocks.find(block => block.id === optionId));
      const option = optionBlocks.find(option => {
        const { name, shortName } = option.metadata;
        return name.toLowerCase() === desiredOption.toLowerCase() ||
          (shortName && shortName.toLowerCase() === desiredOption.toLowerCase());
      });

      invariant(pos, 'must have a position this refers to');
      invariant(option, `must have an option!
      ${template.metadata.name}, position ${pos}
      wanted ${desiredOption} (index ${optionSpecifiedIndex} of [${options.join(', ')}])
      possibilities are ${optionBlocks.map(block => `${block.metadata.name} [${block.metadata.shortName}]`).join(', ')}
      `);

      const optionId = option.id;

      //create a new block, and add it to the list of blocks created
      const newListComponent = list(pos, optionId);
      created.push(newListComponent);
      optionSpecifiedIndex++;

      return newListComponent.id;
    });

  return merge({}, toMerge, {
    components,
    rules: {
      frozen: true,
    },
  }, template);
};

export const makeBaseExamples = () => [
  //vector 12
  exampleOfTemplate(
    getTemplate('1A'),
    ['CAGp', 'Kz_1', 'mNG', 'SV40pA', 'SV40-ORI'],
    {
      metadata: {
        name: 'Single protein expression vector',
        description: `This vector is design for production of a protein of interest. The design of the expression cassette is minimal.

Addition of SV40-ORI makes this vector episomal when is introduced in HEK293T cells expressing the SV40 Large T-antigen.`,
      },
      notes: {
        Application: 'Production of a protein of interest',
      },
    },
  ),

  exampleOfTemplate(
    getTemplate('1A'),
    ['CAGp', 'Pal', 'mNG', 'SV40pA', 'SV40-ORI'],
    {
      metadata: {
        name: 'Plasma membrane targeting vector',
        description: `This vector is design for targeting of a protein (in this case mNG) to plasma membrane. Palmitoylation sequence added upstream of mNG target the protein to the plasma membrane.

Addition of SV40-ORI makes this vector episomal when is introduced in HEK293T cells expressing the SV40 Large T-antigen.`,
      },
      notes: {
        Application: 'Targeting of proteins to cellular compartments',
      },
    },
  ),

  exampleOfTemplate(
    getTemplate('1B'),
    ['CAGp', 'Pal', 'mNG', 'SV40pA', 'SV40-ORI'],
    {
      metadata: {
        name: 'Plasma membrane targeting vector',
        description: `This vector is design for targeting of a protein (in this case mNG) to plasma membrane. Palmitoylation sequence added upstream of mNG target the protein to the plasma membrane.

Addition of SV40-ORI makes this vector episomal when is introduced in HEK293T cells expressing the SV40 Large T-antigen.`,
      },
      notes: {
        Application: 'Targeting of proteins to cellular compartments',
      },
    },
  ),

  exampleOfTemplate(
    getTemplate('2A'),
    ['CAGp', 'SV40-NLS', 'mNG', 'LK-1', 'mR2', 'SV40pA', 'SV40-ORI'],
    {
      metadata: {
        name: 'Nucleus targeting vector',
        description: `This vector is design for targeting of a protein (in this case mNG) to the nucleus. SV40-NLS (nuclear localization signal) sequence added upstream of mNG-mR2 target the protein to nucleus.

A peptide linker is used to fuse 2 protein/domains together (mNG-mR2).

Addition of SV40-ORI makes this vector episomal when is introduced in HEK293T cells expressing the SV40 Large T-antigen.`,
      },
      notes: {
        Application: 'Targeting of proteins to cellular compartments',
      },
    },
  ),

  exampleOfTemplate(
    getTemplate('2B'),
    ['CAGp', 'SV40-NLS', 'mNG', 'LK-1', 'mR2', 'SV40pA'],
    {
      metadata: {
        name: 'Nucleus targeting vector',
        description: `This vector is design for targeting of a protein (in this case mNG) to the nucleus. SV40-NLS (nuclear localization signal) sequence added upstream of mNG-mR2 target the protein to nucleus.

A peptide linker is used to fuse 2 protein/domains together (mNG-mR2).`,
      },
      notes: {
        Application: 'Targeting of proteins to cellular compartments',
      },
    },
  ),

  exampleOfTemplate(
    getTemplate('2A'),
    ['CAGp', 'Kz_1', 'mNG', 'LK-1', 'Tb', 'SV40pA', 'SV40-ORI'],
    {
      metadata: {
        name: 'Cytoskeleton targeting vector',
        description: `This vector is design for targeting of a protein (in this case mNG) to the cytoskeleton, fusing the protein with a cytoskeleton protein (Tubulin).

A peptide linker is used to fuse 2 protein/domains together (mNG-Tb).

Addition of SV40-ORI makes this vector episomal when is introduced in HEK293T cells expressing the SV40 Large T-antigen.`,
      },
      notes: {
        Application: 'Targeting of proteins to cellular compartments',
      },
    },
  ),

  exampleOfTemplate(
    getTemplate('2A'),
    ['CAGp', 'MLS', 'mNG', 'p2A', 'mR2', 'SV40pA', 'SV40-ORI'],
    {
      metadata: {
        name: 'Mitochondria targeting vector',
        description: `This vector is design for targeting of a protein (in this case mNG) to the mitochondria, placing the MLS ( mitochondria leader sequence) in the N-terminal of mNG.

It is bicistronic transcription units : simultaneous expression of two proteins separately but from the same mRNA transcript. P2A is a self-cleaning peptide that cleave and release the 2 proteins mNG and mR2

Addition of SV40-ORI makes this vector episomal when is introduced in HEK293T cells expressing the SV40 Large T-antigen.`,
      },
      notes: {
        Application: 'Targeting of proteins to cellular compartments',
      },
    },
  ),

  exampleOfTemplate(
    getTemplate('5'),
    ['CAGp', 'IgKL', 'mR2', 'KDEL', 'IRES2', 'mNG', 'SV40pA', 'SV40-ORI'],
    {
      metadata: {
        name: 'Endoplasmic reticulum targeting vector',
        description: `This vector is design for targeting of a protein (in this case mR2) to the endoplasmic reticulum, placing the IgKL peptide and the KDEL peptide in the N-terminal and C-terminal respectively of the mR2 protein.
        
It is bicistronic transcription units : simultaneous expression of two proteins separately but from the same mRNA transcript. IRES (internal ribosome entry site) allow the binding of a ribosome for translation of the second protein coding sequence (mNG). 

Addition of SV40-ORI makes this vector episomal when is introduced in HEK293T cells expressing the SV40 Large T-antigen.`,
      },
      notes: {
        Application: 'Targeting of proteins to cellular compartments',
      },
    },
  ),

  exampleOfTemplate(
    getTemplate('6A'),
    ['TRE3Gp', 'Kz_1', 'mNG', 'p2A', 'mR2', 'SV40pA', 'EF1ap', 'Tet-ON-3G', 'p2A', 'mBP2', 'PGKpA', 'SV40-ORI'],
    {
      metadata: {
        name: 'Tetracycline inducible expression system',
        description: `This vector is design for chemically induced expression of a protein (mNG and mR2 in this case). The system used is the Tet-inducible promoter. The transcription factor Tet-ON3G is constitutionally expressed in the second transcription unit, in presence of Doxycycline it is activated, binds to TRE3Gp and activate expression of the first transcription unit (for expression of mNG and mR2).

It is bicistronic transcription units : simultaneous expression of two proteins separately but from the same mRNA transcript. . P2A is a self-cleaning peptide that cleave and release the 2 proteins (mNG and mR2 in the first TU and Tet-ON3G and mBP2 in the second TU)

Addition of SV40-ORI makes this vector episomal when is introduced in HEK293T cells expressing the SV40 Large T-antigen.`,
      },
      notes: {
        Application: 'Inducible expression system',
      },
    },
  ),

  exampleOfTemplate(
    getTemplate('6B'),
    ["5'HA-hAAVS1", 'IS_FB', 'TRE3Gp', 'Kz_1', 'mNG', 'SV40pA', 'CMVp', 'Tet-ON-3G', 'p2A', 'PuroR', 'PGKpA', 'IS_FB', "3'HA-hAAVS1"],
    {
      metadata: {
        name: 'Tetracycline inducible expression system ',
        description: `This vector is design for chemically induced expression of a protein (mNG and mR2 in this case). The system used is the Tet-inducible promoter. The transcription factor Tet-ON3G is constitutionally expressed in the second transcription unit, in presence of Doxycycline it is activated, binds to TRE3Gp and activate expression of the first transcription unit (for expression of mNG and mR2).

Homology arms flanking the expression cassettes are used for integration of the vector in a specific genomic locus using CRISPR/Cas9 system.

The second TU is bicistronic: simultaneous expression of two proteins separately but from the same mRNA transcript. . P2A is a self-cleaning peptide that cleave and release the 2 proteins ( Tet-ON3G and PuroR in the second TU)

PuroR is used to select cells that have integrated the vector in the genome`,
      },
      notes: {
        Application: 'Inducible expression system',
      },
    },
  ),

  exampleOfTemplate(
    getTemplate('7'),
    ["5'-ITR-PB", 'IS_FB', 'CAGp', 'SV40-NLS', 'mNG', 'SV40pA', 'SV40p', 'PuroR', 'bGHpA', 'EF1ap', 'mR2', 'NES', 'PGKpA', 'IS_FB', "3'-ITR-PB"],
    {
      metadata: {
        name: 'Nucleus and cytoplasm targeting vector',
        description: `This vector is design for targeting of a protein (in this case mNG ) to the nucleus: SV40-NLS (nuclear localization signal) sequence targets the protein to nucleus. mR2 is targeted in the cytoplasm and excluded from the nucleus due to the NES (nuclear exportation sequence). 

The piggyBac system allow random integration of the vector in the genome.

PuroR is used to select cells that have integrated the vector in the genome`,
      },
      notes: {
        Application: 'Targeting of proteins to cellular compartments',
      },
    },
  ),

  exampleOfTemplate(
    getTemplate('8'),
    ["5'-ITR-PB", 'IS_FB', 'CAGp', 'Pal', 'mR2', 'LK-1', 'DmrC', 'SV40pA', 'SV40p', 'PuroR', 'bGHpA', 'EF1ap', 'mNG', 'LK-3', 'DmrA', 'PGKpA', 'IS_FB', "3'-ITR-PB"],
    {
      metadata: {
        name: 'Dimerization inducible system',
        description: `This vector is design for targeting of a protein (in this case mNG ) to the plasma membrane : Palmytolination sequence added upstream of mNG target the protein to the plasma membrane.

The piggyBac system allow random integration of the vector in the genome.

A peptide linker is used to fuse 2 protein/domains together

Inducible dimerization system: protein are fused with dimerization domains. The dimerization domains dimerize in presence of chemical compound.

PuroR is used to select cells that have integrated the vector in the genome.`,
      },
      notes: {
        Application: 'Inducible dimerization system',
      },
    },
  ),

  exampleOfTemplate(
    getTemplate('9'),
    ["5'HA-hAAVS1", 'IS_FB', 'CAGp', 'attP', 'Kz_1', 'BxB1', 'p2A', 'PuroR', 'SV40pA', 'IS_FB', "3'HA-hAAVS1"],
    {
      metadata: {
        name: 'Recombinase-mediated genomic landing pad',
        description: `This vector is design for generation of a landing pad. After integration into a specific genomic locus it will be successively used to integrate other vector using the site-specific recombination technology

Homology arms flanking the expression cassettes are used for integration of the vector in a specific genomic locus using CRISPR/Cas9 system.

The TU is bicistronic: simultaneous expression of two proteins separately but from the same mRNA transcript. . P2A is a self-cleaning peptide that cleave and release the 2 proteins ( BxB1 and PuroR)

PuroR is used to select cells that have integrated the vector in the genome`,
      },
      notes: {
        Application: 'Landing pad',
      },
    },
  ),

  //skipping example of 10 because of a-e connector

  exampleOfTemplate(
    getTemplate('11A'),
    ['CAGp', 'Kt-Kt', 'Kz_1', 'mNG', 'SV40pA'],
    {
      metadata: {
        name: 'Tet-inducible translation regulator (part A)',
        description: `This vector is built in a two-step assembly. Parts A and B are built using the platform and are then joined together in a second level BsaI - Golden Gate assembly.

The final resulting vector encode for a tetracycline inducible expression system for the expression of an RNA-binding protein (L2Ae). L2Ae binds to the RNA motif Kt-Kt placed upstream of the gene of interest (mNG) blocking its translation. The final effect is an inducible  knockdown of the gene of interest (mNG).`,
      },
      notes: {
        Application: 'Inducible regulation of gene expression at translational level',
      },
    },
  ),

  exampleOfTemplate(
    getTemplate('11B'),
    ['TRE3Gp', 'Kz_1', 'L7Ae', 'IRES2', 'mR2', 'SV40pA', 'CMVp', 'Tet-ON-3G', 'p2A', 'mBP2', 'PGKpA'],
    {
      metadata: {
        name: 'Tet-inducible translation regulator (part B)',
        description: `This vector is built in a two-step assembly. Parts A and B are built using the platform and are then joined together in a second level BsaI - Golden Gate assembly.

The final resulting vector encode for a tetracycline inducible expression system for the expression of an RNA-binding protein (L2Ae). L2Ae binds to the RNA motif Kt-Kt placed upstream of the gene of interest (mNG) blocking its translation. The final effect is an inducible  knockdown of the gene of interest (mNG).`,
      },
      notes: {
        Application: 'Inducible regulation of gene expression at translational level',
      },
    },
  ),

  /*
   exampleOfTemplate(
   getTemplate('13A'),
   ["5'-ITR-PB", 'IS_FB', 'EF1ap', '3XFLG', 'LCF', 'p2A', 'mK2', 'SV40pA', 'SV40p', 'PuroR', 'bGHpA', 'IS_FB', "3'-ITR-PB"],
   {
   metadata: {
   name: 'Reporter vector',
   description: `This vector is design for the expression of reporter genes and therefore to constantly track the transfected cells (such as tumor cells).

   Luciferase reporter: Bioluminescent imaging  is a sensitive and versatile tool that uses luciferase enzyme as an imaging reporter. It has been used to track transfected cells. Luciferase has also a 3XFLAG for immunostaining

   The piggyBac system allow random integration of the vector in the genome.`,
   },
   notes: {
   Application: 'Reporter gene',
   },
   },
   ),

   exampleOfTemplate(
   getTemplate('13B'),
   ["5'-ITR-PB", 'IS_FB', 'EF1ap', 'Palm', 'mK2', 'IRES2', 'LCF', '3XFLG', 'SV40pA', 'SV40p', 'PuroR', 'bGHpA', 'IS_FB', "3'-ITR-PB"],
   {
   metadata: {
   name: 'Reporter vector',
   description: `This vector is design for the expression of reporter genes and therefore to constantly track the transfected cells (such as tumor cells).

   Luciferase reporter: Bioluminescent imaging  is a sensitive and versatile tool that uses luciferase enzyme as an imaging reporter. It has been used to track transfected cells. Luciferase has also a 3XFLAG for immunostaining

   mK2 is targeted to the plasma membrane

   The piggyBac system allow random integration of the vector in the genome.`,
   },
   notes: {
   Application: 'Reporter gene',
   },
   },
   ),
   */

];

//need to make them so we can track the created blocks
export const baseExamples = makeBaseExamples();

export const blocks = [... new Set(created)];
