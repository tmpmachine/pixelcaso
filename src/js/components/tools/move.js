function Move() {
  
  let _ = {
    isFlipHorizontal: false,
    isFlipVertical: false,
  };
  let SELF = {};
  let isDrag = false;
  let isWaitingDrop = false;
  let isCopy = false;
  let dX2 = 0;
  let dY2 = 0;
  let dSX = 0;
  let dSY = 0;
  let selectOriginX = 0;
  let selectOriginY = 0;
  let dropX = 0;
  let dropY = 0;
  let selectionW = 0;
  let selectionH = 0;
  let dropOffsetX = 0;
  
  function dragCopy(x,y,w,h) {
    isCopy = true;
    isWaitingDrop = true;
    dSX = x;
    dSY = y;
    dropX = 0;
    dropY = 0;
    selectionW = w;
    selectionH = h;
    draw();
  }
  let isLockedX = false;
  let isLockedY = false;
  let lockedX, lockedY;
  
  function handleSelection(action) {
    switch (action) {
      case 'start':
        let selection = app.drawing.tools.utility.select.getSelection();
        if (selection.isEmpty)
          return;
        // if (selection.selectionStart.x == selection.selectionEnd.x && selection.selectionStart.y == selection.selectionEnd.y)
          // return;
        isDrag = true;
        if (isWaitingDrop) {
          dSX = dSX+dropX;
          dSY = dSY+dropY;
        } else {
          isWaitingDrop = true;
          app.drawing.frame.saveSelection(selection);
          selectOriginX = Math.min(selection.selectionStart.x, selection.selectionEnd.x);
          selectOriginY = Math.min(selection.selectionStart.y, selection.selectionEnd.y);
          dSX = selectOriginX;
          dSY = selectOriginY;
          selectionW = Math.max(selection.selectionStart.x, selection.selectionEnd.x) - Math.min(selection.selectionStart.x, selection.selectionEnd.x)+1;
          selectionH = Math.max(selection.selectionStart.y, selection.selectionEnd.y) - Math.min(selection.selectionStart.y, selection.selectionEnd.y)+1;
          
          // clear wand/rectangular selection
          if (app.drawing.tools.selectionMode == 'wand') {
            let wandSections = app.drawing.frame.wandSections;
            for (let i=0; i<wandSections.length; i++) {
              app.drawing.context.clearRect(wandSections[i].x, wandSections[i].y, 1, wandSections[i].h);
            }
          } else if (app.drawing.tools.selectionMode == 'rectangular') {
            app.drawing.context.clearRect(dSX, dSY, selectionW, selectionH);
          }
        }
        
        let cursor = app.drawing.getRelativeCursor();
        dX2 = cursor.x;
        dY2 = cursor.y;
        dropX = 0;
        dropY = 0;
        draw();
        app.drawing.tools.lock();
        
        isLockedX = false;
        isLockedY = false;
        break;
      case 'move':
        if (isDrag) {
          let cursor = app.drawing.getRelativeCursor();
          if (isLockedX)
            dropX = lockedX;
          else
            dropX = cursor.x - dX2;
          
          if (isLockedY)
            dropY = lockedY;
          else
            dropY = cursor.y - dY2;
          
          if (pressedKeys.shiftKey || pressedKeys.altKey) {
            if (!(isLockedX || isLockedY)) {
              if (pressedKeys.altKey) {
                isLockedX = true;
                lockedX = dropX;
              } else if (pressedKeys.shiftKey) {
                isLockedY = true;
                lockedY = dropY;
              }
            }
          } else {
            isLockedX = false;
            isLockedY = false;
          }
          draw();
        }
        break;
      case 'end':
        if (isDrag) {
          isLockedX = false;
          isLockedY = false;
          app.drawing.tools.unlock();
          onLeave();
          app.drawing.redraw();
        }
        break;
    }
  }
  
  function record(cursor) {
    let lastAction = app.undoManager.getLastAction();
    if (lastAction) {
      if (lastAction.cursor.x != cursor.x || lastAction.cursor.y != cursor.y) {
        app.undoManager.record({
          cursor: Object.assign({}, cursor),
        });
      }
    } else {
      app.undoManager.record({
        cursor: Object.assign({}, cursor),
      });
    }
  }
  
  function draw() {
    app.drawing.clearUI();
    let layer = app.drawing.frame.getSelectionLayer();
    let x = dSX+dropX;
    let y = dSY+dropY;
    app.drawing.UIContext.drawImage(layer, x, y);
  }
  
  function getTargetDropPosition() {
    return {
      x: dSX+dropX,
      y: dSY+dropY,
      w: selectionW,
      h: selectionH,
    };
  }
  
  function dropSelection() {
    if (!isWaitingDrop) {
      app.drawing.tools.utility.select.clearSelection();
      app.drawing.redraw();
      return;
    }
    let dropData = {
      isFlipHorizontal: _.isFlipHorizontal,
      isFlipVertical: _.isFlipVertical,
      selection: {
        x: selectOriginX,
        y: selectOriginY,
        w: selectionW,
        h: selectionH,
      },
      wandSections: null,
      drop: {
        x: dSX+dropX, 
        y: dSY+dropY,
      },
      selectionMode: app.drawing.tools.selectionMode,
    };
    if (app.drawing.tools.selectionMode == 'wand') {
      dropData.wandSections = JSON.parse(JSON.stringify(app.drawing.frame.wandSections));
    }
    
    let layer = app.drawing.frame.getSelectionLayer();
    app.drawing.recordAction();
    if (isCopy) {
      isCopy = false;
      let clipboardIndex = app.clipboard.store();
        app.undoManager.record(Object.assign({
          type: 'copy-from-clipboard',
          clipboardIndex,
        }, dropData));
    } else {
      
      // clear wand/rectangular selection
      if (app.drawing.tools.selectionMode == 'wand') {
        let wandSections = app.drawing.frame.wandSections;
        for (let i=0; i<wandSections.length; i++) {
          app.drawing.context.clearRect(wandSections[i].x, wandSections[i].y, 1, wandSections[i].h);
        }
      } else if (app.drawing.tools.selectionMode == 'rectangular') {      
        app.drawing.context.clearRect(selectOriginX, selectOriginY, selectionW, selectionH);
      }
      
      app.undoManager.record(Object.assign({
        type: 'move',
      }, dropData));
    }
    app.drawing.context.drawImage(layer, dropData.drop.x, dropData.drop.y);
    isWaitingDrop = false;
    _.isFlipHorizontal = false;
    _.isFlipVertical = false;
    app.drawing.tools.utility.select.clearSelection();
    app.drawing.redraw();
    animator.onframeupdate(app.drawing.frame.getFrameIndex());
    app.undoManager.stopRecording();
  }
  
  function dropSelectionUndo(data) {
    app.drawing.tools.utility.select.setSelection(data.selection);
    let sel = app.drawing.tools.utility.select.getSelection();
    if (data.selectionMode == 'wand') {
      app.drawing.frame.wandSections = JSON.parse(JSON.stringify(data.wandSections));
      app.drawing.frame.drawWandSelection(sel);
    } else if (data.selectionMode == 'rectangular') {
      app.drawing.frame.saveSelection(sel, data.selectionMode);
    }
    
    let layer = app.drawing.frame.getSelectionLayer();
    
    if (data.selectionMode == 'wand') {
      // clear wand selection
      // let wandSections = app.drawing.frame.wandSections;
      let wandSections = app.drawing.frame.wandSections;
      for (let i=0; i<wandSections.length; i++) {
        app.drawing.context.clearRect(wandSections[i].x, wandSections[i].y, 1, wandSections[i].h);
      }
    } else if (data.selectionMode == 'rectangular') {      
      // clear rectangular selection
      app.drawing.context.clearRect(data.selection.x, data.selection.y, data.selection.w, data.selection.h);
    }
    
    app.drawing.context.drawImage(layer, data.drop.x, data.drop.y);
    app.drawing.tools.utility.select.clearSelection();
    app.drawing.redraw();
  }
  
  function flipHorizontal(canvas) {
   let c = app.drawing.frame.createDrawingContext(canvas.width, canvas.height);
    c.translate(canvas.width, 0);
    c.scale(-1, 1);
    c.drawImage(canvas, 0, 0);
    return c.canvas;
  }
  
  function flipVertical(canvas) {
   let c = app.drawing.frame.createDrawingContext(canvas.width, canvas.height);
    c.translate(0, canvas.height);
    c.scale(1, -1);
    c.drawImage(canvas, 0, 0);
    return c.canvas;
  }
  
  function dropSelectionUndoPasteClipboard(data) {
    let canvas = app.clipboard.get(data.clipboardIndex);
    if (data.isFlipHorizontal)
      canvas = flipHorizontal(canvas);
    else if (data.isFlipVertical)
      canvas = flipVertical(canvas);
    app.drawing.context.drawImage(canvas, data.drop.x, data.drop.y);
    app.drawing.redraw();
  }
  
  function onLeave() {
    isDrag = false;
  }
  
  function undoMove(data) {
    switch (data[0].type) {
      case 'copy-from-clipboard':
        dropSelectionUndoPasteClipboard(data[0]);
        break;
      case 'move':
        dropSelectionUndo(data[0]);
        break;
    }
  }
  
  function undo() {
    if (isCopy) {
      isCopy = false;
    } else {
      let layer = app.drawing.frame.getSelectionLayer();
      app.drawing.context.drawImage(layer, selectOriginX, selectOriginY);
    }
    
    isWaitingDrop = false;
    isDrag = false;
    app.drawing.tools.utility.select.clearSelection();
    app.drawing.clearUI();
    app.drawing.redraw();
  }
  
  SELF.flipHorizontal = function() {
    _.isFlipHorizontal = !_.isFlipHorizontal; 
  }
  
  SELF.flipVertical = function() {
    _.isFlipVertical = !_.isFlipVertical; 
  }
  
  
  SELF.movePerPixel = function(direction) {
    if (isDrag)
      return;
    if (!isWaitingDrop) {
      triggerDragStart();
    }
    switch (direction) {
      case 'up': dropY = dropY - 1; break;
      case 'down': dropY = dropY + 1; break;
      case 'left': dropX = dropX - 1; break;
      case 'right': dropX = dropX + 1; break;
    }
    draw();
    app.drawing.redraw();
  }
  
  function triggerDragStart() {
    let selection = app.drawing.tools.utility.select.getSelection();
    isWaitingDrop = true;
    app.drawing.frame.saveSelection(selection);
    selectOriginX = Math.min(selection.selectionStart.x, selection.selectionEnd.x);
    selectOriginY = Math.min(selection.selectionStart.y, selection.selectionEnd.y);
    dSX = selectOriginX;
    dSY = selectOriginY;
    selectionW = Math.max(selection.selectionStart.x, selection.selectionEnd.x) - Math.min(selection.selectionStart.x, selection.selectionEnd.x)+1;
    selectionH = Math.max(selection.selectionStart.y, selection.selectionEnd.y) - Math.min(selection.selectionStart.y, selection.selectionEnd.y)+1;
    
    // clear wand/rectangular selection
    if (app.drawing.tools.selectionMode == 'wand') {
      let wandSections = app.drawing.frame.wandSections;
      for (let i=0; i<wandSections.length; i++) {
        app.drawing.context.clearRect(wandSections[i].x, wandSections[i].y, 1, wandSections[i].h);
      }
    } else if (app.drawing.tools.selectionMode == 'rectangular') {
      app.drawing.context.clearRect(dSX, dSY, selectionW, selectionH);
    }
    dropX = 0;
    dropY = 0;
  }
  
  let self = {
    undo,
    dragCopy,
    handleSelection,
    dropSelection,
    onLeave,
    getTargetDropPosition,
    undoMove,
    flipHorizontal: SELF.flipHorizontal,
    flipVertical: SELF.flipVertical,
    movePerPixel: SELF.movePerPixel,
  };
  
  Object.defineProperty(self, 'isWaitingDrop', {
    get: () => isWaitingDrop,
  });
  Object.defineProperty(self, 'isDrag', {
    get: () => isDrag,
  });
    
  return self;
}