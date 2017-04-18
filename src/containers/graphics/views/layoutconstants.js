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
// height of blocks
const blockH = 30;
// width of title
const titleW = 200;
const titleH = 40;
// total height of each row
const rowH = 60;
// row header bar height
const rowBarH = 4;
// vertical bar width
const rowBarW = 1;
// padding around text on blocks
const textPad = 10;
// min width of blocks
const minBlockWidth = 80;
// width of context menu 3 dots
const contextDotsW = 10;
const contextDotsH = 18;
// width of condensed text blocks
const condensedText = 40;
// height of banner bar above construct name
const bannerHeight = 18;
// inset of layout in graph
const insetX = 0;
const insetY = 0;
// inset of nested constructs
const nestedInsetX = 20;
const nestedInsetY = 20;
// font size
const titleFontSize = '20px';
const blockFontSize = '12px';
// background
const background = 'rgb(52, 57, 77)';
// size of role icons
const roleIcon = 27;
// min size of layout
const minWidth = blockH * 4;
const minHeight = blockH + rowBarH + titleH;
// height when collapsed
const collapsedHeight = blockH + titleH + bannerHeight + rowBarH;
// width of message for collapsed constructs e.g. 'and 123 more...'
const collapsedMessageWidth = 100;
// padding at right / bottom of scenegraph to make selection easier
const bottomPad = 50;
const rightPad = 30;
// width of reserved space for selection dot on options
const optionDotW = 16;
// height of list blocks ( options )
const optionH = 22;
// size of selection dot on options
const optionDotS = 5;
// left inset
const optionDotL = 10;

export default {
  // layout algorithms
  layoutFit: 'fit',
  layoutFull: 'full',

  // layout metrics
  blockH,
  optionH,
  optionDotW,
  optionDotS,
  optionDotL,
  contextDotsW,
  contextDotsH,
  titleW,
  titleH,
  rowH,
  rowBarH,
  rowBarW,
  textPad,
  minBlockWidth,
  condensedText,
  insetX,
  insetY,
  nestedInsetX,
  nestedInsetY,
  bannerHeight,
  roleIcon,
  minWidth,
  minHeight,
  collapsedHeight,
  collapsedMessageWidth,
  bottomPad,
  rightPad,

  // display properties for various elements
  titleAppearance: {
    fill: 'transparent',
    glyph: 'rectangle',
    strokeWidth: 0,
    fontSize: titleFontSize,
    textAlign: 'left',
    height: titleH,
  },
  // row bar
  rowAppearance: {
    height: rowBarH,
    glyph: 'rectangle',
    strokeWidth: 0,
  },
  verticalAppearance: {
    width: rowBarW,
    glyph: 'rectangle',
    strokeWidth: 0,
  },
  partAppearance: {
    color: 'black',
    glyph: 'rectangle',
    strokeWidth: 1,
    stroke: background,
    fontSize: blockFontSize,
  },
  labelAppearance: {
    color: 'white',
    fill: 'transparent',
    glyph: 'rectangle',
    strokeWidth: 0,
    stroke: 'transparent',
    fontSize: blockFontSize,
  },
  connectorAppearance: {
    glyph: 'rectangle',
    strokeWidth: 1,
    stroke: 'gray',
    fill: 'whitesmoke',
    fontWeight: 'bold',
    fontSize: blockFontSize,
    color: 'gray',
  },
};
