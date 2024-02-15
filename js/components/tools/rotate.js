function Rotate() {
  
  let SELF = {};
  let isDrag = false;
  let centerRotateX, centerRotateY;
  let tempCanvas = document.createElement('canvas');
  let c = tempCanvas.getContext('2d');
  let selC;
  let tempSize;
  let selX, selY, selW, selH;
  let startRad, lastRad;
  let firstRad;
  let isWaitingDrop = false;
  let _radians = 0;
  
  SELF.handleMovement = function(action) {
    switch (action) {
      case 'start':
        let sel = app.drawing.tools.utility.select.getSelection();
        if (sel.isEmpty)
          return;
          
        isDrag = true;
        if (isWaitingDrop) {
          let cursor = app.drawing.getRelativeCursor();
          firstRad = Math.atan2(cursor.y - centerRotateY, cursor.x - centerRotateX);
          return;
        }
        isWaitingDrop = true;
        
        let cursor = app.drawing.getRelativeCursor();
        
        selX = sel.x;
        selY  = sel.y;
        selW = sel.w;
        selH = sel.h;
        let centerX = Math.floor(sel.w/2);
        let centerY = Math.floor(sel.h/2);
        centerRotateX = sel.x+Math.floor(sel.w/2);
        centerRotateY = sel.y+Math.floor(sel.h/2);
        
        app.drawing.frame.saveSelection(sel);
        selC = app.drawing.frame.getSelectionLayer().getContext('2d');
        tempSize = Math.max(sel.w,sel.h) * 2;
        tempCanvas.width =  tempSize;
        tempCanvas.height = tempCanvas.width;
        c.drawImage(selC.canvas, Math.floor((tempSize-sel.w)/2), Math.floor((tempSize-sel.h)/2));
        // document.body.append(c.canvas);
        c.imageSmoothingEnabled = false;
        c.save();
        
        firstRad = Math.atan2(cursor.y - centerRotateY, cursor.x - centerRotateX);
        startRad = 0;
      
        if (app.drawing.tools.selectionMode == 'wand') {
          // clear wand selection
          let wandSections = app.drawing.frame.wandSections;
          for (let i=0; i<wandSections.length; i++) {
            app.drawing.context.clearRect(wandSections[i].x, wandSections[i].y, 1, wandSections[i].h);
          }
        } else if (app.drawing.tools.selectionMode == 'rectangular') {
          // clear rectangular selection
          app.drawing.context.clearRect(sel.x, sel.y, sel.w, sel.h);
        }
        
        break;
      case 'move':
        if (isDrag) {
          let cursor = app.drawing.getRelativeCursor();
          var angleRadians = startRad + Math.atan2(cursor.y - centerRotateY, cursor.x - centerRotateX);
          angleRadians -= firstRad;
          angleRadians = Math.floor(angleRadians*10)/10;
          lastRad = angleRadians;
          c.restore();
          c.clearRect(0,0,c.canvas.width,c.canvas.height);
          c.save();
          _radians = angleRadians;
          c.translate(Math.floor(tempSize/2), Math.floor(tempSize/2));
          c.rotate(angleRadians);
          c.translate(-Math.floor(tempSize/2), -Math.floor(tempSize/2));
          c.imageSmoothingEnabled = false;
          c.drawImage(app.drawing.frame.getSelectionLayer(), Math.floor((tempSize-selW)/2), Math.floor((tempSize-selH)/2));
          app.drawing.clearUI();
          app.drawing.UIContext.drawImage(c.canvas, selX-Math.floor((tempSize-selW)/2), selY-Math.floor((tempSize-selH)/2));
          app.drawing.redraw();
        }
        break;
      case 'end':
        if (isDrag) {
          isDrag = false;
          startRad = lastRad;
        }
        break;
    }
  };
  
  SELF.dropSelection = function() {
    if (!isWaitingDrop) {
      app.drawing.tools.utility.select.clearSelection();
      app.drawing.redraw();
      return;
    }
    
    let historyData = {
      selection: {
        x: selX,
        y: selY,
        w: selW,
        h: selH,
      },
      selectionMode: app.drawing.tools.selectionMode,
      radians: _radians,
    };
    
    app.drawing.recordAction();
    app.undoManager.record(Object.assign({
      type: 'rotate',
    }, historyData));

    app.drawing.context.drawImage(app.drawing.UIContext.canvas, 0, 0);
    isWaitingDrop = false;
    app.drawing.tools.utility.select.clearSelection();
    app.drawing.redraw();
    animator.onframeupdate(app.drawing.frame.getFrameIndex());
    
    app.undoManager.stopRecording();
  };
  
  SELF.undo = function(data) {
    data =  data[0];
    app.drawing.tools.utility.select.setSelection(data.selection);
    let sel = app.drawing.tools.utility.select.getSelection();
    app.drawing.frame.saveSelection(sel, data.selectionMode);
    selC = app.drawing.frame.getSelectionLayer().getContext('2d');
    
      // return;
    let centerX = Math.floor(sel.w/2);
    let centerY = Math.floor(sel.h/2);
    let centerRotateX = sel.x+Math.floor(sel.w/2);
    let centerRotateY = sel.y+Math.floor(sel.h/2);
    
    // clear want/rectangular selection
    if (app.drawing.tools.selectionMode == 'wand') {
      let wandSections = app.drawing.frame.wandSections;
      for (let i=0; i<wandSections.length; i++) {
        app.drawing.context.clearRect(wandSections[i].x, wandSections[i].y, 1, wandSections[i].h);
      }
    } else if (app.drawing.tools.selectionMode == 'rectangular') {
      app.drawing.context.clearRect(sel.x, sel.y, sel.w, sel.h);
    }
    
    let tempSize = Math.max(sel.w,sel.h) * 2;
    tempCanvas.width =  tempSize;
    tempCanvas.height = tempCanvas.width;

    var angleRadians = data.radians;
    c.restore();
    c.clearRect(0,0,c.canvas.width,c.canvas.height);
    c.save();
    c.translate(Math.floor(tempSize/2), Math.floor(tempSize/2));
    c.rotate(angleRadians);
    c.translate(-Math.floor(tempSize/2), -Math.floor(tempSize/2));
    c.imageSmoothingEnabled = false;
    c.drawImage(selC.canvas, Math.floor((tempSize-selW)/2), Math.floor((tempSize-selH)/2));
    app.drawing.clearUI();
    
    app.drawing.UIContext.drawImage(c.canvas, selX-Math.floor((tempSize-selW)/2), selY-Math.floor((tempSize-selH)/2));
    app.drawing.context.drawImage(app.drawing.UIContext.canvas, 0, 0);
    app.drawing.clearUI();
    app.drawing.redraw();
    
  };
  
  return SELF;
}