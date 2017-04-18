Extension with a simple visual component.

Instead of simply registering with the API, this extension renders into a defined region of the application, by calling `window.constructor.extensions.register`.

Genetic Constructor exposes specific regions where extensions can insert themselves. In this case, the extension renders in `projectDetail` - the panel below the design canvas.

Does not use any build system.