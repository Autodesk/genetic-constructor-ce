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

/* global ga:false */
/**
 * send a custom event to Google Analytics tracking
 * Documentation on these parameters can be found at: https://developers.google.com/analytics/devguides/collection/analyticsjs/events
 *
 * @private
 *
 * @example
 *
 * A typical call would use just the category and action ( strings ) e.g.
 *
 * ```
 * track('Project', 'New Project', 'Via Menu')
 * ```
 */
export default function track(category, action, label, value, nonInteraction) {
  // only send if in production env and google analytics is present
  if (process.env.NODE_ENV === 'production') {
    if (typeof ga === 'function') {
      ga('send', 'event', category, action, label, value, nonInteraction);
    }
  }
}
