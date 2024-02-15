function Hand() {
  
  let isDrag = false;
  let dX = 0;
  let dY = 0;
  
  function start() {
    dX = app.drawing.getScreenCursor().x;
    dY = app.drawing.getScreenCursor().y;
    isDrag = true;
    document.body.classList.add('tool-hand');
  }
  
  function end() {
    onLeave();
    document.body.classList.remove('tool-hand');
  }
  
  function handleSelection(action) {
    switch (action) {
      case 'start':
        start();
        break;
      case 'move':
        if (isDrag) {
          let cursor = app.drawing.getScreenCursor();
          let deltaX = cursor.x - dX;
          let deltaY = cursor.y - dY;
          dX = cursor.x;
          dY = cursor.y;
          cam.x -= deltaX;
          cam.y -= deltaY;

          // snap edge 20%
          cam.x = Math.max(-DOM.canvas.width + (2*scale), cam.x)
          cam.x = Math.min(app.drawing.frame.width*scale - 2*scale, cam.x)
          cam.y = Math.max(-DOM.canvas.height + 2*scale, cam.y)
          cam.y = Math.min(app.drawing.frame.height*scale - 2*scale, cam.y)
          
          app.drawing.redraw();
        }
        break;
      case 'end':
        end();
        break;
    }
  }
  
  function onLeave() {
    isDrag = false;
    dX = 0;
    dY = 0;
  }
  
  let self = {
    handleSelection,
    onLeave,
    start,
    end,
  };
  
  Object.defineProperty(self, 'isDrag', {
    get: () => isDrag,
  })
  
  
  return self;
}