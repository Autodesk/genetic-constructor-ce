Basic Server extension which registers a REST API for writing and reading files


```javascript
var contents = 'string of contents';

fetch('/extensions/api/serverBasicApi/file/myFile.txt', {
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain'
  },
  body: contents
})
  .then(response => response.text())
  .then(text => console.log(text)); //returns the URL (/file/myFile.txt)

//...later

fetch('/extensions/api/serverBasicApi/file/myFile.txt')
  .then(response => response.text())
  .then(text => console.log(text === contents)); //true
```

Does not use any build system.
