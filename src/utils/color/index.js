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

import paletteAnime from './paletteAnime';
import paletteBright from './paletteBright';
import palettePastel from './palettePastel';
import paletteNature from './paletteNature';

const paletteLength = 16;

export const colorFiller = '#4B505E';
let lastIndex = 0;

export const palettes = ['anime', 'bright', 'pastel', 'nature'];

export function getPalette(name) {
  switch (name) {
  case 'bright':
    return paletteBright;
  case 'pastel':
    return palettePastel;
  case 'nature':
    return paletteNature;
  case 'anime':
  case 'default':
  default:
    return paletteAnime;
  }
}

//generate a random hex color
export function nextColor() {
  return lastIndex++ % paletteLength;
}

export function nextColorHex(palette = 'default') {
  return getPalette(palette)[nextColor()].hex;
}

export function resetColorSeed() {
  lastIndex = 0;
}

export function isHex(val) { return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(val); }

export function randomHex() { return '#' + Math.floor(Math.random() * Math.pow(2, 24)).toString(16); }
