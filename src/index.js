"use strict";

function debugSelectionContext() {
  document.body.append(app.drawing.frame.getSelectionLayer());
}

window.componentLoader.load([
  { // priority level 1: app component handler
    urls: [
      "js/components/filesave.js",
      "js/components/toolbar-component.js",
      "js/components/app-file-reader.js",
      "js/utility.js",
    ],
    callback: function() {
    }
  },
  { // priority level 1: app component handler
    urls: [
      'pwa.js',
      'js/app.js',
      'js/event-listeners.js',
      'js/ui.js',
      'js/ui-mobile.js',
    ],
    callback: function() {
      // order sensitive
      window.app = window.App();
      window.ui = window.UI();
      window.uiMobile = window.UIMobile();
      
      window.DOM = {
        canvas: window.$('#canvas')[0],
        tool: window.$('#in-tool')[0],
        frame: window.$('#in-frame')[0],
        settingOnion: window.$('#in-onion-skin')[0],
      };
    }
  },
  { // priority level 2: app core component
    urls: [
      'js/dom-events.js',
      'js/components/state-manager.js',
      'js/components/frame.js',
      'js/components/timeline.js',
      'js/components/clipboard.js',
      'js/components/drawing.js',
      'js/components/undoManager.js',
      'js/components/projectManager.js',
    ],
  },
  { // priority level 3: core library
    urls: [
      'js/core/lib/aww.js',
      'js/core/lib/keyboard.js',
      'js/core/lib/lsdb.js',
    ],
  },
  { // priority level 4 and up: user defined extensions
    urls: [
      'js/components/tools/rotate.js',
      'js/components/tools/line.js',
      'js/components/tools/hand.js',
      'js/components/tools/move.js',
      'js/components/tools/select.js',
      'js/components/tools/wand.js',
      'js/components/tools/pencil.js',
      'js/components/tools/picker.js',
      'js/components/tools/eraser.js',
      'js/components/tools/fill.js',
      'js/components/tools/shapes/rectangle.js',
      'js/components/tools/shapes/ellipse.js',
      'js/components/layer.js',
      'js/components/tools.js',
    ],
    callback: function() {
      
    }
  },
  {
    urls: [
      'js/components/animator.js',
      'js/core/lib/CCapture.all.min.js',
    ],
    callback: function() {
      window.animator.initPreviewModal();
    }
  },
  {
    urls: [
    ],
    callback: function() {
      window.app.registerComponent('projectManager', window.ProjectManager());
      window.app.init();
      // debug script
      // $('[data-callback="mobile.start-drawing"]')[0].click()
    }
  },
  {
    urls: [
      "js/components/pinch-zoom.js",
      "js/lib/jszip.min.js",
    ],
    callback: function() {
    }
  },
]);