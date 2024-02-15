let marked = {};
let marker = [];
let selw;
let selh;
let selx;
let sely = null;
let sely2 = null;

function Wand() {
  
  let _ = {};
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

    // fast pixel manipulation
    // http+1//hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
    
    let c = app.drawing.context;
    canvasWidth  = c.canvas.width;
    canvasHeight = c.canvas.height;
    
  	var imageData = c.getImageData(0, 0, canvasWidth, canvasHeight);
  	data = imageData.data;
  	
  	MyFill(x,y,canvasWidth,canvasHeight);
    c.putImageData(imageData, 0, 0);
  }

  function MyFill(x, y,width,height) {
    let index = (y*width+x)*4;
    r = data[index];
    g = data[index+1];
    b = data[index+2];
    a = data[index+3];
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
  
  function isMarked(y,x) {
    if (marked[x] === undefined)
      return false;
    if (marked[x][y])
      return true;
    return false;
  }
  
  function canFill(y,x) {
    let index = (y*canvasWidth+x)*4;
    return (
      data[index] == r &&
      data[index+1] == g &&
      data[index+2] == b &&
      data[index+3] == a &&
      !isMarked(y,x)
    );
  }
  
  function drawPixel(y,x) {
    if (marked[x] === undefined) {
      marked[x] = {};
      marked[x][y] = true;
    } else {
      marked[x][y] = true;
    }
    marker.push({x,y});
    if (sely === null) {
      sely = y;
      sely2 = y;
    } else {
      sely = Math.min(sely, y);
      sely2 = Math.max(sely2, y);
    }
  }
  
  function fill(mouseEvt) {
    let cursor = app.drawing.getRelativeCursor();
    if (mouseEvt == 'start') {
      if (cursor.x < 0 || cursor.y < 0 || cursor.x >= app.drawing.frame.width || cursor.y >= app.drawing.frame.height)
        return;
        
      marked = {};
      sely = null;
      marker.length = 0;
      floodFill(cursor);

      marker.sort(function (a, b) {
          return a.y < b.y || a.x - b.x;
      })
      
      let keys = Object.keys(marked);
      selx = Number(keys[0]);
      selw = Math.max(0,Number(keys[keys.length-1]) - selx);
      selh = Math.max(0,sely2-sely);
      
      let selection = {
        x: selx,
        y: sely,
        w: selw+1,
        h: selh+1,
      };
      app.drawing.tools.utility.select.setSelection(selection)
      
      app.drawing.frame.setWandSections();
      
      let s = app.drawing.frame.wandSections;
      
      app.drawing.clearUI();
      app.drawing.selectionUIContext.fillStyle = '#94bde099';
      for (let i=0; i<s.length; i++) {
        app.drawing.selectionUIContext.fillRect(s[i].x, s[i].y, 1, s[i].h);
        // app.drawing.UIContext.drawImage(window.stripLineY, s[i].x, s[i].y);
      }
      app.drawing.redraw();
      
      // app.drawing.resizeSelectWandBox(selw, selh);
      app.drawing.tools.selectionMode = 'wand';
      
      app.drawing.tools.setSelectionCompositeLayerMask(selection, s);
    }
  }
  
  let self = {
    fill,
  };
  
  return self;
}