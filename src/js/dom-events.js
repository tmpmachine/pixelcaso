;(function() {
  
  'use strict';
  
  let $0 = document.querySelector.bind(document);
  
  window.DOMEvents = {
  
  	/*
  		DOM event handler is structured as below :
  
  		eventClass {
  			data-callback-attribute: callbackFunction
  		}
  	*/
  
  	clickable: {
  	  modals: {
  	    'recent-projects-click-handler': (ev) => window.ui.handleProjectClick(ev),
  	  },
  	  mobile: {
    	  'start-drawing': () => { window.ui.createDraftProject(); },
    	  'back': () => {
    	    window.ui.backToMobileLandingScreen();
    	  },
    	  'canvas-setup': () => { window.ui.modal.resizeCanvas(); },
    	  'toggle-awake': () => { window.ui.toggleAwake(); },
    	  'toggle-palette': () => { window.ui.togglePaletteWindow(); },
    	  'toggle-layers': () => { window.uiMobile.toggleLayersWindow(); },
    	  'open-project': () => { window.ui.openProject(); },
    	  'save-project': () => { window.ui.saveProject(); },
    	 // 'setting-menu': {
    	   // 'back': () => { window.uiMobile.settingMenu.back() },
    	 // },
    	  layer: {
    	    'add': () => window.app.layer.insertLayer(),
          'focus': (event) => { window.uiMobile.layer.focus(event); },
          'rename': () => window.app.layer.renameLayer(),
          'delete': () => window.app.layer.delete(),
          'move-up': () => window.app.layer.moveUp(),
          'move-down': () => window.app.layer.moveDown(),
    	  },
  	  },
  	  editor: {
  	    'undo': () => window.app.undoManager.undo(),
        'redo': () => window.app.undoManager.redo(),
        'zoom-in': () => {
          if (scaleIndex < scaleValues.length-1) {
            scaleIndex++;
            let targetScale = scaleValues[scaleIndex];
            window.app.drawing.zoom(targetScale);
            scale = targetScale;
            window.app.drawing.redraw();
          } 
        },
        'zoom-out': () => {
          if (scaleIndex > 0) {
            scaleIndex--;
            let targetScale = scaleValues[scaleIndex];
            window.app.drawing.zoom(targetScale);
            scale = targetScale;
            window.app.drawing.redraw();
          }
        },
        'clear-selection': () => window.ui.escapeKey(),
        'cut': () => window.app.drawing.frame.cut(),
        'copy': () => window.app.drawing.frame.copy(),
        'paste': () => window.app.drawing.frame.paste(),
        // 
  	  },
  	  image: {
  	    'flip-horizontal': () => window.app.drawing.frame.flipHorizontal(),
        'flip-vertical': () => window.app.drawing.frame.flipVertical(),
  	  },
      'new-layer': () => window.app.layer.insertLayer(),
      'toggle-layer': () => window.app.layer.toggleVisibility(),
      'rename-layer': () => window.app.layer.renameLayer(),
      'pick-color': () => window.app.drawing.tools.selectTool('picker', true),
      'toggle-palette': window.ui.togglePaletteWindow,
      'toggle-layers': () => window.ui.window.toggleLayers(),
      'on-floating-tool-click': (evt) => window.ui.toolbar.onFloatingToolClick(evt),
      'scale-down': () => animator.scale(-1),
      'scale-up': () => animator.scale(1),
      timeline: {
        'edit-frame-length': window.ui.timeline.editFrameLength,
        'delete-layer': () => window.app.layer.delete(),
        'duplicate-layer': () => window.app.layer.duplicate(),
        'merge-layer': () => window.app.layer.mergeLayer(),
        'move-up': () => window.app.layer.moveUp(),
        'move-down': () => window.app.layer.moveDown(),
        'new-frame': () => window.app.drawing.frame.newFrame(),
        'layer-action': window.ui.layer.eventHandler,
      },
      'animator': {
        'toggle-play': window.ui.animator.togglePlay,
      },
      'window': {
        'preview': () => window.ui.window.togglePreview(),
      },
      'toggle-modal': function() { window.ui.toggleModal(this.dataset.target); },
  	},
    
    submittable: {
  		'export-image': window.ui.exportImage,
  		'export-video': (event) => animator.exportVideo(event),
  		'change-frame-length': window.ui.timeline.changeFrameLength,
  		'resize-canvas': window.ui.resizeCanvas,
  		'update-layer-settings': window.ui.layer.updateLayerSettings,
  	},
  	
  	uploadable: {
      'open-project': async (event) => { 
        await window.app.openProjectFromPopup(event);
        event.target.value = '';
        window.ui.closeMobileLandingScreen();
      },
    },
    
    menuLink: {
      'file': {
        // 'open': () => $('#in-open-image').click(),
        'new-project': window.ui.newProject,
        'openProject': window.ui.openProject,
        'saveProject': () => window.ui.saveProject(),
        'exportProject': () => window.ui.exportProject(),
  	    'toggle-modal-project': () => window.ui.toggleRecentProjects(),
        // -- 
        // 'export': window.ui.toggleModalExport,
        // 'export': window.ui.toggleModal,
        // 'export-video': window.ui.exportVideo,
        'resize-canvas': window.ui.modal.resizeCanvas,
      },
      view: {
        'zoomIn': window.ui.zoomIn,
        'zoomOut': window.ui.zoomOut,
        'zoomReset': () => window.ui.resetZoom(),
        'show-grid': () => window.ui.toggleShowGrid(),
        'show-grid-pixel': () => window.ui.toggleShowGridPixel(),
      },
      editor: {
        'undo': () => window.app.undoManager.undo(),
        'redo': () => window.app.undoManager.redo(),
        'select-all': () => window.app.drawing.tools.utility.select.selectAll(),
        'clear-selection': () => window.ui.escapeKey(),
        'cut': () => window.app.drawing.frame.cut(),
        'copy': () => window.app.drawing.frame.copy(),
        'paste': () => window.app.drawing.frame.paste(),
        //
        'set-grid-size': () => window.ui.setGridSize(),
      },
      'select-tool': () => window.app.drawing.tools.selectTool(event.target.dataset.tool),
      'tools': {
        'decrease-pixel': () => window.app.drawing.tools.decreaseLineWidth(),
        'increase-pixel': () => window.app.drawing.tools.increaseLineWidth(),
      },
      'image': {
        'flip-horizontal': () => window.app.drawing.frame.flipHorizontal(),
        'flip-vertical': () => window.app.drawing.frame.flipVertical(),
        'crop-to-selection': () => {
            let selectionData = null;
            let isRecordHistory = true;
            window.app.drawing.cropToSelection(selectionData, isRecordHistory);
          },
        //
        'toggle-repeat-mode': () => window.app.toggleRepeat(),
      },
      'frame': {
        'prev': () => window.app.drawing.frame.prevFrame(),
        'next': () => window.app.drawing.frame.nextFrame(),
        // 'insert': () => window.app.drawing.frame.insertFrame(),
        // 'delete': () => window.app.drawing.frame.deleteFrame(),
      },
      'window': {
        'color': () => window.ui.togglePaletteWindow(),
        'layers': () => window.ui.window.toggleLayers(),
        'reference': () => window.ui.window.toggleReference(),
        'preview': () => window.ui.window.togglePreview(),
        // 
        'reset': () => window.ui.resetWindow(),
      },
      'project': {
        'switch': (evt) => window.ui.switchProject(evt),
      },
    },
  	
  	keyboardShortcut: {
      '1': () => window.app.drawing.tools.selectTool('pencil'),
      'P': () => window.app.drawing.tools.selectTool('pencil'),
      '2': () => window.app.drawing.tools.selectTool('eraser'),
      'E': () => window.app.drawing.tools.selectTool('eraser'),
      '3': () => window.app.drawing.tools.selectTool('picker', true),
      'K': () => window.app.drawing.tools.selectTool('picker', true),
      
      'F': () => window.app.drawing.tools.selectTool('fill'),
      'L': () => window.app.drawing.tools.selectTool('line'),
      'U': () => window.app.drawing.tools.selectTool('ellipse'),
      'O': () => window.app.drawing.tools.selectTool('rectangle'),
      'Shift+S': () => window.app.drawing.tools.selectTool('wand', true),
      'S': () => window.app.drawing.tools.selectTool('select', true),
      'H': () => window.app.drawing.tools.selectTool('hand'),
      'M': () => window.app.drawing.tools.selectTool('move'),
      'Escape': () => window.ui.escapeKey(),
      'Ctrl+D': () => { event.preventDefault(); window.ui.escapeKey(); },
      'Ctrl+G': () => { event.preventDefault(); window.ui.toggleShowGrid(); },
      'Ctrl+Shift+G': () => { event.preventDefault(); window.ui.toggleShowGridPixel(); },
      'Alt+C': window.ui.togglePaletteWindow,
      'Alt+T': () => window.ui.window.toggleLayers(),
      'Alt+R': window.ui.window.toggleReference,
      'Alt+A': window.ui.window.togglePreview,
      // 'Alt+G': () => window.ui.setGridSize(),
      'Alt+G': () => window.ui.window.toggleGridSettings(),
      // 'I': () => window.app.drawing.frame.insertFrame(),
      // 'T': () => window.app.drawing.frame.deleteFrame(),
      'A': () => {
        window.app.drawing.frame.prevFrame();
      //   window.app.layer.list();
      },
      'D': () => {
        window.app.drawing.frame.nextFrame();
      //   window.app.layer.list();
      },
      'Ctrl+0': () => window.ui.resetZoom(),
      'Ctrl+S': () => { event.preventDefault(); window.ui.saveProject(); },
      'Alt+N': () => window.ui.newProject(),
      'Ctrl+Shift+O': () => { event.preventDefault(); window.ui.openProject(); },
      'Ctrl++': () => { event.preventDefault(); window.ui.zoomIn(); },
      'Ctrl+-': () => { event.preventDefault(); window.ui.zoomOut(); },
      'Z': () => window.app.undoManager.undo(),
      'Y': () => window.app.undoManager.redo(),
      'Ctrl+Z': () => { window.app.undoManager.undo(); },
      'Ctrl+Y': () => window.app.undoManager.redo(),
      // 'Delete': () => window.app.drawing.removeSelection(),
      '[': () =>  window.app.drawing.tools.decreaseLineWidth(),
      ']': () =>  window.app.drawing.tools.increaseLineWidth(),
      // timeline
      // 'Ctrl+Shift+M': () => window.app.layer.mergeLayer(),
      'Ctrl+Shift+M': () => window.app.layer.duplicate(),
      'Alt+Shift+N': () => window.app.layer.insertLayer(),
      'Shift+X': () => window.app.layer.toggleVisibility(),
      'Shift+H': () => window.app.drawing.frame.flipHorizontal(),
      'Shift+V': () => window.app.drawing.frame.flipVertical(),
      'R': () => window.app.drawing.tools.selectTool('rotate'),
      'Ctrl+Shift+X': () => {
        let selectionData = null;
        let isRecordHistory = true;
        window.app.drawing.cropToSelection(selectionData, isRecordHistory);
      },
      'Up': () => { window.app.drawing.moveSelection('up') },
      'Down': () => { window.app.drawing.moveSelection('down') },
      'Left': () => { window.app.drawing.moveSelection('left') },
      'Right': () => { window.app.drawing.moveSelection('right') },
  	},
  	
  	keyboardShortcut2: {
      'Alt+Shift+R': window.ui.modal.resizeCanvas,
      'Ctrl+O': (evt) => {
        evt.preventDefault();
        window.ui.toggleRecentProjects();
      },
    },
  	keyboardShortcut3: {
      'Ctrl+A': () => window.app.drawing.tools.utility.select.selectAll(),
    },
    
  };
  
})();