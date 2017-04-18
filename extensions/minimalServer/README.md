Minimal Extension which registers a REST API with the server, using Express.

Simply exposes a route where all requests will return `Hello World!`. When the extension is loaded, you can make a request from the browser console by calling:

```javascript
fetch('/extensions/api/minimalServer/')
  .then(response => response.text())
  .then(text => console.log(text));
```

Does not use any build system.