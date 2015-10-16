# egf-collaboration

### installation

`npm install`

`npm run start`

### Todos

use constants/ActionTypes
Actions should only return state payloads not do things. ActionCreators are (always?) pure functions.

add Promises middleware for actions. remove redux-thunk?

include jsdom for Mocha testing and allowing setState (React assumes dom until issue [#4109](https://github.com/facebook/react/issues/4019) fixed)