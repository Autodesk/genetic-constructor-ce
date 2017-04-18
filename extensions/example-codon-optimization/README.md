A very simple example of running a codon optimization for Yeast, getting the currently selected construct, and generating an optimized one.

**Note that this is merely a proof of principle, and there is absolutely no guarantee that this would make a sequence more optimized.**

The extension runs entirely on the client. A server would make more sense if we were attempting to support many organisms, or run more complicated optimizations.

Currently, this function is just exposed on the window at `optimizeBlock()`, pending support for extensions to add menu items.