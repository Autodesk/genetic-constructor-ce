import deepFreeze from 'deep-freeze';
const defaultConfig = { deep: false };

export const freezeReducerEnhancerCreator = (inputConfig = {}) => (reducer) => {
  const config = Object.assign({}, defaultConfig, inputConfig);

  return function frozenReducer(state, action) {
    if (config.deep === true) {
      return deepFreeze(reducer(state, action));
    }

    return Object.freeze(reducer(state, action));
  };
};

export default freezeReducerEnhancerCreator();
