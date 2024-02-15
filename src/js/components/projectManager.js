function ProjectManager() {
  
  let SELF = {};
  let compo = [];
  let activeIndex = 0;
  
  SELF.createProject = function() {
    compo.push({
      drawing: window.Drawing(),
      timeline: window.Timeline(),
      undoManager: window.UndoManager(),
      clipboard: window.EditorClipboard(),
      layer: window.Layer(),
    });
    
    let isNewlyCreated = true;
    SELF.openProject(compo.length-1, isNewlyCreated);
  };
  
  SELF.openProject = function(index, isNewlyCreated = false) {
    activeIndex = index;
    window.app.changeComponent('drawing', compo[activeIndex].drawing);
    window.app.changeComponent('timeline', compo[activeIndex].timeline);
    window.app.changeComponent('undoManager', compo[activeIndex].undoManager);
    window.app.changeComponent('clipboard', compo[activeIndex].clipboard);
    window.app.changeComponent('layer', compo[activeIndex].layer);
    
    if (isNewlyCreated) {
      let isRecordHistory = false;
      app.layer.insertLayer(isRecordHistory);
    }
    // app.layer.list();
    
    
    // ui resize
    app.drawing.rebound();
    app.drawing.resizeBaseCanvas(DOM.canvas.parentNode.offsetWidth, DOM.canvas.parentNode.offsetHeight);
    
    // set scalle
    let x1 = (parseFloat($('#canvas')[0].width) - window.app.drawing.defaultZoomPadding) / app.drawing.frame.width;
    let x2 = (parseFloat($('#canvas')[0].height) - window.app.drawing.defaultZoomPadding) / app.drawing.frame.height;
    scale = Math.min(x1, x2);
    
    app.drawing.resetZoomScaleLevel();
    
    app.drawing.centerCanvas(scale);
    app.drawing.redraw();
  };
  
  return SELF;
}