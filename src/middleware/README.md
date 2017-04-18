All client-server communication occurs through middleware defined in this directory.

In general, users and authors will only call middleware functionality using actions / selectors, which provide error handling, and wrap responses in appropriate data types.

Most requests are made using `fetch()`, and wrapped in `rejectingFetch()` so that responses with status > 400 are rejected.
