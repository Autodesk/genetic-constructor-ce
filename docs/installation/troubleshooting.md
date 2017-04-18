### Correct versions of node and npm

Please check `package.json` to ensure you have the specified versions of `node` (>=4.2.2) and `npm` (>=3.7.1).

The software will not error if you have versions which are too old or too new.

### Installing on Ubuntu - nodegit error

Doing simply `npm install; npm run start` does not work on Ubuntu. The `npm install` goes fine but then `npm run start` fails due to this error in nodegit:

```
Cannot find module './build/Debug/nodegit'
```

According to [this issue](https://github.com/nodegit/nodegit/issues/137) it is a Ubuntu-specific bug.

This can be fixed with these extra steps:

```
npm install
cd node_modules/nodegit
npm run installDebug
cd ../..
npm run start
```