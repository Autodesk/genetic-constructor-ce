Genetic Constructor can be run a few different ways.

## Without Authentication

### Default

##### Prerequisites

- Node.js (4.x) and npm (3.x)
  - `node -v` should show `4.x` ---- note this is not latest 6.x branch
  - `npm -v` should show `3.x` --- update with `npm update -g npm`

- Python (2.7) and pip

- If on MacOS `brew` is recommended, for installing optional dependency `fsharp` for the GSL extension

##### Instructions

Easiest way to get set up, using mocked authentication. In this installation, there are no accounts. Everything will function normally, with the caveat that the user is forced and has a static ID. This is currently the recommended configuration for local development.

`npm install`

`npm run start`

### In a Docker Container

```
docker-compose -f docker-compose.yml -p gctor build
docker-compose -f docker-compose.yml -p gctor up
```

Builds a docker image in an virual machine, dependencies handled for you, with an ephemeral file system.

## With Authentication

User authentication depends on the Bio/Nano User Platform project, which is currently not open source and requires access to the Autodesk internal GitHub.

As a result, user authentication is NOT enabled by default when running this application locally. Authentication routes and a user object is provided but is mocked in middleware and routes provided in this project by default.

If you have the bio-user-platform installed, you can run the server with authentication by running:

`npm run start-auth-stack`.

[Click here to read how to install the bio-user-platform](./installation-bio-user-platform.md)

## Extensions

Extensions should not require additional dependencies or installations steps. They may run scripts that hook into npm or git to accomplish any additional steps automatically. If you experience problems with an extension, check its README.

## Troubleshooting

If you encounter an issue in installation, it may be covered in notes on [troubleshooting](./troubleshooting.md).

Otherwise, please [file an issue on GitHub](https://github.com/autodesk-bionano/genome-designer/issues/new)
