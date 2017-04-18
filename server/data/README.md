# Data API

## Overview

This section of the API is for saving Projects, Blocks, and Orders.

##### Projects

Projects are the data container for bodies of work, and consist primarily of constructs and blocks.

##### Sequences

Sequences are saved under their md5 hash, and in a separate folder. The md5 is computed on the client, and `block.sequence.md5` notes this value, which is used for retrieving the sequence.

##### Orders

Orders, placed at third party foundries, are tied to a particular project and version. They are currently DNA orders, but could take on different physical forms.

##### Versions

Projects are versioned, in `project.version`, and prior versions can be promoted to the current version. Changes are always made to the head version.

##### Snapshots

Projects can be snapshotted, which signify the importance of a project at a particular version, and ensure the version will not be deleted. They can be triggered by the user, or by the server, e.g. when a user places an order.

### Data Formats

##### Rollup Format

Autosaving / loading models are passed as a `rollup`, which takes the format:

```
{
  project: <projectManifest>,
  blocks: <blockMap>
}
```

In some places (e.g. import/export), `sequences` may be part of the rollup, with blocks which specifying a range in the form `[start, end]` (or true for the whole sequence).

```
{
  sequences: [
    {
      sequence: 'ACGTACCGACTGAC',
      blocks: {
        <blockId>: [start, end]
      }
    }
  ]
}
```

### Permissions

Projects and their contents currently can only be owned / accessed by single users.

Project permissions are checked in `index.js` router... Other utilities assume that permissions are valid when they are called.

Sequences can be accessed by anybody, and are not owned by anybody.