function Frame() {
  
  let frameLength = 1;
  let frames = [];
  let activeFrame = 0;
  let wandSections = [];
  let wandSectionsX = [];
  
  let SELF = {
    activeFrameIndex: 0,
  };
  
  let importedImages = [];
  // let frameWidth = 32;
  // let frameHeight = 32;
  let frameWidth = 16;
  let frameHeight = 16;
  
  let copyPos = {
    x: null,
    y: null,
  };
  let clipBoardContext = createDrawingContext(0,0);
  let clipBoardUndoContext = createDrawingContext(0,0);
  let selectionContext = createDrawingContext(0,0);
  let UIContext = createDrawingContext();
  let selectionUIContext = createDrawingContext();
  let cursorContext = createDrawingContext(1,1);
  cursorContext.fillStyle = '#33333366';
  cursorContext.fillRect(0, 0, 1, 1);
  
  function setFrameLength(length) {
    frameLength = length;
    animator.onframelengthupdated();
  }
  
  function reset() {
    frameLength = 8;
    frames = [];
    activeFrame = 0;
    wandSections = [];
    
    SELF.activeFrameIndex = 0;

    importedImages = [];
    frameWidth = 32;
    frameHeight = 32;
    
    copyPos = {
      x: null,
      y: null,
    };
    clipBoardContext = createDrawingContext(0,0);
    clipBoardUndoContext = createDrawingContext(0,0);
    selectionContext = createDrawingContext(0,0);
    UIContext = createDrawingContext();
    cursorContext = createDrawingContext(1,1);
    cursorContext.fillStyle = '#33333366';
    cursorContext.fillRect(0, 0, 1, 1);
  }
  
  function updateCursor() {
    let lineWidth = app.drawing.tools.isResetLineWidth ? 1 : app.drawing.tools.config.lineWidth;
    cursorContext.canvas.width = lineWidth;
    cursorContext.canvas.height = lineWidth;
    cursorContext.fillStyle = '#33333366';
    cursorContext.fillRect(0, 0, lineWidth, lineWidth);
  }
  
  function clearSelection() {
    selectionContext.canvas.width = 0;
    selectionContext.canvas.height = 0;
  }
  
  function getClipboard() {
    return clipBoardContext.canvas;
  }
  
  function getUndoClipBoard() {
    return clipBoardUndoContext;
  }
  
  function getCanvasSize() {
    return `${frameWidth}x${frameHeight}`;
  }
  
  function clear() {
    getContext().clearRect(0, 0, frameWidth, frameHeight);
  }
  
  function getContext(frameIndex = activeFrame) {
    let frame = app.layer.getFrame(frameIndex);
    if (!frame)
      frame = app.layer.insertKeyFrame(frameIndex);
    return frame;
  }
  
  function toggleHideLayer(id, isStoreHistory = true) {
    let index = getLayerIndex(id);
    let isVisible = frames[activeFrame].layers[index].isVisible;
    frames[activeFrame].layers[index].isVisible = isVisible ? false : true;
    app.drawing.redraw();
    
    if (isStoreHistory) {
      app.undoManager.startRecording({
        type: 'toggle-visibility-layer',
        frameIndex: getFrameIndex(),
        layerId: id,
      }, false);
      app.undoManager.stopRecording();
    }
  }
  
  function cloneCanvas(oldCanvas) {
    var newCanvas = document.createElement('canvas');
    var context = newCanvas.getContext('2d');
    newCanvas.width = oldCanvas.width;
    newCanvas.height = oldCanvas.height;
    context.drawImage(oldCanvas, 0, 0);
    return context;
  }
  
  function getLayerId() {
    return app.layer.activeLayerId;
  }
  
  function getActiveLayerId() {
    return app.layer.activeLayerId;
  }
  
  function setActiveLayer(id) {
    app.drawing.tools.utility.move.dropSelection();
    frames[activeFrame].activeLayer = id;
  }
  
  function exportSingleFrameCanvas(index, config) {
    let c = createDrawingContext();
    let layers = app.layer.layers;
    let activeLayerId = getActiveLayerId();
    
    for (let i=layers.length-1; i>=0; i--) {
      if (!layers[i].isVisible)
        continue;
      if (config.isExportSelectedLayer && layers[i].id != activeLayerId)
        continue;
      let frame = layers[i].frames[index];
      if (frame) {
        c.drawImage(frame.canvas, 0, 0);
      }
    }
    
    return c.canvas;
  }
  
  function exportSingleFrameLayerById(id, exportConfig) {
    let c = createDrawingContext();
    let frameIndex = getFrameIndex();
    
    // setup export canvas
    c.canvas.width = exportConfig.width;
    c.canvas.height = exportConfig.height;
    c.imageSmoothingEnabled = false;
    
    let layer = getLayerById(id);
    if (!layer) return;
    
    let frame = layer.frames[frameIndex];
    if (frame) {
      c.drawImage(frame.canvas, 0, 0, app.drawing.frame.width, app.drawing.frame.height, 0, 0, exportConfig.width, exportConfig.height);
    }
    
    return c.canvas;
  }
  
  function exportActiveFrame(canvas, config) {
    let c = canvas.getContext('2d');
    canvas.width = config.width;
    canvas.height = config.height;
    c.imageSmoothingEnabled = false;
    let frameIndex = getFrameIndex();
    c.drawImage(exportSingleFrameCanvas(frameIndex, config), 0, 0, app.drawing.frame.width, app.drawing.frame.height, 0, 0, config.width, config.height);
    return canvas;
  }
  
  function exportSpritesheet(canvas, config) {
    let c = canvas.getContext('2d');
    canvas.width = parseInt(config.width) * frameLength;
    canvas.height = config.height;
    c.imageSmoothingEnabled = false;
    
    if (config.isReverseAnimation) {
      for (let i=frameLength-1; i>=0; i--) {
        c.drawImage(exportSingleFrameCanvas(i, config), 0, 0,frameWidth, frameHeight, (frameLength-(i+1))*config.width, 0, config.width, config.height);
      }
    } else {
      for (let i=0; i<frameLength; i++) {
        c.drawImage(exportSingleFrameCanvas(i, config), 0, 0,frameWidth, frameHeight, i*config.width, 0, config.width, config.height);
      }
    }
    return canvas;
  }
  
  function generateExportCanvas(config) {
    let canvas = document.createElement('canvas');
    switch (config.frame) {
      case 'single-frame': exportActiveFrame(canvas, config); break;
      case 'spritesheet': exportSpritesheet(canvas, config); break;
    }
    return canvas;
  }
  
  function generateExportLayersCanvas(config) {
    let resultItems = [];
    
    let layers = app.layer.layers;
    for (let layer of layers) {
      if (!layer.isVisible) continue;
      
      let canvas = exportSingleFrameLayerById(layer.id, config);
      resultItems.push({
        fileName: `${layer.name}.png`,
        canvas,
      });
    }
    
    return resultItems;
  }
  
  SELF.getCurrentCanvasCopy = function() {
    let canvas = document.createElement('canvas');
    let config = {
      width: frameWidth,
      height: frameHeight,
      frame: 1,
      isExportSelectedLayer: true,
    };
    exportActiveFrame(canvas, config);
    return canvas;
  };
  
  function getLayerById(id) {
    let index = getLayerIndex(id);
    if (index < 0) return null;
    
    return app.layer.layers[index];
  }
  
  function getLayerIndex(id) {
    if (id === undefined)
      id = getLayerId();
    let index = 0;
    for (let l of app.layer.layers) {
      if (l.id == id) {
        return index;
      }
      index++;
    }
    return -1;
  }
  
  function getUIContext() {
    return UIContext;
  }
  
  function getSelectionUIContext() {
    return selectionUIContext;
  }
  
  function getCursorContext() {
    return cursorContext;
  }
  
  function getFrameIndex() {
    return activeFrame;
  }
  
  function copy() {
    if (app.layer.layers.length === 0)
      return;
    let sel = app.drawing.tools.utility.select.getSelection();
    if (sel.isEmpty)
      return;
    
    // is selection outside
    if (sel.x > app.drawing.frame.width-1 || sel.y > app.drawing.frame.height-1 || sel.x+sel.w <= 0 || sel.y+sel.h <= 0)
      return;
    
    app.clipboard.listenHistoryChange();
    app.clipboard.setMode('copy');
    if (app.drawing.tools.utility.move.isWaitingDrop) {
      let sel = app.drawing.tools.utility.move.getTargetDropPosition();
      let originSelX = sel.x;
      let originSelY = sel.y;
      sel.x = Math.min(frameWidth, Math.max(0, sel.x));
      sel.y = Math.min(frameHeight, Math.max(0, sel.y));
      copyPos.x = sel.x;
      copyPos.y = sel.y;
      app.drawing.tools.utility.move.dropSelection();
      app.drawing.tools.utility.select.clearSelection();
      saveSelection(sel);
      let w = sel.w + Math.min(originSelX, 0);
      let h = sel.h + Math.min(originSelY, 0);
      if (originSelX + sel.w > frameWidth) {
        w = w - (originSelX + sel.w - frameWidth)
      }
      if (originSelY + sel.h > frameHeight) {
        h = h - (originSelY + sel.h - frameHeight)
      }
      clipBoardContext.canvas.width = w;
      clipBoardContext.canvas.height = h;
      clipBoardContext.drawImage(selectionContext.canvas,0,0);
      app.clipboard.disableCache();
    } else {
      let originSelX = sel.x;
      let originSelY = sel.y;
      sel.x = Math.min(frameWidth, Math.max(0, sel.x));
      sel.y = Math.min(frameHeight, Math.max(0, sel.y));
      copyPos.x = sel.x;
      copyPos.y = sel.y;
      saveSelection(sel);
      let w = sel.w + Math.min(originSelX, 0);
      let h = sel.h + Math.min(originSelY, 0);
      if (originSelX + sel.w > frameWidth) {
        w = w - (originSelX + sel.w - frameWidth)
      }
      if (originSelY + sel.h > frameHeight) {
        h = h - (originSelY + sel.h - frameHeight)
      }
      clipBoardContext.canvas.width = w;
      clipBoardContext.canvas.height = h;
      clipBoardContext.drawImage(selectionContext.canvas,0,0);
    }
    
    clipBoardContext.canvas.toBlob(blob => {
      navigator.clipboard.write([new ClipboardItem({'image/png': blob})])
      }
    );
  }
  
  function cut() {
    if (app.layer.layers.length === 0)
      return;
    let sel = app.drawing.tools.utility.select.getSelection();
    if (sel.isEmpty)
      return;

    app.clipboard.listenHistoryChange();
    app.clipboard.setMode('cut');
    if (app.drawing.tools.utility.move.isWaitingDrop) {
      let sel = app.drawing.tools.utility.move.getTargetDropPosition();
      let originSelX = sel.x;
      let originSelY = sel.y;
      sel.x = Math.min(frameWidth, Math.max(0, sel.x));
      sel.y = Math.min(frameHeight, Math.max(0, sel.y));
      copyPos.x = sel.x;
      copyPos.y = sel.y;
      app.drawing.tools.utility.move.dropSelection();
      saveSelection(sel);
      let w = sel.w + Math.min(originSelX, 0);
      let h = sel.h + Math.min(originSelY, 0);
      if (originSelX + sel.w > frameWidth) {
        w = w - (originSelX + sel.w - frameWidth)
      }
      if (originSelY + sel.h > frameHeight) {
        h = h - (originSelY + sel.h - frameHeight)
      }
      clipBoardContext.canvas.width = w;
      clipBoardContext.canvas.height = h;
      sel.w = w;
      sel.h = h;
      clipBoardContext.drawImage(selectionContext.canvas,0,0);
      app.drawing.tools.utility.select.setSelection(sel);
      app.drawing.removeSelection();
      app.drawing.tools.utility.select.setSelection(sel);
      app.drawing.redraw();
      app.clipboard.disableCache();
    } else {
      let originSelX = sel.x;
      let originSelY = sel.y;
      sel.x = Math.min(frameWidth, Math.max(0, sel.x));
      sel.y = Math.min(frameHeight, Math.max(0, sel.y));
      copyPos.x = sel.x;
      copyPos.y = sel.y;
      saveSelection(sel);
      let w = sel.w + Math.min(originSelX, 0);
      let h = sel.h + Math.min(originSelY, 0);
      if (originSelX + sel.w > frameWidth) {
        w = w - (originSelX + sel.w - frameWidth)
      }
      if (originSelY + sel.h > frameHeight) {
        h = h - (originSelY + sel.h - frameHeight)
      }
      clipBoardContext.canvas.width = w;
      clipBoardContext.canvas.height = h;
      sel.w = w;
      sel.h = h;
      clipBoardContext.drawImage(selectionContext.canvas,0,0);
      app.drawing.removeSelection();
      app.drawing.tools.utility.select.setSelection(sel);
      app.drawing.redraw();
    }
    animator.onframeupdate(app.drawing.frame.getFrameIndex());
  }
  
  function flipHorizontal() {
    if (app.layer.layers.length === 0)
      return;
    let sel = app.drawing.tools.utility.select.getSelection();
    if (sel.isEmpty) {
      // to do - flip whole canvas
      app.drawing.tools.utility.select.selectAll()
      sel = app.drawing.tools.utility.select.getSelection();
      // return;
    }
    
    let isWaitingDrop = app.drawing.tools.utility.move.isWaitingDrop;
    if (isWaitingDrop) {
      let c = createDrawingContext(selectionContext.canvas.width, selectionContext.canvas.height);
      c.translate(sel.w, 0);
      c.scale(-1, 1);
      c.drawImage(selectionContext.canvas, 0, 0);
      selectionContext.clearRect(0,0,c.canvas.width,c.canvas.height);
      selectionContext.drawImage(c.canvas,0,0);  
      let layer = app.drawing.frame.getSelectionLayer();
      app.drawing.clearUI();
      let dropPos = app.drawing.tools.utility.move.getTargetDropPosition();
      app.drawing.UIContext.drawImage(layer, dropPos.x, dropPos.y);
      app.drawing.tools.utility.move.flipHorizontal();
      app.drawing.redraw();
      return;
    }
      
    app.undoManager.startRecording({
      type: 'flip-horizontal',
      frameIndex: getFrameIndex(),
      layerId: getLayerId(),
      data: {
        sel,
        selectionMode: app.drawing.tools.selectionMode,
        wandSections: JSON.parse(JSON.stringify(app.drawing.frame.wandSections)),
      }
    });
    let isTakeSnapshot = true;
    let historyPointerDecrement = -2;
    app.undoManager.stopRecording(isTakeSnapshot, historyPointerDecrement);
    
    saveSelection(sel);
    let c = createDrawingContext(selectionContext.canvas.width, selectionContext.canvas.height);
    c.translate(sel.w, 0);
    c.scale(-1, 1);
    c.drawImage(selectionContext.canvas, 0, 0);
    selectionContext.clearRect(0,0,c.canvas.width,c.canvas.height);
    selectionContext.drawImage(c.canvas,0,0);
    let isRecordHistory = false;
    
    removeSelection(sel, app.drawing.tools.selectionMode);
    app.drawing.context.drawImage(selectionContext.canvas, sel.x, sel.y);
    app.drawing.tools.utility.select.setSelection(sel);
    
    // draw wand selection overlay    
    if (app.drawing.tools.selectionMode == 'wand') {
      for (let i=0; i<wandSections.length; i++) {
        wandSections[i].x = sel.x + sel.w - (wandSections[i].x - sel.x) - 1;
      }
      app.drawing.clearUI();
      app.drawing.UIContext.fillStyle = '#94bde099';
      for (let i=0; i<wandSections.length; i++) {
        app.drawing.UIContext.fillRect(wandSections[i].x, wandSections[i].y, 1, wandSections[i].h);
      }
    }
    
    app.drawing.redraw();
    animator.onframeupdate(app.drawing.frame.getFrameIndex());
    app.drawing.tools.selectTool('move', false);
  }
  
  function flipVertical() {
    if (app.layer.layers.length === 0)
      return;
    let sel = app.drawing.tools.utility.select.getSelection();
    if (sel.isEmpty) {
      app.drawing.tools.utility.select.selectAll();
      sel = app.drawing.tools.utility.select.getSelection();
      // to do - flip whole canvas
      // return;
    }
    
    if (app.drawing.tools.utility.move.isWaitingDrop) {
      let c = createDrawingContext(selectionContext.canvas.width, selectionContext.canvas.height);
      c.translate(0, sel.h);
      c.scale(1, -1);
      c.drawImage(selectionContext.canvas, 0, 0);
      selectionContext.clearRect(0,0,c.canvas.width,c.canvas.height);
      selectionContext.drawImage(c.canvas,0,0);  
      let layer = app.drawing.frame.getSelectionLayer();
      app.drawing.clearUI();
      let dropPos = app.drawing.tools.utility.move.getTargetDropPosition();
      app.drawing.UIContext.drawImage(layer, dropPos.x, dropPos.y);
      app.drawing.tools.utility.move.flipVertical();
      app.drawing.redraw();
      return;
    }
    
    app.undoManager.startRecording({
      type: 'flip-vertical',
      frameIndex: getFrameIndex(),
      layerId: getLayerId(),
      data: {
        sel,
        selectionMode: app.drawing.tools.selectionMode,
        wandSections: JSON.parse(JSON.stringify(app.drawing.frame.wandSections)),
      }
    });
    let isTakeSnapshot = true;
    let historyPointerDecrement = -2;
    app.undoManager.stopRecording(isTakeSnapshot, historyPointerDecrement);
    
    saveSelection(sel);
    let c = createDrawingContext(selectionContext.canvas.width, selectionContext.canvas.height);
    c.scale(1, -1);
    c.drawImage(selectionContext.canvas, 0, -sel.h);
    selectionContext.clearRect(0,0,c.canvas.width,c.canvas.height);
    selectionContext.drawImage(c.canvas,0,0);
    let isRecordHistory = false;
    
    removeSelection(sel, app.drawing.tools.selectionMode);
    app.drawing.context.drawImage(selectionContext.canvas, sel.x, sel.y);
    app.drawing.tools.utility.select.setSelection(sel);
    
    // draw wand selection overlay    
    if (app.drawing.tools.selectionMode == 'wand') {
      for (let i=0; i<wandSections.length; i++) {
        wandSections[i].y = sel.y + sel.h - (wandSections[i].y - sel.y) - 1;
      }
      app.drawing.clearUI();
      app.drawing.UIContext.fillStyle = '#94bde099';
      for (let i=0; i<wandSections.length; i++) {
        app.drawing.UIContext.fillRect(wandSections[i].x, wandSections[i].y, 1, wandSections[i].h);
      }
    }
    
    app.drawing.redraw();
    animator.onframeupdate(app.drawing.frame.getFrameIndex());
    app.drawing.tools.selectTool('move', false);
  }
  
  function undoFlipHorizontal(data) {
    let sel = data.sel;
    app.drawing.tools.utility.select.setSelection(sel);
    if (data.wandSections.length > 0) {
      wandSections = JSON.parse(JSON.stringify(data.wandSections));
      app.drawing.tools.utility.select.setSelection(sel)
      drawWandSelection(sel)
    } else {
      saveSelection(sel, data.selectionMode);
    }
    let c = createDrawingContext(selectionContext.canvas.width, selectionContext.canvas.height);
    c.translate(sel.w, 0);
    c.scale(-1, 1);
    c.drawImage(selectionContext.canvas, 0, 0);
    selectionContext.clearRect(0,0,c.canvas.width,c.canvas.height);
    selectionContext.drawImage(c.canvas,0,0);
    removeSelection(sel, data.selectionMode);
    app.drawing.context.drawImage(selectionContext.canvas, sel.x, sel.y);
    app.drawing.tools.utility.select.setSelection(sel);
    app.drawing.redraw();
    animator.onframeupdate(app.drawing.frame.getFrameIndex());
  }
  
  function redoFlipHorizontal(data) {
    let sel = data.sel;
    app.drawing.tools.utility.select.setSelection(sel);
    if (data.wandSections.length > 0) {
      wandSections = JSON.parse(JSON.stringify(data.wandSections));
      app.drawing.tools.utility.select.setSelection(sel)
      drawWandSelection(sel)
    } else {
      saveSelection(sel, data.selectionMode);
    }
    let c = createDrawingContext(selectionContext.canvas.width, selectionContext.canvas.height);
    c.translate(sel.w, 0);
    c.scale(-1, 1);
    c.drawImage(selectionContext.canvas, 0, 0);
    selectionContext.clearRect(0,0,c.canvas.width,c.canvas.height);
    selectionContext.drawImage(c.canvas,0,0);
    removeSelection(sel, data.selectionMode);
    app.drawing.context.drawImage(selectionContext.canvas, sel.x, sel.y);
    app.drawing.tools.utility.select.setSelection(sel);
    
    for (let j of wandSections) {
      j.x = sel.x + sel.w - (j.x - sel.x) - 1;
    }
    
    app.drawing.redraw();
    animator.onframeupdate(app.drawing.frame.getFrameIndex());
  }
  
  function undoFlipVertical(data) {
    let sel = data.sel;
    app.drawing.tools.utility.select.setSelection(sel);
    if (data.wandSections.length > 0) {
      wandSections = data.wandSections;
      app.drawing.tools.utility.select.setSelection(sel)
      drawWandSelection(sel)
    } else {
      saveSelection(sel, data.selectionMode);
    }
    let c = createDrawingContext(selectionContext.canvas.width, selectionContext.canvas.height);
    // c.translate(sel.w, 0);
    c.scale(1, -1);
    c.drawImage(selectionContext.canvas, 0, -sel.h);
    selectionContext.clearRect(0,0,c.canvas.width,c.canvas.height);
    selectionContext.drawImage(c.canvas,0,0);
    let isRecordHistory = false;
    app.drawing.removeSelection(isRecordHistory, data.selectionMode);
    app.drawing.context.drawImage(selectionContext.canvas, sel.x, sel.y);
    app.drawing.tools.utility.select.setSelection(sel);
    app.drawing.redraw();
    animator.onframeupdate(app.drawing.frame.getFrameIndex());
  }
  
  function redoFlipVertical(data) {
    let sel = data.sel;
    app.drawing.tools.utility.select.setSelection(sel);
    if (data.wandSections.length > 0) {
      wandSections = JSON.parse(JSON.stringify(data.wandSections));
      app.drawing.tools.utility.select.setSelection(sel)
      drawWandSelection(sel)
    } else {
      saveSelection(sel, data.selectionMode);
    }
    let c = createDrawingContext(selectionContext.canvas.width, selectionContext.canvas.height);
    c.scale(1, -1);
    c.drawImage(selectionContext.canvas, 0, -sel.h);
    selectionContext.clearRect(0,0,c.canvas.width,c.canvas.height);
    selectionContext.drawImage(c.canvas,0,0);
    removeSelection(sel, data.selectionMode);
    app.drawing.context.drawImage(selectionContext.canvas, sel.x, sel.y);
    app.drawing.tools.utility.select.setSelection(sel);
    
    for (let j of wandSections) {
      j.y = sel.y + sel.h - (j.y - sel.y) - 1;
    }
    
    app.drawing.redraw();
    animator.onframeupdate(app.drawing.frame.getFrameIndex());
  }
  
  function removeSelection(sel, selectionMode) {
    if (sel.isEmpty)
      return;
    if (selectionMode == 'wand') {
      for (let i=0; i<wandSections.length; i++) {
        getContext().clearRect(wandSections[i].x, wandSections[i].y, 1, wandSections[i].h);
      }
    } else if (selectionMode == 'rectangular') {
      getContext().clearRect(sel.x, sel.y, sel.w, sel.h);
    }
    
    // tools.utility.select.clearSelection();
    // clearUI();
  }
  
  function paste() {
    if (app.layer.layers.length === 0)
      return;
    let clipBoard = clipBoardContext.canvas;
    if (clipBoard.width == 0 || clipBoard.height == 0)
      return;
    
    app.clipboard.unlistenHistoryChange();
    
    selectionContext.canvas.width = clipBoard.width;
    selectionContext.canvas.height = clipBoard.height;
    
    selectionContext.clearRect(0,0,selectionContext.canvas.width,selectionContext.canvas.height);
    selectionContext.drawImage(clipBoard,0,0);
    
    let sel = app.drawing.tools.utility.select.getSelection();
    let pasteX = copyPos.x;
    let pasteY = copyPos.y;

    if (clipBoard.width > frameWidth || clipBoard.height > frameHeight) {
      ui.confirm('Clipboard image resolution is bigger than canvas resolution. Resize canvas?', 'Confirm', 'Keep Size').then(isOK => {
        if (isOK) {
          app.drawing.resizeCanvas(Math.max(clipBoard.width, frameWidth), Math.max(clipBoard.height, frameHeight), true);
          pasteX = 0;
          pasteY = 0;
        }
        if (app.drawing.tools.utility.move.isWaitingDrop)
          app.drawing.tools.utility.move.dropSelection();
        
        app.drawing.tools.utility.select.clearSelection();
        
        // reposition paste location
        if (clipBoard.width > frameWidth) {
          pasteX = 0;
        } else {
          if (pasteX > frameWidth) {
            pasteX = Math.max(0, frameWidth - clipBoard.width);
          }
        }
        if (clipBoard.height > frameHeight) {
          pasteY = 0;
        } else {
          if (pasteY > frameHeight) {
            pasteY = Math.max(0, frameHeight - clipBoard.height);
          }
        }
      
        app.drawing.tools.utility.select.setSelection({
          x: pasteX, 
          y: pasteY, 
          w: clipBoard.width, 
          h: clipBoard.height,
        });
        
        app.drawing.tools.utility.move.dragCopy(pasteX, pasteY, clipBoard.width, clipBoard.height);
        app.drawing.tools.selectTool('move', false);
        app.drawing.redraw();
      });
    } else {
      if (app.drawing.tools.utility.move.isWaitingDrop)
        app.drawing.tools.utility.move.dropSelection();
      
      app.drawing.tools.utility.select.clearSelection();
      
      if (pasteX > frameWidth) {
        pasteX = Math.max(0, frameWidth - clipBoard.width);
      }
      if (pasteY > frameHeight) {
        pasteY = Math.max(0, frameHeight - clipBoard.height);
      }
      
      app.drawing.tools.utility.select.setSelection({
        x: pasteX, 
        y: pasteY, 
        w: clipBoard.width, 
        h: clipBoard.height,
      });
      
      app.drawing.tools.utility.move.dragCopy(pasteX, pasteY, clipBoard.width, clipBoard.height);
      app.drawing.tools.selectTool('move', false);
      app.drawing.redraw();
    }

  }
  
  function createDrawingContext(width = frameWidth, height = frameHeight) {
    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext('2d');
    return ctx;
  }
  
  function insertKeyFrame(frameIndex = frames.length) {
    let uid = generateUID();
    let frame = {
      activeLayer: uid,
      layers: [
        {
          name: 'Base',
          id: uid,
          c: createDrawingContext(),
          isVisible: true,
        },
      ],
    };
    frames.splice(frameIndex, 0, frame);
    // let layerId = generateLayerId();
    // let layerId = generateUID();
    // frame.activeLayer = layerId;
    // frame.layers[0].id = layerId;
  }
  
  function goToFrame(index) {
    activeFrame = index;
    // ui.layer.updateFrameLabel(index);
  }
  
  function goToLayer(id) {
    // frames[activeFrame].activeLayer = id;
    app.layer.activeLayerId = id;
    app.layer.activeLayerIndex = app.layer.getLayerIndexById(id);
  }
  
  function nextFrame() {
    app.drawing.tools.utility.move.dropSelection();

    if (activeFrame+1 >= frameLength)
      return
      
    activeFrame++;
    
    // if (frames[activeFrame] === undefined) {
    //   insertKeyFrame(activeFrame);
    // }
    app.drawing.redraw();
    ui.layer.highlightFrame(activeFrame);
    // DOM.frame.value = activeFrame + 1;
    // ui.layer.updateFrameLabel(activeFrame);
  }
  
  function prevFrame() {
    if (activeFrame-1 < 0) return;
    app.drawing.tools.utility.move.dropSelection();
    
    activeFrame--;
    app.drawing.redraw();
    ui.layer.highlightFrame(activeFrame);
    // DOM.frame.value = activeFrame + 1;
    // ui.layer.updateFrameLabel(activeFrame);
  }
  
  function saveSelection(sel, selectionMode = app.drawing.tools.selectionMode) {
    if (selectionMode == 'wand') {
      // setWandSections();
      app.drawing.tools.utility.select.setSelection({
        x: selx,
        y: sely,
        w: selw+1,
        h: selh+1,
      })
      drawWandSelection(sel)
    } else if (selectionMode == 'rectangular') {
      selectionContext.canvas.width = sel.w;
      selectionContext.canvas.height = sel.h;
      selectionContext.drawImage(getContext().canvas, sel.x, sel.y, sel.w, sel.h, 0, 0, sel.w, sel.h);
    }
  }
  
  function setWandSections() {
    wandSections.length = 0
    for (let i=0; i<marker.length; i++) {
      let x = marker[i].x;
      let y = marker[i].y;
      let h = 1;
      let j = i+1;
      while (j < marker.length && marker[j].x == x) {
        if (marker[j].y == y+h) {
          h++;
          j++;
        } else {
          break;
        }
      }
      i = j-1;
      wandSections.push({x,y,h});
    }
  }
  
  function drawWandSelection(sel) {
    let canvas = getContext().canvas;
    selectionContext.canvas.width = sel.w+1;
    selectionContext.canvas.height = sel.h+1;
    for (let i=0; i<wandSections.length; i++) {
      selectionContext.drawImage(canvas, wandSections[i].x, wandSections[i].y, 1, wandSections[i].h, wandSections[i].x-sel.x, wandSections[i].y-sel.y, 1, wandSections[i].h);
    }
  }
  
  function getSelectionLayer() {
    return selectionContext.canvas;
  }
  
  function getKeyFrame(frameIndex = activeFrame) {
    return frames[frameIndex];
  }
  
  function fromImage(img) {
    let importedImg = img;
    
    if (img.width > frameWidth || img.height > frameHeight) {
      ui.confirm('Imported image resolution is bigger than canvas resolution. Resize canvas?', 'Confirm', 'Keep Size').then(isOK => {
        if (isOK) {
          app.drawing.resizeCanvas(Math.max(img.width, frameWidth), Math.max(img.height, frameHeight), true);
        } else {
          let ctx = createDrawingContext();
          ctx.drawImage(img,0,0);
          importedImg = ctx.canvas;
        }
        app.drawing.tools.utility.move.dropSelection();
        let frameIndex = getFrameIndex();
        app.undoManager.startRecording({
          type: 'import',
          frameIndex: frameIndex,
          layerId: getLayerId(),
          imgIndex: importedImages.length,
        });
        app.undoManager.stopRecording();
        importedImages.push(importedImg);
        
        let c = getContext();
        c.drawImage(importedImg, 0, 0);
    
        app.drawing.redraw();
      });
    } else {
      app.drawing.tools.utility.move.dropSelection();
      let frameIndex = getFrameIndex();
      app.undoManager.startRecording({
        type: 'import',
        frameIndex: frameIndex,
        layerId: getLayerId(),
        imgIndex: importedImages.length,
      });
      app.undoManager.stopRecording();
      importedImages.push(importedImg);
      
      let c = getContext();
      c.drawImage(importedImg, 0, 0);
  
      app.drawing.redraw();
    }
    
  }
  
  function removeKeyFrame(frameIndex, isStoreHistory = true) {
    if (frames.length === 1 || frameIndex === 0) {
      alert('Not allowed to delete last frame.');
      return;
    }
      
    let deletedLayerId = getLayerId();
    let deletedFrame = frames.splice(frameIndex, 1)[0];
    let targetFrameIndex = Math.min(frames.length-1, frameIndex);
    // history handler
    if (isStoreHistory) {
      app.undoManager.deletedFrames.push({
        frame: deletedFrame,
        popIndex: frameIndex,
      });
      app.undoManager.startRecording({
        type: 'delete-frame',
        frameIndex,
        layerId: deletedLayerId,
        data: {
          targetFrameIndex,
          popIndex: frameIndex,
        }
      }, false);
      app.undoManager.stopRecording();
    }
    // end of history handler
  
    goToFrame(targetFrameIndex);
    goToLayer(deletedFrame.activeLayer);
      
    // if (frames.length === 0) {
    //   insertKeyFrame();
    //   activeFrame = 0;
    // }
    
  }
  
  function insertFrame() {
    insertKeyFrame(activeFrame);
    drawing.redraw();
  }
  
  function deleteFrame() {
    removeKeyFrame(activeFrame);
    app.drawing.redraw();
    ui.layer.updateFrameLabel(activeFrame);
  }
  
  let self = {
    activeFrameIndex: SELF.activeFrameIndex,
    fromImage,
    getContext,
    getUIContext,
    getSelectionUIContext,
    clear,
    copy,
    cut,
    paste,
    goToFrame,
    goToLayer,
    getCanvasSize,
    getClipboard,
    clearSelection,
    getCursorContext,
    getFrameIndex,
    insertKeyFrame,
    getUndoClipBoard,
    getLayerId,
    nextFrame,
    getKeyFrame,
    prevFrame,
    saveSelection,
    getSelectionLayer,
    createDrawingContext,
    getLayerIndex,
    // exportCanvas,
    generateExportCanvas,
    generateExportLayersCanvas,
    insertFrame,
    deleteFrame,
    
    setActiveLayer,
    toggleHideLayer,
    updateCursor,
    drawWandSelection,
    removeKeyFrame,
    setFrameLength,
    reset,
    setWandSections,
    
    flipVertical,
    flipHorizontal,
    undoFlipVertical,
    undoFlipHorizontal,
    redoFlipVertical,
    redoFlipHorizontal,
  };
  
  for (let key in self) {
    SELF[key] = self[key];
  }
  
  Object.defineProperty(SELF, 'importedImages', { get: () => importedImages });
  Object.defineProperty(SELF, 'width', { get: () => frameWidth, set: w => frameWidth = w });
  Object.defineProperty(SELF, 'height', { get: () => frameHeight, set: w => frameHeight = w });
  Object.defineProperty(SELF, 'frames', { get: () => frames });
  Object.defineProperty(SELF, 'copyPos', { get: () => copyPos });
  Object.defineProperty(SELF, 'frameLength', { get: () => frameLength });
  Object.defineProperty(SELF, 'wandSections', { get: () => wandSections, set: _ => wandSections = _ });
  Object.defineProperty(SELF, 'wandSectionsX', { get: () => wandSectionsX, set: _ => wandSectionsX = _ });
  
  return SELF;
}