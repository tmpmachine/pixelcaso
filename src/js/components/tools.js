function Tools() {

  let lastTool = '';
  let isLocked = false;
  let config = {
    lineWidth: 1,
  };
  let selectionMode = 'rectangular';
  let isResetLineWidth = false;
  
  let utility = {
    line: Line(config),
    rectangle: Rectangle(config),
    ellipse: Ellipse(config),
    pencil: Pencil(config),
    fill: Fill(),
    picker: Picker(),
    eraser: Eraser(config),
    select: Select(),
    wand: Wand(),
    move: Move(),
    hand: Hand(),
    rotate: Rotate(),
  };
  
  let _ = {
    selectedTool: 'pencil',
  };
  
  let SELF = {
    apply,
    config,
    selectLastTool,
    increaseLineWidth,
    decreaseLineWidth,
    setLineWidth,
    changeLineWidth,
    applyBatch,
    selectTool,
    utility,
    lock,
    unlock,
  };
  
  let pickerLastTool = ['pencil','line','fill','rectangle','ellipse'];
  
  function selectLastTool() {
    // modify exceptional behaviour
    if (_.selectedTool == 'picker' && !pickerLastTool.includes(lastTool)) {
      lastTool = 'pencil';
    }
    
    // window.app.drawing.setDragState(false);
    selectTool(lastTool);
  }
  
  function unlock() {
    isLocked = false;
  }
  
  function lock() {
    isLocked = true;
  }
  
  SELF.reset = function() {
    _.selectedTool = 'pencil';
    lastTool = '';
    isLocked = false;
    config.lineWidth = 1;
    utility.pencil.changeSize();
  };
  
  function selectTool(toolName, isSetLastTool) {
    if (!isLocked && toolName != _.selectedTool) {
      if (toolName == 'select') {
        $('.mobile-tools')[0].dataset.mode = 'selection';
      }
      if (_.selectedTool == 'move' && toolName != 'hand') {
        utility.move.dropSelection();
        $('.mobile-tools')[0].dataset.mode = 'default';
      } else if (_.selectedTool == 'rotate' && toolName != 'hand') {
        utility.rotate.dropSelection();
        $('.mobile-tools')[0].dataset.mode = 'default';
      }
      if (toolName != _.selectedTool && _.selectedTool == 'hand') {
        document.body.classList.remove('tool-hand');
        document.body.classList.remove('tool-hand-hover');
      }

      if (isSetLastTool) {
        lastTool = _.selectedTool;
      }
      _.selectedTool = toolName;
      compoToolbar.SetActive(toolName);
      
      ui.ReloadToolbarStates();
      
      isResetLineWidth = true;
      switch (_.selectedTool) {
        case 'pencil':
        case 'eraser':
        case 'line':
        case 'rectangle':
        case 'ellipse':
          isResetLineWidth = false;
          break;
        case 'hand':
        case 'move':
          if (['pencil','eraser','line','rectangle','ellipse'].includes(lastTool))
            isResetLineWidth = false;
          break;
      }
      
      ui.statusBar.update({
        tool: toolName,
      });
      uiMobile.updateToolPane();
      
      app.drawing.frame.updateCursor();
      app.drawing.redraw();
      
    }
  }
  
  function apply(data) {
    
    let {action, isDrag} = data;
    if ((app.layer.layers.length === 0 || !app.layer.isVisible()) && _.selectedTool != 'hand') {
      app.drawing.redraw(false);
      return;
    }
    
    switch (_.selectedTool) {
      case 'hand':
        utility.hand.handleSelection(action);
        document.body.classList.add('tool-hand-hover');
        break;
      case 'rotate':
        utility.rotate.handleMovement(action);
      break;
      case 'move':
        utility.move.handleSelection(action);
        break;
      case 'wand':
        utility.wand.fill(action);
        break;
      case 'select':
        utility.select.handleSelection(data);
        break;
      case 'picker':
        utility.picker.pickColor(action);
        break;
      case 'pencil':
        utility.pencil.draw(action);
        break;
      case 'line':
        utility.line.draw(action);
        break;
      case 'rectangle':
        utility.rectangle.draw(action);
        break;
      case 'ellipse':
        utility.ellipse.draw(action);
        break;
      case 'eraser':
        utility.eraser.erase(action);
        break;
      case 'fill':
        if (isDrag) {
          utility.fill.fill(action);
        }
        break;
    }
    app.drawing.redraw(false);
  }
  
  let compositeCanvas = document.createElement('canvas');
  let compositeCanvas2 = document.createElement('canvas');
  let compositeCanvas3 = document.createElement('canvas');
  let selStartX = 0; 
  let selStartY = 0; 
  let cc = compositeCanvas.getContext('2d');
  let cc2 = compositeCanvas2.getContext('2d');
  let cc3 = compositeCanvas3.getContext('2d');
  let isComposite = false;
  
  SELF.getCompo = function() {
    return {c:cc, c2:cc2, c3:cc3};
  };
    
  function applyBatch({toolName, data, color, sel, wandSections, selectionMode}) {
    if (sel) {
      if (wandSections) {
        SELF.setSelectionCompositeLayerMask(sel, wandSections);
      } else {
        SELF.setCompositeCanvas(sel);
      }
    }

    switch (toolName) {
      case 'line':
        utility.pencil.changeColor(color);
        utility.line.drawBatch(data, color);
        break;
      case 'rectangle':
        utility.pencil.changeColor(color);
        utility.rectangle.drawBatch(data, color);
        break;
      case 'ellipse':
        utility.pencil.changeColor(color);
        utility.ellipse.drawBatch(data, color);
        break;
      case 'pencil':
        utility.pencil.changeColor(color);
        utility.pencil.drawBatch(data, sel, selectionMode);
        break;
      case 'eraser':
        utility.eraser.eraseBatch(data, sel, selectionMode);
        break;
      case 'fill':
        utility.pencil.changeColor(color);
        utility.fill.fillBatch(data);
        break;
      case 'rotate':
        utility.rotate.undo(data);
        break;
      case 'move':
        utility.move.undoMove(data);
        break;
    }
  }
  
  function changeLineWidth(size) {
    config.lineWidth = size;
    utility.pencil.changeSize();
  }
  
  function increaseLineWidth() {
    if (isResetLineWidth || isLocked)
      return;
    if (config.lineWidth < 10) {
      config.lineWidth++;
      changeLineWidth(config.lineWidth);
      app.drawing.frame.updateCursor();
      app.drawing.redraw();
    }
  }
  
  function decreaseLineWidth() {
    if (isResetLineWidth || isLocked)
      return;
    if (config.lineWidth > 1) {
      config.lineWidth--;
      changeLineWidth(config.lineWidth);
      app.drawing.frame.updateCursor();
      app.drawing.redraw();
    }
  }
  
  function setLineWidth(size) {
    size = Math.min(Math.max(1, size), 10);
    config.lineWidth = size;
    changeLineWidth(config.lineWidth);
    app.drawing.frame.updateCursor();
    app.drawing.redraw();
  }
  
  SELF.setCompositeCanvas = function(sel) {
    let compo = app.drawing.tools.getCompo();
    let canvas = compo.c.canvas;
    canvas.dataset.selX = sel.x;
    canvas.dataset.selY = sel.y;
    canvas.width = sel.w;
    canvas.height = sel.h;
    let canvas2 = compo.c2.canvas;
    canvas2.width = canvas.width;
    canvas2.height = canvas.height;
    let canvas3 = compo.c3.canvas;
    canvas3.width = canvas.width;
    canvas3.height = canvas.height;
    return compo.c2;
  };
  
  SELF.setSelectionCompositeLayerMask = function(sel, wandSections = app.drawing.frame.wandSections) {
    let ctx = app.drawing.tools.setCompositeCanvas(sel);
    ctx.fillStyle = 'black';
    for (let i=0; i<wandSections.length; i++) {
      ctx.fillRect(wandSections[i].x-sel.x, wandSections[i].y-sel.y, 1, wandSections[i].h);
    }
  }
  
  Object.defineProperty(SELF, 'selectedTool', { get: () => _.selectedTool });
  Object.defineProperty(SELF, 'lastTool', { get: () => lastTool });
  Object.defineProperty(SELF, 'isLocked', { get: () => isLocked });
  Object.defineProperty(SELF, 'isResetLineWidth', { get: () => isResetLineWidth });
  Object.defineProperty(SELF, 'selectionMode', { get: () => selectionMode, set: (mode) => selectionMode = mode });
  
  return SELF;
}