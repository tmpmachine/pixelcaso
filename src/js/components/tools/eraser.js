function Eraser(config) {
  
  let lastX;
  let lastY;
  let isDrag = false;
  let isSelectionDraw = false;
  let c = document.createElement('canvas');
  c.width = 1;
  c.height = 1;
  let ctx = c.getContext('2d');
  ctx.fillStyle = 'lime';
  ctx.fillRect(0, 0, config.lineWidth, config.lineWidth);
  
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
  
  function clear(cursor, isRecord = false) {
    let x = cursor.x-Math.floor(config.lineWidth/2);
    let y = cursor.y-Math.floor(config.lineWidth/2);
    
    if (isSelectionDraw) {
      let sel = app.drawing.tools.utility.select.area;
      let lineW = Math.floor(config.lineWidth/2);
      let x = cursor.x-lineW- sel.x;
      let y = cursor.y-lineW - sel.y;
      let w = config.lineWidth;
      
      let compo = app.drawing.tools.getCompo();
      let cc = compo.c;
      cc.drawImage(c, x, y,w,w);
      if (app.drawing.tools.selectionMode == 'wand') {
        compo.c3.canvas.width = compo.c3.canvas.width;
        compo.c3.drawImage(compo.c2.canvas,0,0);
        compo.c3.globalCompositeOperation = "destination-in";
        compo.c3.drawImage(cc.canvas,0,0);
        app.drawing.context.globalCompositeOperation = "destination-out";
        app.drawing.context.drawImage(compo.c3.canvas, x,y,w,w, cursor.x-Math.floor(config.lineWidth/2), cursor.y-Math.floor(config.lineWidth/2), w, w);
        app.drawing.context.globalCompositeOperation = "normal";
      } else {
        app.drawing.context.globalCompositeOperation = "destination-out";
        app.drawing.context.drawImage(cc.canvas, x,y,w,w, cursor.x-Math.floor(config.lineWidth/2), cursor.y-Math.floor(config.lineWidth/2), w, w);
        app.drawing.context.globalCompositeOperation = "normal";
      }
    } else {
      app.drawing.context.clearRect(x, y, config.lineWidth, config.lineWidth);
    }
    
    if (isRecord) {
      let lastAction = app.undoManager.getLastAction();
      if (lastAction && isDrag) {
        if (lastAction.cursor.x != cursor.x || lastAction.cursor.y != cursor.y) {
          record(cursor);
        }
      } else {
        record(cursor);
      }
    }
  }
  
  function clearAt(x,y) {
    clear({x,y},true);
  }
  
  function fill(cursor, isRecord) {
    app.drawing.context.drawImage(c, cursor.x-Math.floor(config.lineWidth/2), cursor.y-Math.floor(config.lineWidth/2));
  }
  
  function erase(mouseEvt) {
    let cursor = app.drawing.getRelativeCursor();
    if (mouseEvt == 'start') {
      checkSelection();
      lastX = cursor.x;
      lastY = cursor.y;
      app.drawing.recordAction();
      clear(cursor, true);
      isDrag = true;
      app.drawing.tools.lock();
      app.drawing.redraw();
        animator.onframeupdate(app.drawing.frame.getFrameIndex());
    } else if (mouseEvt == 'move') {
      if (isDrag) {
        if (lastX != cursor.x || lastY != cursor.y) {
          app.drawing.tools.utility.line.drawLineBetween(lastX, lastY, cursor.x, cursor.y, clearAt);
          lastX = cursor.x;
          lastY = cursor.y;
          animator.onframeupdate(app.drawing.frame.getFrameIndex());
        }
      }
    } else {
      if (isDrag) {
        isDrag = false;
        app.drawing.tools.unlock();
        isSelectionDraw = false;
      }
    }
  }
  
  function eraseBatch(data, sel, selectionMode) {
    if (sel) {
      app.drawing.context.globalCompositeOperation = "destination-out";
      for (let i=0; i<data.length; i++)
        undoClearSelection(data[i].cursor, sel, selectionMode); 
      app.drawing.context.globalCompositeOperation = "normal";
    } else {
      for (let i=0; i<data.length; i++)
        clear(data[i].cursor);
    }
  }
  
  function undoClearSelection(cursor, sel, selectionMode) {
    let lineW = Math.floor(config.lineWidth/2);
    let x = cursor.x-lineW-sel.x;
    let y = cursor.y-lineW-sel.y;
    let w = config.lineWidth;
    
    let compo = app.drawing.tools.getCompo();
    let cc = compo.c;
    cc.drawImage(c, x, y, w, w);
    if (app.drawing.tools.selectionMode == 'wand') {
      compo.c3.canvas.width = compo.c3.canvas.width;
      compo.c3.drawImage(compo.c2.canvas,0,0);
      compo.c3.globalCompositeOperation = "destination-in";
      compo.c3.drawImage(cc.canvas,0,0);
      // app.drawing.context.globalCompositeOperation = "destination-out";
      app.drawing.context.drawImage(compo.c3.canvas, x,y,w,w, cursor.x-Math.floor(config.lineWidth/2), cursor.y-Math.floor(config.lineWidth/2), w, w);
      // app.drawing.context.globalCompositeOperation = "normal";
    } else {
      // app.drawing.context.globalCompositeOperation = "destination-out";
      app.drawing.context.drawImage(cc.canvas, x,y,w,w, cursor.x-Math.floor(config.lineWidth/2), cursor.y-Math.floor(config.lineWidth/2), w, w);
      // app.drawing.context.globalCompositeOperation = "normal";
    }
  }
  
  function checkSelection() {
    if (window.selCanvas) {
      let sel = app.drawing.tools.utility.select.getSelection();
      if (!sel.isEmpty) {
        isSelectionDraw = true;
      } else {
        isSelectionDraw = false;
      }
    }
  }
  
  return {
    erase,
    eraseBatch,
  };
}