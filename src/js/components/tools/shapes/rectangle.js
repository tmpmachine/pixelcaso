function Rectangle(config) {
  
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
        // ctx.beginPath();
        // ctx.lineWidth = "1";
        // ctx.rect(lastX, lastY, cursor.x, cursor.y);
        // ctx.stroke();
        // app.drawing.UIContext.(app.drawing.tools.utility.pencil.context.canvas, x-Math.floor(config.lineWidth/2), y-Math.floor(config.lineWidth/2));
        
        // drawLineBetween(lastX, lastY, cursor.x, cursor.y, fillPreview);
        drawLineBetween(lastX, lastY, cursor.x, lastY, fillPreview);
        drawLineBetween(lastX, lastY, lastX, cursor.y, fillPreview);
        drawLineBetween(lastX, cursor.y, cursor.x, cursor.y, fillPreview);
        drawLineBetween(cursor.x, lastY, cursor.x, cursor.y, fillPreview);
        // drawLineBetween(lastX, cursor.y, cursor.x, cursor.y, fillPreview);
      }
    } else if (mouseEvt == 'end') {
      if (isDrag) {
        isDrag = false;
        app.drawing.clearUI();
        // let ctx = app.drawing.context;
        // ctx.beginPath();
        // ctx.lineWidth = "1";
        // ctx.rect(lastX, lastY, cursor.x, cursor.y);
        
        drawLineBetween(lastX, lastY, cursor.x, lastY, fill);
        drawLineBetween(lastX, lastY, lastX, cursor.y, fill);
        drawLineBetween(lastX, cursor.y, cursor.x, cursor.y, fill);
        drawLineBetween(cursor.x, lastY, cursor.x, cursor.y, fill);
        // ctx.stroke();
        // drawLineBetween(lastX, lastY, cursor.x, cursor.y, fill);
        app.drawing.recordAction();
        record(cursor);
        app.drawing.tools.unlock();
        animator.onframeupdate(app.drawing.frame.getFrameIndex());
      }
    }
  }
  
  // EFLA algorithm
  // THE EXTREMELY FAST LINE ALGORITHM Variation E (Addition Fixed Point PreCalc)
  function drawLineBetween(x, y, x2, y2, callback) {

   	let yLonger=false;
	  let shortLen=y2-y;
	  let longLen=x2-x;
	
	  if (Math.abs(shortLen)>Math.abs(longLen)) {
		  let swap=shortLen;
		  shortLen=longLen;
		  longLen=swap;
		  yLonger=true;
	  }
	  
	  let decInc;
	  if (longLen==0) decInc=0;
	  else decInc = (shortLen << 16) / longLen;

  	if (yLonger) {
  		if (longLen>0) {
  			longLen+=y;
  			for (let j=0x8000+(x<<16);y<=longLen;++y) {
  				callback(j >> 16,y);	
  				j+=decInc;
  			}
  			return;
  		}
  		longLen+=y;
  		for (let j=0x8000+(x<<16);y>=longLen;--y) {
  			callback(j >> 16,y);	
  			j-=decInc;
  		}
  		return;	
  	}

  	if (longLen>0) {
  		longLen+=x;
  		for (let j=0x8000+(y<<16);x<=longLen;++x) {
  			callback(x,j >> 16);
  			j+=decInc;
  		}
  		return;
  	}
  	
  	longLen+=x;
  	
  	for (let j=0x8000+(y<<16);x>=longLen;--x) {
  		callback(x,j >> 16);
  		j-=decInc;
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
      drawLineBetween(p.x1, p.y1, p.x2, p.y1, fill);
      drawLineBetween(p.x1, p.y1, p.x1, p.y2, fill);
      drawLineBetween(p.x1, p.y2, p.x2, p.y2, fill);
      drawLineBetween(p.x2, p.y1, p.x2, p.y2, fill);
    }
  }
  
  return {
    draw,
    drawBatch,
    drawLineBetween,
  };
}