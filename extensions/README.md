This directory includes several example extensions, each of which has a README describing it specifically.

This directory is for local extensions only. By default, they will not automatically be installed. Extensions that are accessible to the server should be listed in `/server/extensions/package.json` and will be installed using npm. Extensions in this folder will only be accessible if listed in that manifest, or added as described in documentation on writing extensions.

[General Information on Extensions](../docs/extensions/README.md)