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

export default class Node2DText {
  // construct our element and append to parents element
  constructor(node) {
    this.node = node;
    this.el = document.createElement('div');
    this.el.className = 'nodetext';
    this.node.el.appendChild(this.el);
  }

  /**
   * update to our current dimensions styles and innerHTML (text)
   */
  update() {
    const cacheString = this.node.width +
    this.node.height +
    this.node.fontWeight +
    this.node.fontSize +
    this.node.fontFamily +
    this.node.color +
    this.node.textAlign +
    this.node.textIndent +
    (this.node.text || '');

    if (this.currentCache !== cacheString) {
      this.currentCache = cacheString;
      this.el.style.width = this.node.width + 'px';
      this.el.style.height = this.el.style.lineHeight = this.node.height + 'px';
      this.el.style.fontWeight = this.node.fontWeight;
      this.el.style.fontSize = this.node.fontSize;
      this.el.style.fontFamily = this.node.fontFamily;
      this.el.style.color = this.node.color;
      this.el.style.textAlign = this.node.textAlign;
      this.el.style.textIndent = this.node.textIndent + 'px';
      this.el.innerHTML = this.node.text || '';
    }
  }
}
