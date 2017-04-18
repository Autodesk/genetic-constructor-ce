### Documentation Structure

On GitHub, you'll find general documentation + tutorials + examples for developing on Genetic Constructor.

This documentation details APIs exposed by Constructor.

If you are just getting started, start at [GitHub](https://github.com/autodesk-bionano/genome-designer/tree/master/docs).

## Overview

Additional detail about these sections is available on GitHub, but here's the lay of the land...

#### {@link module:constructor `window.constructor`}

Genetic Constructor exposes its API on the window, and is the means for extensions to interact with the application.

This includes an api for actions, extensions, constants, etc.,

#### {@link module:Actions Actions} and {@link module:Selectors Selectors}

These are the specific functions for accessing application data and changing application state.

#### {@link module:Models Models} (Classes)

Models are classes, bounding to Constructor-specific schemas, used throughout as the application's data.