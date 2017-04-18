Genbank Converter

Uses BioPython to convert, import, and export Genkbank files into Genetic Constructor projects and blocks.

## REST API

Root of API is:

```
/extensions/api/genbank/
```

### Routes

##### Conversion

```
/extensions/api/genbank/import/convert
```

##### Import

Either create a new project (specify `projectId`), or add to the current project (omit `projectId`)

```
/extensions/api/genbank/import/:projectId?
```

##### Export

Export a project,` by `projectId` or specify a construct (by `constructId) within a project.

```
/extensions/api/genbank/export/:projectId/:constructId?
```