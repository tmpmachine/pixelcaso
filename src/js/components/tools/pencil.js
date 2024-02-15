function Pencil(config) {
  
  let lastX;
  let lastY;
  let c = document.createElement('canvas');
  c.width = 1;
  c.height = 1;
  let ctx = c.getContext('2d');
  ctx.willReadFrequently = true;
  let color = 'black';
  let isDrag = false;
  let isSelectionDraw = false;
  
  // let compositeCanvas = document.createElement('canvas');
  // let selStartX = 0; 
  // let selStartY = 0; 
  // let cc = compositeCanvas.getContext('2d');
  // $('.debug-canvas-container')[0].append(compositeCanvas);
  
  
  function getColor() {
    return color;
  }
  
  function drawPixel(x, y) {
    fill({x, y}, true);
  }
  
  function record(cursor) {
    app.undoManager.record({
      cursor: Object.assign({}, cursor),
    });
  }
  
  function fill(cursor, isRecord) {
    if (isSelectionDraw) {
      let sel = app.drawing.tools.utility.select.area;
      let lineW = Math.floor(config.lineWidth/2);
      let x = cursor.x-lineW- sel.x;
      let y = cursor.y-lineW - sel.y;
      let w = config.lineWidth;
      
      let compo = app.drawing.tools.getCompo();
      let cc = compo.c;
      cc.drawImage(c, x, y);
      if (app.drawing.tools.selectionMode == 'wand') {
        compo.c3.canvas.width = compo.c3.canvas.width;
        compo.c3.drawImage(compo.c2.canvas,0,0);
        compo.c3.globalCompositeOperation = "source-in";
        compo.c3.drawImage(cc.canvas,0,0);
        app.drawing.context.drawImage(compo.c3.canvas, x,y,w,w, cursor.x-Math.floor(config.lineWidth/2), cursor.y-Math.floor(config.lineWidth/2), w, w);
      } else {
        app.drawing.context.drawImage(cc.canvas, x,y,w,w, cursor.x-Math.floor(config.lineWidth/2), cursor.y-Math.floor(config.lineWidth/2), w, w);
      }
    } else {
      app.drawing.context.drawImage(c, cursor.x-Math.floor(config.lineWidth/2), cursor.y-Math.floor(config.lineWidth/2));
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
  
  function undoFillSelection(cursor, sel, selectionMode) {
    let lineW = Math.floor(config.lineWidth/2);
    let x = cursor.x-lineW-sel.x;
    let y = cursor.y-lineW-sel.y;
    let w = config.lineWidth;
    
    let compo = app.drawing.tools.getCompo();
    let cc = compo.c;
    cc.drawImage(c, x, y);
    if (selectionMode == 'wand') {
      compo.c3.canvas.width = compo.c3.canvas.width;
      compo.c3.drawImage(compo.c2.canvas,0,0);
      compo.c3.globalCompositeOperation = "source-in";
      compo.c3.drawImage(cc.canvas,0,0);
      app.drawing.context.drawImage(compo.c3.canvas, x,y,w,w, cursor.x-Math.floor(config.lineWidth/2), cursor.y-Math.floor(config.lineWidth/2), w, w);
    } else {
      app.drawing.context.drawImage(cc.canvas, x,y,w,w, cursor.x-Math.floor(config.lineWidth/2), cursor.y-Math.floor(config.lineWidth/2), w, w);
    }
  }
  
  function draw(mouseEvt) {
    let cursor = app.drawing.getRelativeCursor();
    if (mouseEvt == 'start') {
      checkSelection();
      lastX = cursor.x;
      lastY = cursor.y;
      app.drawing.recordAction();
      fill(cursor, true);
      isDrag = true;
      app.drawing.tools.lock();
      app.drawing.redraw();
      animator.onframeupdate(app.drawing.frame.getFrameIndex());
    } else if (mouseEvt == 'move') {
      if (isDrag) {
        if (lastX != cursor.x || lastY != cursor.y) {
          app.drawing.tools.utility.line.drawLineBetween(lastX, lastY, cursor.x, cursor.y, drawPixel);
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
  
  function drawBatch(data, sel, selectionMode) {
    if (sel) {
      for (let i=0; i<data.length; i++)
        undoFillSelection(data[i].cursor, sel, selectionMode); 
    } else {
      for (let i=0; i<data.length; i++)
        fill(data[i].cursor);
    }
  }
  
  function changeColor(_color = color) {
    color = _color;
    ctx.fillStyle = color;
    ctx.clearRect(0,0,config.lineWidth, config.lineWidth);
    ctx.fillRect(0, 0, config.lineWidth, config.lineWidth);
  }
  
  function changeSize() {
    ctx.canvas.width = config.lineWidth;
    ctx.canvas.height = config.lineWidth;
    ctx.willReadFrequently = true;
    changeColor();
  }
  
  changeSize();
  
  return {
    draw,
    changeSize,
    changeColor,
    getColor,
    drawBatch,
    context: ctx,
  };
}