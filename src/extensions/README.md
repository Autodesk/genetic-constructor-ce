The directory handles the client-side extension registry, and retrieving + downloading + rendering extensions.

It fetches data from the server. The server is repsonsible for actually maintaining the list of extensions, and sending the list of client extensions.

The list of extensions is loaded from the server on startup. Only active extensions are loaded. Each manifest is added to the registry using `registerManifest()`.

Nonvisual client extensions are downloaded immediately.

Visual extensions are downloaded lazily as needed. Extension manifests must be registered before the extension can register a `render()` function.

---

The flow:

... server starts ...

- extensions are validated, and registered + installed on the server
- a route exists to get all the extension manifests

... on startup, or when config changes ...

- retrieve list of extensions from server
- check + register manifests
- download non-visual client files immediately
- run onRegister() callbacks

... when user requests / opens the extension ...

- the extension is not loaded all at once. Each region the extension will download its file as needed, and only render its own region. Files are only downloaded as needed, unless multiple regions refer to the same file.
- call downloadAndRender() for an extension, which has two steps:
- downloadExtension() downloads client files
    - extension files actually downloaded
    - each extension file should call constructor.extensions.register() with the extension's render() function
    - register() assigns a wrappedRender() function to the manifest
- render()
    - calls wrappedRender() and passes appropriate containers for each region
    - extension now actually visible