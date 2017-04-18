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
import * as ActionTypes from '../constants/ActionTypes';
import * as instanceMap from '../store/instanceMap';

export const initialState = {};

export default function orders(state = initialState, action) {
  switch (action.type) {
  case ActionTypes.ORDER_CREATE:
  case ActionTypes.ORDER_STASH:
  case ActionTypes.ORDER_SET_PARAMETERS:
  case ActionTypes.ORDER_SUBMIT:
  case ActionTypes.ORDER_SET_NAME:
    const { order, orders } = action;
    if (Array.isArray(orders)) {
      instanceMap.saveOrder(...orders);
      const toMerge = orders.reduce((acc, order) => Object.assign(acc, { [order.id]: order }), {});
      return Object.assign({}, state, toMerge);
    }

    instanceMap.saveOrder(order);
    return Object.assign({}, state, { [order.id]: order });

  case ActionTypes.ORDER_DETACH :
    const { orderId } = action;
    const clone = Object.assign({}, state);
    delete clone[orderId];
    instanceMap.removeOrder(orderId);
    return clone;

  case ActionTypes.USER_SET_USER :
    return Object.assign({}, initialState);

  default:
    return state;
  }
}
