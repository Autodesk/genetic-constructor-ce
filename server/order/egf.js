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
import fetch from 'isomorphic-fetch';

const url = 'http://synnp.org:8010/api/order/';

const createPostBody = (body) => {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  };
};

const createOrderPayload = (order, user, constructList, rollup) => {
  const blockMap = rollup.blocks;
  const constructsWithBlockComponents = constructList.map(blockIds => blockIds.map(blockId => blockMap[blockId]));

  //console.log(blockMap);
  //console.log(order.constructs);
  //console.log(constructsWithBlockComponents);

  //for now, only accept EGF Parts -- need to relay this to the client
  if (!constructsWithBlockComponents.every(construct => construct.every(component => component.source.source === 'egf'))) {
    throw new Error(`invalid part: some part's source is not 'egf'`);
  }

  const constructs2d = constructsWithBlockComponents
    .map(constructWithComponents => constructWithComponents.map(block => block.source.id));

  const payload = {
    orderId: order.id,
    constructs: constructs2d,
    isCombinatorialMix: order.parameters.onePot,
    customer: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
    validationOnly: false,
  };

  return payload;
};

export const submit = (order, user, constructList, rollup) => {
  let stringified;

  try {
    const payload = createOrderPayload(order, user, constructList, rollup);
    stringified = JSON.stringify(payload);
  } catch (err) {
    console.log('[EGF Order] error generating payload');
    return Promise.reject(err);
  }

  return fetch(url, createPostBody(stringified))
    .then(response => {
      if (!response.ok) {
        console.log('[EGF Order] There was an error submitting to egf');

        const clone = response.clone();
        return clone.text().then(text => {
          console.log(text);
          return Promise.reject(response);
        });
      }

      return response.json().then(json => {
        console.log('[EGF Order] got response from EGF:');
        console.log(json);

        return Promise.resolve({
          jobId: `${json.egf_order_id}`,
          cost: `${json.estimated_price}`,
        });
      });
    });
};

export const validate = (order, user, constructList, rollup) => {
  let stringified;

  try {
    const payload = createOrderPayload(order, user, constructList, rollup);

    //to just validate it
    payload.validationOnly = true;

    stringified = JSON.stringify(payload);
  } catch (err) {
    console.log('[EGF Order] error generating payload');
    return Promise.reject(err);
  }

  return fetch(url, createPostBody(stringified))
    .then(resp => resp.json())
    .then(resp => resp.success);
};
