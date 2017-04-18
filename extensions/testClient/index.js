function render(container, options) {
  //change the content of the widget
  container.innerHTML = '<div class="extensionTestClass"></div>';

  //simple, beautiful CSS changes through DOM manipulation
  container.style.cssText = 'background: red; height: 100%; width: 100%';
}

window.constructor.extensions.register('testClient', 'projectDetail', render);
