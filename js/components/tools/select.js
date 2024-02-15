function Select() {
  
  let selectionStart = {x:null, y:null};
  let selectionEnd = {x:null, y:null};
  let oldX, oldY;
  let SELF = {
    area: {},
    isDrag: false,
  };
  
  SELF.handleSelection = function({ action }) {
    switch (action) {
      case 'start':
        if (SELF.isDrag) {
          return
        }
        
        let cursor = app.drawing.getRelativeCursor();
        SELF.isDrag = true;
        app.drawing.clearUI();
        selectionStart.x = cursor.x;
        selectionStart.y = cursor.y;
        selectionEnd.x = cursor.x;
        selectionEnd.y = cursor.y;
        app.drawing.tools.lock();
        app.drawing.resizeSelectBox(1,1);
        SELF.draw(selectionStart, cursor);
        app.drawing.redraw();
        oldX = cursor.x;
        oldY = cursor.y;
        app.drawing.tools.selectionMode = 'rectangular';
        break;
      case 'move':
        if (SELF.isDrag) {
          let cursor = app.drawing.getRelativeCursor();
          if (oldX != cursor.x || oldY != cursor.y) {
            oldX = cursor.x;
            oldY = cursor.y;
            selectionEnd.x = cursor.x;
            selectionEnd.y = cursor.y;
            SELF.draw(selectionStart, cursor);
          }
        }
        break;
      case 'end':
        if (SELF.isDrag) {
          SELF.isDrag = false;
          selectionEnd = {
            x: app.drawing.getRelativeCursor().x,
            y: app.drawing.getRelativeCursor().y,
          };
          app.drawing.tools.unlock();
          app.drawing.clearUI();
          app.drawing.redraw();
          let selection = SELF.getSelection();
          SELF.area = selection;
          app.drawing.tools.setCompositeCanvas(selection);
        }
        break;
    }
  };
  
  SELF.clearSelection = function() {
    for (let key in selectionStart)
      selectionStart[key] = null;
    for (let key in selectionEnd)
      selectionEnd[key] = null;
    app.drawing.clearUI();
  };
  
  SELF.setSelection = function(data) {
    isEmpty = false;
    selectionStart = {
      x: data.x,
      y: data.y,
    };
    selectionEnd = {
      x: data.x+data.w-1,
      y: data.y+data.h-1,
    };
    let selection = SELF.getSelection();
    SELF.area = selection;
    SELF.draw(selectionStart, selectionEnd);
  };
  
  SELF.draw = function(cursor1, cursor2) {
    let x1 = Math.min(cursor1.x, cursor2.x);
    let x2 = Math.max(cursor1.x, cursor2.x);
    let y1 = Math.min(cursor1.y, cursor2.y);
    let y2 = Math.max(cursor1.y, cursor2.y);
    app.drawing.clearUI();
    app.drawing.selectionUIContext.fillStyle = '#94bde099';
    let w = x2-x1+1;
    let h = y2-y1+1;
    app.drawing.selectionUIContext.fillRect(x1, y1, w, h);
    app.drawing.resizeSelectBox(w, h);
  };
  
  // function drawWandSelection() {
    // draw wand selection
  //   for (let i=0; i<wandSections.length; i++) {
  //     app.drawing.UIContext.fillRect(wandSections[i].x, wandSections[i].y, 1, wandSections[i].h);
  //   }
  // }
  
  SELF.selectAll = function() {
    app.drawing.tools.utility.move.dropSelection();
    SELF.setSelection({
      x: 0,
      y: 0,
      w: app.drawing.frame.width,
      h: app.drawing.frame.height,
    });
    let selection = SELF.getSelection();
    app.drawing.redraw();
    app.drawing.tools.selectionMode = 'rectangular';
    SELF.area = selection;
    app.drawing.tools.setCompositeCanvas(selection);
  };
  
  SELF.getSelection = function() {
    let isEmpty = false;
    let x1 = Math.min(selectionStart.x, selectionEnd.x);
    let x2 = Math.max(selectionStart.x, selectionEnd.x);
    let y1 =  Math.min(selectionStart.y, selectionEnd.y);
    let y2 = Math.max(selectionStart.y, selectionEnd.y);
    if (selectionStart.x === null)
      isEmpty = true;
    
    return {
      isEmpty,
      selectionStart,
      selectionEnd,
      x:Math.min(x1,x2),
      y:Math.min(y1,y2),
      w:x2-x1+1,
      h:y2-y1+1,
    };
  };
  
  return SELF;
}