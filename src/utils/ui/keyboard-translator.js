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

/**
 * convert keyboard short cuts to a platform specific string
 * All inputs are space separated.
 * The following sequences will translate according to the tables below.
 * The join character will be used to separate the resulting symbols i.e. + on microsoft and nothing on apple
 */

export const microsoft = {
  'ctrl': 'Ctrl',
  'mod': 'Ctrl',
  '⌘': 'Ctrl',
  'option': 'Ctrl',
  'meta': 'Ctrl',
  '^': 'Ctrl',
  'shift': 'Shift',
  '⇧': 'Shift',
  'alt': 'Alt',
  '⌥': 'Alt',
  join: '+',
};

export const apple = {
  'ctrl': '^',
  'mod': '⌘',
  '⌘': '⌘',
  'meta': '⌘',
  '^': '^',
  'shift': '⇧',
  '⇧': '⇧',
  'alt': '⌥',
  'option': '⌥',
  '⌥': '⌥',
  join: '',
};

export function stringToShortcut(str) {
  const table = /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? apple : microsoft;
  return translate(table, str);
}

export function translate(table, str) {
  return str.toLowerCase().split(' ').map(symbol => {
    return table[symbol] ? table[symbol] : symbol.toUpperCase();
  }).join(table.join);
}
