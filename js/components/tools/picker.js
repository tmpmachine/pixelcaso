function Picker() {
  
  let canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  let c = canvas.getContext('2d');
  let oldCursor = {
    x: null,
    y: null,
  };
  let pickTimeout;
  
  let listener = {
    oncolorpicked: function(color) {
      ui.DOM.palette.setPrimaryColor(color);
    }
  };
  
  function rgbToHex(r, g, b) {
      if (r > 255 || g > 255 || b > 255)
          throw "Invalid color component";
      return ((r << 16) | (g << 8) | b).toString(16);
  }
  
  function getColorAtCursor() {
    c.drawImage(app.drawing.context.canvas, oldCursor.x, oldCursor.y, 1, 1, 0, 0, 1, 1);
    let data = c.getImageData(0, 0, 1, 1).data; 
    return data;
  }
  
  function getHex(data) {
    let hex = "#" + ("000000" + rgbToHex(data[0], data[1], data[2])).slice(-6);
    return hex;
  }
  
  function pickColor(mouseEvt) {
    let cursor = app.drawing.getRelativeCursor();
    if (mouseEvt == 'end') {
      let colorData = getColorAtCursor();
      let color = getHex(colorData);
      app.drawing.tools.utility.pencil.changeColor(color);
      app.drawing.tools.selectLastTool(false);
      listener.oncolorpicked(colorData);
    } else if (mouseEvt == 'move' || mouseEvt == 'start') {
      if (cursor.x != oldCursor.x || cursor.y != oldCursor.y) {
        clearTimeout(pickTimeout);
        pickTimeout = window.setTimeout(function() {
          oldCursor.x = cursor.x;
          oldCursor.y = cursor.y;
          let colorData = getColorAtCursor();
          let color = getHex(colorData);
          listener.oncolorpicked(colorData);
        }, 5);
      }
    }
  }
  
  return {
    pickColor,
  };
}