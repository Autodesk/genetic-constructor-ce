import invariant from 'invariant';

//todo (future) - allow manifest to specify multiple regions for a single file. Allow region to be an array, not just a string.

//validate a manifest
export function validateManifest(manifest) {
  invariant(typeof manifest === 'object', 'must pass manifest to clientCheck');
  invariant(typeof manifest.geneticConstructor === 'object', 'must pass a valid genetic constructor manifest');

  const { type, router, client } = manifest.geneticConstructor;

  invariant(typeof type === 'string', 'must specify geneticConstructor.type');

  invariant(!!client || !!router, 'must specify client or router for extension');

  if (!!client) {
    invariant(Array.isArray(client), 'geneticConstructor.client must be array');
    invariant(client.every(clientObj => typeof clientObj.file === 'string'), 'each client extension object must have a file');
    invariant(client.every(clientObj => typeof clientObj.region === 'string' || clientObj.region === null), 'each client extension object must have a region, or define region as null');

    //get regions, ignore null, make sure no repeats
    const regions = client.map(clientObj => clientObj.region).filter(region => !!region);
    const regionSet = new Set(regions);
    invariant(regions.length === [...regionSet].length, 'can only have one client extension per region');
  }

  if (!!router) {
    invariant(typeof router === 'string' && router.endsWith('.js'), 'must specify javascript router as file');
  }

  return manifest;
}

/**
 * Check whether an extension manifest has client side components. Does not validate their format.
 * @private
 * @param manifest
 * @returns {boolean} true if client components
 */
export function manifestIsClient(manifest) {
  //check for old format
  if (typeof manifest.geneticConstructor.client === 'string' || typeof manifest.geneticConstructor.region === 'string') {
    console.error('extension in wrong format. Manifest should list array of client modules, not a single one. Check docs.');
  }

  if (!Array.isArray(manifest.geneticConstructor.client)) {
    return false;
  }

  return manifest.geneticConstructor.client.length > 0;
}

/**
 * Check whether an extension manifest has server side components
 * @private
 * @param manifest
 * @returns {boolean} true if server components
 */
export function manifestIsServer(manifest) {
  return !!manifest.geneticConstructor.router;
}

export function manifestClientFiles(manifest) {
  invariant(manifestIsClient(manifest), 'must pass client manifest');
  return manifest.geneticConstructor.client.map(clientObj => clientObj.file);
}

export function manifestClientRegions(manifest) {
  invariant(manifestIsClient(manifest), 'must pass client manifest');
  return manifest.geneticConstructor.client.map(clientObj => clientObj.region);
}

//given a manifest (where only one file for a given region) and a region, find the file
export function getClientFileFromRegion(manifest, region) {
  invariant(manifestIsClient(manifest), 'must pass client manifest');
  const finder = (clientObj) => clientObj.region === region;
  const found = manifest.geneticConstructor.client.find(finder);

  return found ? found.file : null;
}

export function extensionName(manifest) {
  return manifest.geneticConstructor.readable || manifest.name;
}

export function extensionAuthor(manifest) {
  return manifest.author || 'Unknown';
}

export function extensionDescription(manifest) {
  return manifest.geneticConstructor.description || manifest.description || 'No Description';
}

export function extensionType(manifest) {
  return manifest.geneticConstructor.type || '';
}

export function extensionRegion(manifest) {
  return manifest.geneticConstructor.region;
}
