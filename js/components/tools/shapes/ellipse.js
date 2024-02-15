function Ellipse(config) {
  
  let lastX;
  let lastY;
  let isDrag = false;
  
  function draw(mouseEvt) {
    let cursor = app.drawing.getRelativeCursor();
    if (mouseEvt == 'start') {
      lastX = cursor.x;
      lastY = cursor.y;
      isDrag = true;
      app.drawing.tools.lock();
    } else if (mouseEvt == 'move') {
      if (isDrag) {
        app.drawing.clearUI();
        let ctx = app.drawing.UIContext;
        drawLineBetween(lastX, lastY, cursor.x, cursor.y, fillPreview);
      }
    } else if (mouseEvt == 'end') {
      if (isDrag) {
        isDrag = false;
        app.drawing.clearUI();
        drawLineBetween(lastX, lastY, cursor.x, cursor.y, fill);
        app.drawing.recordAction();
        record(cursor);
        app.drawing.tools.unlock();
        animator.onframeupdate(app.drawing.frame.getFrameIndex());
      }
    }
  }
  
  // http://members.chello.at/easyfilter/bresenham.html
  function drawLineBetween(x0, y0, x1, y1, callback) {

    let a = Math.abs(x1-x0);
    let b = Math.abs(y1-y0);
    let b1 = b&1;
    let dx = 4*(1-a)*b*b;
    let dy = 4*(b1+1)*a*a;
    let err = dx+dy+b1*a*a, e2; /* error of 1.step */
    if (x0 > x1) { x0 = x1; x1 += a; } /* if called with swapped points */
    if (y0 > y1) y0 = y1; /* .. exchange them */
    y0 += (b+1)/2; 
    y1 = y0-b1;   /* starting pixel */
    a *= 8*a; 
    b1 = 8*b*b;
    
    do {
      callback(x1, y0); /*   I. Quadrant */
      callback(x0, y0); /*  II. Quadrant */
      callback(x0, y1); /* III. Quadrant */
      callback(x1, y1); /*  IV. Quadrant */
      e2 = 2*err;
      if (e2 <= dy) { y0++; y1--; err += dy += a; }  /* y step */ 
      if (e2 >= dx || 2*err > dy) { x0++; x1--; err += dx += b1; } /* x step */
    } while (x0 <= x1);
    
    while (y0-y1 < b) {  /* too early stop of flat ellipses a=1 */
      callback(x0-1, y0); /* -> finish tip of ellipse */
      callback(x1+1, y0++); 
      callback(x0-1, y1);
      callback(x1+1, y1--); 
    }
  }
  
  function record(cursor) {
    let lastAction = app.undoManager.getLastAction();
    if (lastAction) {
      if (lastAction.cursor.x != cursor.x || lastAction.cursor.y != cursor.y) {
        app.undoManager.record({
          cursor: {
            x1: lastX,
            y1: lastY,
            x2: cursor.x,
            y2: cursor.y,
          },
        });
      }
    } else {
      app.undoManager.record({
        cursor: {
          x1: lastX,
          y1: lastY,
          x2: cursor.x,
          y2: cursor.y,
        },
      });
    }
  }
  
  function fillPreview(x,y) {
    app.drawing.UIContext.drawImage(app.drawing.tools.utility.pencil.context.canvas, x-Math.floor(config.lineWidth/2), y-Math.floor(config.lineWidth/2));
  }
  
  function fill(x,y) {
    app.drawing.context.drawImage(app.drawing.tools.utility.pencil.context.canvas, x-Math.floor(config.lineWidth/2), y-Math.floor(config.lineWidth/2));
  }
  
  function drawBatch(data) {
    for (let i=0; i<data.length; i++) {
      let p = data[i].cursor;
      drawLineBetween(p.x1, p.y1, p.x2, p.y2, fill);
    }
  }
  
  return {
    draw,
    drawBatch,
    drawLineBetween,
  };
}