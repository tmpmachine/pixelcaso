function Fill() {
  
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
  
  var data;
  var canvasWidth;
  var canvasHeight;
  	
	let red;
	let green;
	let blue;
	let alpha;
	
	let r;
	let g;
	let b;
	let a;
  	
  function floodFill(cursor) {
    let x = cursor.x;
    let y = cursor.y;

    let fillData = app.drawing.tools.utility.pencil.context.getImageData(0,0,1,1).data;
    
    red = fillData[0];
  	green = fillData[1];
  	blue = fillData[2];
  	alpha = fillData[3];
  	
    // flood fill
    // http://www.adammil.net/blog/v126_A_More_Efficient_Flood_Fill.html

    // faster pixel manipulation
    // https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
    
    let c = app.drawing.context;
    canvasWidth  = c.canvas.width;
    canvasHeight = c.canvas.height;
    
  	var imageData = c.getImageData(0, 0, canvasWidth, canvasHeight);
  	data = imageData.data;
  	
  	MyFill(x,y,canvasWidth,canvasHeight);
    c.putImageData(imageData, 0, 0);
  }

  function isSelectedColor() {
    return (
      r == red &&
      g == green &&
      b == blue &&
      a == alpha
      );
  }

  function MyFill(x, y,width,height) {
    let index = (y*width+x)*4;
    r = data[index];
    g = data[index+1];
    b = data[index+2];
    a = data[index+3];
    if (!isSelectedColor())
      _MyFill(x, y, width, height);
  }

  function _MyFill(x, y, width, height) {
    while(true) {
      let ox = x, oy = y;
      while(y != 0 && canFill(y-1,x)) y--;
      while(x != 0 && canFill(y,x-1)) x--;
      if(x == ox && y == oy) break;
    }
    MyFillCore(x, y, width, height);
  }
  
  function MyFillCore(x, y, width, height) {
    let lastRowLength = 0;
    do {
      let rowLength = 0, sx = x; 
      if(lastRowLength != 0 && !canFill(y,x)) {
        do {
          if(--lastRowLength == 0) return; 
        } while(!canFill(y,(++x))); 
        sx = x;
      } else {
        for(; x != 0 && canFill(y,x-1); rowLength++, lastRowLength++) {
          drawPixel(y,--x);
          if(y != 0 && canFill(y-1,x)) _MyFill(x, y-1, width, height); 
        }
      }
  
      for(; sx < width && canFill(y,sx); rowLength++, sx++) 
          drawPixel(y,sx);
        
      if(rowLength < lastRowLength)
      {
        for(let end=x+lastRowLength; ++sx < end; ) 
        {                                          
          if(canFill(y,sx)) MyFillCore(sx, y, width, height); 
        }
      }
      else if(rowLength > lastRowLength && y != 0) 
      {
        for(let ux=x+lastRowLength; ++ux<sx; ) 
        {
          if(canFill(y-1,ux)) _MyFill(ux, y-1, width, height); 
        }
      }
      lastRowLength = rowLength; 
    } while(lastRowLength != 0 && ++y < height); 
  }
  
  function canFill(y,x) {
    let index = (y*canvasWidth+x)*4;
    return (
      data[index] == r &&
      data[index+1] == g &&
      data[index+2] == b &&
      data[index+3] == a
    );
  }
  
  function drawPixel(y,x) {
    let index = (y*canvasWidth+x)*4;
    data[index] = red;
    data[index+1] = green;
    data[index+2] = blue;
    data[index+3] = alpha;
  }
  
  function fill(mouseEvt) {
    let cursor = app.drawing.getRelativeCursor();
    if (mouseEvt == 'start') {
      if (cursor.x < 0 || cursor.y < 0 || cursor.x >= app.drawing.frame.width || cursor.y >=  app.drawing.frame.height)
        return;
      app.drawing.recordAction();
      record(cursor);
      floodFill(cursor);
      app.drawing.redraw();
      animator.onframeupdate(app.drawing.frame.getFrameIndex());
    }
  }
  
  function fillBatch(data) {
    for (let i=0; i<data.length; i++)
      floodFill(data[i].cursor);
  }
  
  return {
    fill,
    fillBatch,
  };
}
