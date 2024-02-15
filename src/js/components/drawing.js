function Drawing() {
  
  let SELF = {
    cancelDrawCursor: false,
    defaultZoomPadding: 96,
  };
  let _ = {
    tmpCursorEvent: null,
    totalWheelDeltaY: 0,
    frameWidthScaledZoom: 0,
  };
  
  let frame = Frame();
  let tools = Tools();
  let onionSkin = true;
  let baseCanvas = {
    width: 580,
    height: 580,
  };
  let oldCursorX, oldCursorY;
  let isDrag = false;
  let cursor = { x: -1, y: -1 };
  let relativeCursor = { x: -1, y: -1 };
  let screenCursor = { x: -1, y: -1 };
  let finalCtx = DOM.canvas.getContext('2d');
  finalCtx.imageSmoothingEnabled = false;
  let destCtx = frame.createDrawingContext();
  let bound = DOM.canvas.getBoundingClientRect();
  let grid = document.createElement('canvas');
  let gridChunksCtx = frame.createDrawingContext(64, 64);
  let tmpFrameCanvas = frame.createDrawingContext();
  
  function initGridWorkCanvas() {
    
    let pixelSize = 8;
    let c = gridChunksCtx;
    let totalGridX = 16;
    let totalGridY = 16;
    
    c.fillStyle = '#bcbcbc';
    c.fillRect(0, 0, grid.width, grid.height);
    c.fillStyle = '#9c9c9c';
    for (let i=0; i<totalGridX; i++) {
      if (i%2==0) {
        let j =0;
        while (j < totalGridY) {
          if (j%2==0)
            c.fillRect(i*pixelSize,j*pixelSize,pixelSize,pixelSize);
          j++;
        }
      } else {
        let j =0;
        while (j < totalGridY) {
          if ((j+1)%2==0)
            c.fillRect(i*pixelSize,j*pixelSize,pixelSize,pixelSize);
          j++;
        }
      }
    }
    
    cacheGridWorkCanvas(c);
  }
  
  function cacheGridWorkCanvas(gcc) {
    let gridCanvas = document.createElement('canvas');
    gridCanvas.width = 32;
    gridCanvas.height = 32;
    let c = gridCanvas.getContext('2d');
    let chunkSize = 16;
    // c.fillStyle = 'white';
    // c.fillRect(0, 0, grid.width, grid.height);
    // for (let i=frame.width, j=0; i>0; i-=chunkSize) {
    //   for (let k=frame.height, l=0; k>0; k-=chunkSize) {
    //     c.drawImage(gcc.canvas, j*chunkSize, l*chunkSize);
    //     l++;
    //   }
    //   j++;
    // }
    // asd(gcc.canvas.toDataURL())
    // asd(c.canvas.toDataURL())
    // $('#work-canvas-container')[0].style.background = 'url('+gridCanvas.toDataURL()+')';
    $('#work-canvas-container')[0].style.background = 'url('+gcc.canvas.toDataURL()+')';
  }
  
  function initGrid() {
    
    let pixelSize = 1;
    let c = gridChunksCtx;
    let totalGridX = Math.ceil(c.canvas.width/pixelSize);
    let totalGridY = Math.ceil(c.canvas.height/pixelSize);
    
    c.fillStyle = '#ececec';
    c.clearRect(0, 0, grid.width, grid.height);
    for (let i=0; i<totalGridX; i++) {
      if (i%2==0) {
        let j =0;
        while (j < totalGridY) {
          if (j%2==0)
            c.fillRect(i*pixelSize,j*pixelSize,pixelSize,pixelSize);
          j++;
        }
      } else {
        let j =0;
        while (j < totalGridY) {
          if ((j+1)%2==0)
            c.fillRect(i*pixelSize,j*pixelSize,pixelSize,pixelSize);
          j++;
        }
      }
    }
    
    cacheGrid();
  }
  
  function cacheGrid() {
    grid.width = frame.width;
    grid.height = frame.height;
    let c = grid.getContext('2d');
    let chunkSize = gridChunksCtx.canvas.width;
    c.fillStyle = 'white';
    c.fillRect(0, 0, grid.width, grid.height);
    for (let i=frame.width, j=0; i>0; i-=chunkSize) {
      for (let k=frame.height, l=0; k>0; k-=chunkSize) {
        c.drawImage(gridChunksCtx.canvas, j*chunkSize, l*chunkSize);
        l++;
      }
      j++;
    }
  }
  
  function resizeBaseCanvas(width, height) {
    baseCanvas.width = width;
    baseCanvas.height = height;
    finalCtx.canvas.width = width;
    finalCtx.canvas.height = height;
    finalCtx.imageSmoothingEnabled = false;
    finalCtx.fillStyle = '#393e46';
    destCtx.fillStyle = '#393e46';
    destCtx.imageSmoothingEnabled = false;
    SELF.redraw();
  }
  
  function resizeDrawingCanvas(width, height) {
    destCtx.canvas.width = width;
    destCtx.canvas.height = height;
    destCtx.fillStyle = '#393e46';
    destCtx.imageSmoothingEnabled = false;
  }
  
  function generateSelectBox() {
    let canvas = document.createElement('canvas');
    canvas.width = 0;
    canvas.height = 0;
    let ctx = canvas.getContext('2d');
    window.stripLineX = document.createElement('canvas');
    let size = 1000;
    stripLineX.width = size;
    stripLineX.height = 1;
    let x = stripLineX.getContext('2d');
    x.imageSmoothingEnabled = false;
    
    let i = 0;
    while (i < stripLineX.width) {
      if (i%2 == 0) {
        x.fillStyle = 'black';
        x.fillRect(i*5,0,5,1);
      } else {
        x.fillStyle = 'white';
        x.fillRect(i*5,0,5,1);
      }
      i++;
    }
    
    window.stripLineY = document.createElement('canvas');
    stripLineY.width = 1;
    stripLineY.height = size;
    let y = stripLineY.getContext('2d');
    y.imageSmoothingEnabled = false;
    i = 0;
    while (i < stripLineY.height) {
      if (i%2 == 0) {
        y.fillStyle = 'white';
        y.fillRect(0,i*5,1,5);
      } else {
        y.fillStyle = 'black';
        y.fillRect(0,i*5,1,5);
      }
      i++;
    }
    window.selCanvas = canvas;
  }
  
  function resizeSelectBox(width, height, targetScale) {
    let _scale = scale;
    if (targetScale !== undefined)
      _scale = targetScale;
    let canvas = window.selCanvas;
    if (width === undefined)
      width = canvas.width
    if (height === undefined)
      height = canvas.height
    width++
    height++
    canvas.width = width*_scale;
    canvas.height = height*_scale;
    let c = canvas.getContext('2d');
    c.imageSmoothingEnabled = false;
    let i = 0;
    let stripW = (stripLineX.width-2*10);
    while (i * stripLineX.width < canvas.width) {
      c.drawImage(window.stripLineX, i*stripW+_scale, _scale);
      c.drawImage(window.stripLineX, i*stripW+_scale, height*_scale-1);
      i++;
    }
    i = 0;
    let stripH = (stripLineY.height-2*10);
    while (i * stripLineY.height < canvas.height) {
      c.drawImage(window.stripLineY, 1*_scale, i*stripH+_scale);
      c.drawImage(window.stripLineY, width*_scale-1, i*stripH+_scale);
      i++;
    }
  }
  
  function resizeSelectWandBox(width, height) {
    // return
    return
    let canvas = window.selCanvas;
    // document.body.append(canvas)
    canvas.style.background ='white'
    canvas.style.opacity = 0.5
    canvas.style.top = 0;
    canvas.style.position = 'fixed'
    canvas.style.zIndex = '123123123'
    canvas.width = (width+2)*scale;
    canvas.height = (height+2)*scale;
    let c = canvas.getContext('2d');
    c.imageSmoothingEnabled = false;
    
    let s = app.drawing.frame.wandSections;
    let s2 = app.drawing.frame.wandSectionsX
    
    // clearUI();
    app.drawing.UIContext.fillStyle = '#94bde099';
    for (let i=0; i<s.length; i++) {
      app.drawing.UIContext.fillRect(s[i].x, s[i].y, 1, s[i].h);
      // app.drawing.UIContext.drawImage(window.stripLineY, s[i].x, s[i].y);
    }
    SELF.redraw();
    return
    
    // finalCtx.drawImage(app.drawing.UIContext.canvas, Math.floor((x-1+camx)*scale), Math.floor((y-1+camy)*scale))
        
        let sel = tools.utility.select.getSelection();
    // let xx = Math.floor((x-1+camx)*scale);
    // let yy = Math.floor((y-1+camy)*scale);
    // L(s.length)
    for (let i=0; i<s.length; i++) {
      c.drawImage(window.stripLineX, 0,0, scale, scale, 
                  (s[i].x-sel.x)*scale+scale, (s[i].y-sel.y)*scale+scale, scale, scale);
      c.drawImage(window.stripLineX, 0,0, scale, scale, 
                  (s[i].x-sel.x)*scale+scale, (s[i].y+s[i].h-sel.y)*scale+scale-1, scale, scale);
    }
    // return
    // for (let i=0; i<s2.length; i++) {
    //   c.drawImage(window.stripLineY, 0,0, scale, scale, 
    //               (s2[i].x-sel.x)*scale+scale, (s2[i].y-sel.y)*scale+scale, scale, scale);
    //   c.drawImage(window.stripLineY, 0,0, scale, scale, 
    //               (s2[i].x+s2[i].w-sel.x)*scale+scale-1, (s2[i].y-sel.y)*scale+scale, scale, scale);
    // }
  }
  
  function getCanvasSize() {
    return frame.width;
  }
  
  SELF.zoom = function(targetScale, isCenterCanvas = false) {
    let x = screenCursor.x;
    let y = screenCursor.y;
    cam.x = cam.x*targetScale/scale - ((x-bound.x) - (x-bound.x)*targetScale/scale);
    cam.y = cam.y*targetScale/scale - ((y-bound.y) - (y-bound.y)*targetScale/scale);
    cam.x = Math.max(-DOM.canvas.width + (2*targetScale), cam.x);
    cam.x = Math.min(app.drawing.frame.width*targetScale - 2*targetScale, cam.x);
    cam.y = Math.max(-DOM.canvas.height + 2*targetScale, cam.y);
    cam.y = Math.min(app.drawing.frame.height*targetScale - 2*targetScale, cam.y);
    let sel = tools.utility.select.getSelection();
    resizeSelectBox(sel.w, sel.h, targetScale);
    SELF.redraw();
  };
  
  function rebound() {
    bound = DOM.canvas.getBoundingClientRect();
  }
  
  function cursorAction(action, e) {
    cursor = getBoxAt(e);
    screenCursor.x = e.clientX;
    screenCursor.y = e.clientY;
    relativeCursor.x = Math.floor((e.pageX-bound.x+cam.x)/scale);
    relativeCursor.y = Math.floor((e.pageY-bound.y+cam.y)/scale);
    tools.apply({
      action,
      isDrag,
    });
  }
  
  function getCursor() {
    return cursor;
  }
  
  function getScreenCursor() {
    return screenCursor;
  }
  
  function getRelativeCursor() {
    return relativeCursor;
  }
  
  function resizeCanvas(width, height, isRecord = false) {
    if (isRecord) {
      let history = {
        type: 'resize',
        data: {
          origin: {
            w: app.drawing.frame.width,
            h: app.drawing.frame.height,
          },
          target: {
            w: width,
            h: height,
          },
          canvasCache: [],
        },
        frameIndex: app.drawing.frame.getFrameIndex(),
        layerId: app.layer.activeLayerId,
      };
      // cache previous canvas drawing
      if (history.data.target.w < history.data.origin.w || history.data.target.h < history.data.origin.h) {
        for (let layer of app.layer.layers) {
          if (!layer.isVisible)
            continue;
          let frameIndex = 0;
          for (let frame of layer.frames) {
            if (frame) {
              let c = app.drawing.frame.createDrawingContext();
              c.drawImage(frame.canvas, 0, 0);
              history.data.canvasCache.push({
                frameIndex,
                layerId: layer.id,
                canvas: c.canvas,
              });
            }
            frameIndex ++;
          }
        }
      }
      
      app.undoManager.startRecording(history);
      app.undoManager.stopRecording();
    }
    
    app.drawing.frame.width = width;
    app.drawing.frame.height = height;
    resizeDrawingCanvas(app.drawing.frame.width, app.drawing.frame.height);
    resizeContextCanvas(app.drawing.frame.getUIContext());
    resizeContextCanvas(app.drawing.frame.getSelectionUIContext());
    resizeContextCanvas(tmpFrameCanvas);
    for (let layer of app.layer.layers) {
      for (let frame of layer.frames) {
        if (frame) {
          clearContext(tmpFrameCanvas);
          tmpFrameCanvas.drawImage(frame.canvas, 0, 0);
          resizeContextCanvas(frame);
          frame.drawImage(tmpFrameCanvas.canvas,0,0);
        }
      }
    }
    resetZoomScaleLevel();
    cacheGrid();
    resizeGridGuidelines();
    SELF.redraw();
  }
  
  function resetZoomScaleLevel() {
    _.totalWheelDeltaY = 0;
    _.frameWidthScaledZoom = app.drawing.frame.width * scale;
  }
  
  function clearContext(ctx) {
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
  }
  
  function resizeContextCanvas(context) {
    context.canvas.width = app.drawing.frame.width;
    context.canvas.height = app.drawing.frame.height;
  }
  
  function clearUI() {
    SELF.UIContext.clearRect(0, 0, frame.width, frame.height);
    SELF.selectionUIContext.clearRect(0, 0, frame.width, frame.height);
  }
  
  function drawCursor() {
    let lineWidth = app.drawing.tools.isResetLineWidth ? 1 : app.drawing.tools.config.lineWidth;
    let canvas = frame.getCursorContext().canvas;
    let cursorX = relativeCursor.x-Math.floor(lineWidth/2);
    let cursorY = relativeCursor.y-Math.floor(lineWidth/2);
    // destCtx.drawImage(canvas, cursorX, cursorY);
    finalCtx.drawImage(canvas, 0, 0, lineWidth, lineWidth, -cam.x+cursorX*scale, -cam.y+cursorY*scale, lineWidth*scale, lineWidth*scale);
  }
  
  function exportFrame() {
    let c = frame.createDrawingContext();
        
    let layers = frame.getKeyFrame().layers;
    for (let i=0; i<layers.length; i++) {
      if (!layers[i].isVisible) 
        continue;
      c.drawImage(layers[i].c.canvas, 0, 0);
    }
    return c.canvas;
  }
  
  function drawLayers(screen, frameIndex, onionAlpha = 0) {
    let layers = app.layer.layers;
    for (let i=layers.length-1; i>=0; i--) {
      if (!layers[i].isVisible) 
        continue;
      if (layers[i].frames[frameIndex]) {
        destCtx.globalAlpha = Math.max(0, layers[i].alpha + onionAlpha);
        destCtx.drawImage(layers[i].frames[frameIndex].canvas, screen.draw.x, screen.draw.y, screen.draw.w, screen.draw.h, screen.draw.x, screen.draw.y, screen.draw.w, screen.draw.h);
      }
      if (i == app.layer.activeLayerIndex) {
        if (app.drawing.tools.utility.move.isDrag)
          destCtx.globalAlpha = 0.6;
        destCtx.drawImage(frame.getUIContext().canvas, 
          screen.draw.x, screen.draw.y, screen.draw.w, screen.draw.h, 
          screen.draw.x, screen.draw.y, screen.draw.w, screen.draw.h);
        destCtx.globalAlpha = 1;
      }
    }
    
    destCtx.drawImage(frame.getSelectionUIContext().canvas, 
        screen.draw.x, screen.draw.y, screen.draw.w, screen.draw.h, 
        screen.draw.x, screen.draw.y, screen.draw.w, screen.draw.h);
    
    destCtx.globalAlpha = 1;
  }
  
  function drawOnionLayers(screen, frameIndex, onionAlpha = 0) {
    let layers = app.layer.layers;
    for (let i=layers.length-1; i>=0; i--) {
      if (!layers[i].isVisible) 
        continue;
      if (layers[i].frames[frameIndex]) {
        destCtx.globalAlpha = Math.max(0, layers[i].alpha + onionAlpha);
        destCtx.drawImage(layers[i].frames[frameIndex].canvas, screen.draw.x, screen.draw.y, screen.draw.w, screen.draw.h, screen.draw.x, screen.draw.y, screen.draw.w, screen.draw.h);
      }
    }
    destCtx.globalAlpha = 1;
  }
  
  function getScreenInfo() {
    let camx = cam.x/scale;
    let camy = cam.y/scale;
    let visiblePixelX = baseCanvas.width/scale;
    let visiblePixelY = baseCanvas.height/scale;
    let x1 = Math.floor(Math.max(cam.x/scale, 0));
    let x2 = Math.ceil(Math.min(frame.width, frame.width - ((-camx+frame.width)-visiblePixelX)));
    let y1 = Math.floor(Math.max(cam.y/scale, 0));
    let y2 = Math.ceil(Math.min(frame.height, frame.height - ((-camy+frame.height)-visiblePixelY)));
    let draw = {
      x: x1,
      y: y1,
      w: x2-x1,
      h: y2-y1,
    };
    return {
      draw,
    };
  }
  
  let elGridGuidelines = $I('#js-grid-guidelines');
  let elGridPixelGuidelines = $I('#js-grid-pixel-guidelines');
  function resizeGridGuidelines() {
    elGridGuidelines.style.width = frame.width * 16;
    elGridGuidelines.style.height = frame.height * 16;
    elGridPixelGuidelines.style.width = frame.width * 16;
    elGridPixelGuidelines.style.height = frame.height * 16;
  }
  
  
  SELF.redraw = function(isMoved = true) {
    let lineWidth = tools.selectedTool == 'picker' ? 1 : tools.config.lineWidth;
    let cursorX = relativeCursor.x-Math.floor(lineWidth/2);
    let cursorY = relativeCursor.y-Math.floor(lineWidth/2);
    if (cursorX != oldCursorX || cursorY != oldCursorY) {
      isMoved = true;
      oldCursorX = cursorX;
      oldCursorY = cursorY;
    } 

    if (!isMoved)
      return;
      
    let screen = getScreenInfo();
    let camx = -cam.x/scale;
    let camy = -cam.y/scale;

    finalCtx.fillRect(0, 0, baseCanvas.width, baseCanvas.height);
    destCtx.clearRect(screen.draw.x, screen.draw.y, screen.draw.w, screen.draw.h);
    // destCtx.drawImage(grid, screen.draw.x, screen.draw.y, screen.draw.w, screen.draw.h, screen.draw.x, screen.draw.y, screen.draw.w, screen.draw.h);
    
    let frameIndex = frame.getFrameIndex();
    if (onionSkin) {
      if (frameIndex > 0) {
        // destCtx.globalAlpha = 0.5;
        let onionAlpha = -0.5;
        drawOnionLayers(screen, frameIndex-1, onionAlpha);
        // destCtx.globalAlpha = 1;
      }
    }
    drawLayers(screen, frameIndex);
    
    
    // finalCtx.drawImage(grid, screen.draw.x, screen.draw.y, screen.draw.w, screen.draw.h, cam.x+screen.draw.x*scale, cam.y+screen.draw.y*scale, screen.draw.w*scale, screen.draw.h*scale);
    finalCtx.clearRect(-cam.x+screen.draw.x*scale, -cam.y+screen.draw.y*scale, screen.draw.w*scale, screen.draw.h*scale);
    finalCtx.drawImage(destCtx.canvas, screen.draw.x, screen.draw.y, screen.draw.w, screen.draw.h, -cam.x+screen.draw.x*scale, -cam.y+screen.draw.y*scale, screen.draw.w*scale, screen.draw.h*scale);
    
    if (app.preferences.data.mirror == 'x') {
      drawMirrorX(cam);
    }
    
    if (window.selCanvas) {
      let sel = tools.utility.select.getSelection();
      if (!sel.isEmpty) {
        let x = sel.x;
        let y = sel.y;
        if (tools.utility.move.isWaitingDrop) {
          let pos = tools.utility.move.getTargetDropPosition();
          x = pos.x; 
          y = pos.y; 
        }
        // todo: draw wand selection highlight border
        // if (app.drawing.tools.selectionMode == 'rectangular') {
          // app.drawing.tools.utility.select.isDrag
          finalCtx.drawImage(window.selCanvas, Math.floor((x-1+camx)*scale), Math.floor((y-1+camy)*scale));
          // $('#resizer')[0].style.left = Math.floor((x-1+camx)*scale)+'px'
          // $('#resizer')[0].style.top = Math.floor((y-1+camy)*scale)+'px'
          // $('#center-selection')[0].style.left = Math.floor((x+sel.w/2+camx)*scale)-4+'px'
          // $('#center-selection')[0].style.top = Math.floor((y+sel.h/2+camy)*scale)-4+'px'
        // } else if (app.drawing.tools.selectionMode == 'wand') {
          // drawWandSelectionBorder(x,y,camx,camy)
        // }
      }
    }
    
    if (SELF.cancelDrawCursor || tools.selectedTool == 'hand') {
      SELF.cancelDrawCursor = false;
    } else {
      drawCursor();
    }
    SELF.updateGridGuidelinesPosition();
  };
  
  SELF.updateGridGuidelinesPosition = function() {
    if (window.app.settings.data.view.showGrid)
      elGridGuidelines.style.transform = `scale(${scale/16}) translate(${-cam.x/(scale/16)}px, ${-cam.y/(scale/16)}px)`;
    if (window.app.settings.data.view.showGridPixel)
      elGridPixelGuidelines.style.transform = `scale(${scale/16}) translate(${-cam.x/(scale/16)}px, ${-cam.y/(scale/16)}px)`;
  };
  
  let tempScale = null;
  let tempCamX = null;
  let tempCamY = null;
  SELF.setTempScale = function(val) {
    tempScale = val;
  };
    
  
  SELF.resetZoom = function() {
    let x1 = (parseFloat($I('#canvas').width) - SELF.defaultZoomPadding) / app.drawing.frame.width;
    let x2 = (parseFloat($I('#canvas').height) - SELF.defaultZoomPadding) / app.drawing.frame.height;
    let targetScale = Math.min(x1, x2);
    
    let isCenter = false;
    if (tempScale != null) {
      targetScale = tempScale;
      SELF.setTempScale(null);
    } else {
      SELF.setTempScale(scale);
      isCenter = true;
      tempCamX = cam.x;
      tempCamY = cam.y;
    }
    SELF.zoom(targetScale);
    scale = targetScale;
    if (isCenter) {
      centerCanvas(scale);
    } else {
      cam.x = tempCamX*1;
      cam.y = tempCamY*1;
    }
    SELF.redraw();
    resetZoomScaleLevel();
  };
  
  function drawMirrorX(cam) {
    finalCtx.drawImage(destCtx.canvas, 
      0, 0, app.drawing.frame.width, app.drawing.frame.height, 
      -cam.x+app.drawing.frame.width*-1*scale, -cam.y, app.drawing.frame.width*scale, app.drawing.frame.height*scale);
    
    // mirror right  
    finalCtx.drawImage(destCtx.canvas, 
      0, 0, app.drawing.frame.width, app.drawing.frame.height, 
      -cam.x+app.drawing.frame.width*scale, -cam.y, app.drawing.frame.width*scale, app.drawing.frame.height*scale);
  }
  
  function drawWandSelectionBorder(x,y,camx,camy) {
    let s = app.drawing.frame.wandSections;
    let s2 = app.drawing.frame.wandSectionsX;
    
    clearUI();
    app.drawing.UIContext.fillStyle = '#94bde099';
    for (let i=0; i<s.length; i++) {
      app.drawing.UIContext.fillRect(s[i].x, s[i].y, 1, s[i].h);
    }
    
    let xx = Math.floor((x-1+camx)*scale);
    let yy = Math.floor((y-1+camy)*scale);
    for (let i=0; i<s.length; i++) {
      finalCtx.drawImage(window.stripLineX, 0,0,scale,scale,xx+s[i].x*scale, (s[i].y+y)*scale, scale, scale);
      finalCtx.drawImage(window.stripLineX, 0,0,scale,scale,xx+s[i].x*scale, (s[i].y+s[i].h+y)*scale, scale, scale);
    }
    for (let i=0; i<s2.length; i++) {
      finalCtx.drawImage(window.stripLineY, 0,0,scale,scale, xx+s2[i].x*scale, (s2[i].y+y)*scale, scale, scale);
      finalCtx.drawImage(window.stripLineY, 0,0,scale,scale, xx+(s2[i].x+s2[i].w)*scale, (s2[i].y+y)*scale, scale, scale);
    }
  }
  
  function redoInsertLayer(history) {
    let layers = app.layer.layers;
    let undoLayer = app.undoManager.undoLayers.pop();
    let layer = undoLayer.layer;
    layers.splice(undoLayer.popIndex, 0, layer);
    ui.layer.append(layer);
    app.layer.change(layer.id);
  }
  
  function redoDuplicateLayer(history) {
    let layers = app.layer.layers;
    let undoLayer = app.undoManager.undoLayers.pop();
    let layer = undoLayer.layer;
    layers.splice(undoLayer.popIndex, 0, layer);
    ui.layer.append(layer);
    app.layer.change(layer.id);
  }
  
  function redoDeleteLayer(history) {
    let isStoreHistory = false;
    app.layer.delete(history.data.layerId, isStoreHistory);
  }
  
  function redoDeleteFrame(history) {
    let frames = app.drawing.frame.frames;
    let popIndex = history.data.popIndex;
    let deletedFrame = frames.splice(popIndex, 1)[0];
    app.undoManager.deletedFrames.push({
      frame: deletedFrame,
      popIndex,
    });
    
    app.drawing.frame.goToFrame(history.data.targetFrameIndex);
    app.drawing.frame.goToLayer(app.drawing.frame.getLayerId());
  }
  
  function redoResize(history) {
    let w = frame.width;
    let h = frame.width;
    if (w != history.data.target.w || h != history.data.target.h)
      resizeCanvas(history.data.target.w, history.data.target.h);
    centerCanvas(scale);
  }
  
  function redoCropToSelection(history) {
    cropToSelection(history.data.target);
    centerCanvas(scale);
  }
  
  function redoExecuteTools(history) {
    tools.changeLineWidth(history.lineWidth);
    tools.applyBatch(history);
  }
  
  function redo(pointer) {
    let undoStack = app.undoManager.getUndoStack();
    let history = undoStack[pointer];
    frame.goToFrame(history.frameIndex);  
    frame.goToLayer(history.layerId);
    let isClearSel = true;
    let stack = history;
    switch (history.type) {
      case 'insert-layer': redoInsertLayer(history); break;
      case 'duplicate-layer': redoDuplicateLayer(history); break;
      case 'delete-layer': redoDeleteLayer(history); break;
      case 'delete-frame': redoDeleteFrame(history); break;
      case 'rename-layer': restoreNewNameLayer(history); break;
      case 'move-layer': redoMoveLayer(history); break;
      case 'toggle-visibility': redoToggleLayerVisibility(history); break;
      case 'resize': redoResize(history); break;
      case 'crop-to-selection': redoCropToSelection(history); isClearSel = false; break;
      case 'delete': deleteSelection(history); break;
      case 'import': drawImportedImage(history); break;
      case 'flip-horizontal': redoFlipHorizontal(history); isClearSel = false; break;
      case 'flip-vertical': redoFlipVertical(history); isClearSel = false; break;
      case 'set-alpha': app.layer.redoSetAlpha(history); break;
      default: redoExecuteTools(history);
    }
    return isClearSel;
  }
  
  function redoMoveLayer(history) {
    if (history.data.direction == 'down') {
      app.layer.moveDown(history.layerId, false);
    } else {
      app.layer.moveUp(history.layerId, false);
    }
  }
  
  function deleteSelection(history) {
    let sel = history.data.sel;
    let selectionMode = history.data.selectionMode;
    if (selectionMode == 'wand') {
      let wandSections = JSON.parse(JSON.stringify(history.data.wandSections));
      for (let i=0; i<wandSections.length; i++) {
        frame.getContext().clearRect(wandSections[i].x, wandSections[i].y, 1, wandSections[i].h);
      }
    } else if (selectionMode == 'rectangular') {
      frame.getContext().clearRect(sel.x, sel.y, sel.w, sel.h);
    }
  }
  
  function drawImportedImage(history) {
    frame.getContext().drawImage(frame.importedImages[history.imgIndex], 0, 0);
  }
    
  function undoAction(pointerStart, pointer, undoStack, frameIndex, layerId) {
    // handle special case: restore crop to  selection history
    for (let i=pointer; i>=pointerStart; i--) {
      let history = undoStack[i];
      if (history.type == 'crop-to-selection') {
        undoCropToSelection(history);
      }
    }
    
    for (let i=pointerStart; i<pointer; i++) {
      let history = undoStack[i];
      if (history.layerId != layerId || history.frameIndex != frameIndex)
        continue;
      switch (history.type) {
        case 'flip-horizontal': undoFlipHorizontal(history); break;
        case 'flip-vertical': undoFlipVertical(history); break;
        case 'delete': deleteSelection(history); break;
        case 'import': drawImportedImage(history); break;
        case 'crop-to-selection': cropToSelection(history.data.target, false); break;
        default:
          tools.changeLineWidth(history.lineWidth);
          tools.applyBatch(history);
      }
    }
  }

  function undoInsertLayer(history) {
    let layers = app.layer.layers;
    let layerIndex = frame.getLayerIndex(history.layerId);
    let layer = layers.splice(layerIndex, 1)[0];
    app.undoManager.undoLayers.push({
      layer,
      popIndex: layerIndex,
    });
    if (app.layer.layers.length > 0)
      app.layer.change(history.data.srcLayerId);
    else
      app.layer.setUIState();
    ui.layer.removeLayer(layer.id);
  }
  
  function undoDuplicateLayer(history) {
    let layers = app.layer.layers;
    let layerIndex = frame.getLayerIndex(history.layerId);
    let layer = layers.splice(layerIndex, 1)[0];
    app.undoManager.undoLayers.push({
      layer,
      popIndex: layerIndex,
    });
    if (app.layer.layers.length > 0)
      app.layer.change(history.data.srcLayerId);
    else
      app.layer.setUIState();
    ui.layer.removeLayer(layer.id);
  }
  
  function undoDeleteLayer(history) {
    let layers = app.layer.layers;
    let data = app.undoManager.deletedLayers.pop();
    let layer = data.layer;
    layers.splice(data.popIndex, 0, layer);
    // frame.goToLayer(layer.id)
    ui.layer.appendTo(layer, data.popIndex);
    uiMobile.layer.undoDelete(layer, data.popIndex);
    app.layer.change(layer.id);
    window.ui.layer.highlightLayer(layer.id);
  }
  
  function undoDeleteFrame(history) {
    let frames = app.drawing.frame.frames;
    let data = app.undoManager.deletedFrames.pop();
    let frame = data.frame;
    frames.splice(data.popIndex, 0, frame);
    app.drawing.frame.goToFrame(history.frameIndex);
    SELF.redraw();
  }
  
  function undoResize(history) {
    let w = frame.width;
    let h = frame.width;
    if (w != history.data.origin.w || h != history.data.origin.h)
      resizeCanvas(history.data.origin.w, history.data.origin.h);
    centerCanvas(scale);
    
    for (let cache of history.data.canvasCache) {
      let layer = app.layer.getLayerById(cache.layerId);
      let frame = layer.frames[cache.frameIndex];
      frame.clearRect(0,0,frame.canvas.width,frame.canvas.height);
      frame.drawImage(cache.canvas,0,0);
      for (let frame of layer.frames) {
        if (frame) {
          clearContext(tmpFrameCanvas);
          tmpFrameCanvas.drawImage(frame.canvas, 0, 0);
          resizeContextCanvas(frame);
          frame.drawImage(tmpFrameCanvas.canvas,0,0);
        }
      }
    }
    
  }
  
  function undoCropToSelection(history) {
    let w = frame.width;
    let h = frame.width;
    resizeCanvas(history.data.origin.w, history.data.origin.h);
    centerCanvas(scale);
    
    for (let cache of history.data.canvasCache) {
      let layer = app.layer.getLayerById(cache.layerId);
      let frame = layer.frames[cache.frameIndex];
      frame.clearRect(0,0,frame.canvas.width,frame.canvas.height);
      frame.drawImage(cache.canvas,0,0);
      for (let frame of layer.frames) {
        if (frame) {
          clearContext(tmpFrameCanvas)
          tmpFrameCanvas.drawImage(frame.canvas, 0, 0);
          resizeContextCanvas(frame);
          frame.drawImage(tmpFrameCanvas.canvas,0,0);
        }
      }
    }
    
    app.drawing.tools.utility.select.setSelection(history.data.target);
  }
  
  
  function goToHistory(type, data) {
    // save current setting
    let setting = {
      primaryColor: tools.utility.pencil.getColor(),
      lineWidth: tools.config.lineWidth,
    };
    
    let isClearSel = true;
    if (type == 'undo')
      isClearSel = undo(data.startPointer, data.pointer, data.canvas);
    else if (type == 'redo')
      isClearSel = redo(data.pointer);
    
    if (isClearSel) {
    // clear selection 
      frame.clearSelection();
      tools.utility.select.clearSelection();
    }
    
    SELF.redraw();
    
    let undoStack = app.undoManager.getUndoStack();
    let history = undoStack[data.pointer];
    animator.onframeupdate(history.frameIndex);
    ui.layer.highlightFrame();
    // restore last config
    tools.utility.pencil.changeColor(setting.primaryColor);
    tools.changeLineWidth(setting.lineWidth);
  }
  
  function undo(pointerStart, pointer, undoCanvas) {
    let isClearSel = true;
    let undoStack = app.undoManager.getUndoStack();
    let history = undoStack[pointer];
    switch (history.type) {
      case 'set-alpha':
        app.layer.undoSetAlpha(history);
        break;
      case 'insert-layer':
        undoInsertLayer(history);
        break;
      case 'duplicate-layer':
        undoDuplicateLayer(history);
        break;
      case 'rename-layer':
        restoreOldNameLayer(history);
        break;
      case 'delete-layer':
        undoDeleteLayer(history);
        break;
      case 'delete-frame':
        undoDeleteFrame(history);
        break;
      case 'toggle-visibility':
        undoToggleLayerVisibility(history);
        break;
      case 'move-layer':
        undoMoveLayer(history);
        break;
      case 'flip-horizontal':
      case 'flip-vertical':
        frame.goToFrame(history.frameIndex);  
        frame.goToLayer(history.layerId);
        frame.clear();
        frame.getContext().drawImage(undoCanvas.canvas, 0, 0);
        isClearSel = false;
        app.drawing.tools.selectionMode = history.data.selectionMode;
        app.drawing.tools.utility.select.setSelection(history.data.sel);
        app.drawing.frame.wandSections = JSON.parse(JSON.stringify(app.drawing.frame.wandSections));
        app.drawing.frame.drawWandSelection(history.data.sel);
        break;
      case 'resize':
        undoResize(history);
        break;
      case 'crop-to-selection':
        isClearSel = false;
        undoCropToSelection(history);
        break;
      default: /* batch action */
        frame.goToFrame(history.frameIndex);  
        frame.goToLayer(history.layerId);
        frame.clear();
        if (undoCanvas) {
          if (undoCanvas.layerId == history.layerId)
            frame.getContext().drawImage(undoCanvas.canvas, 0, 0);
        }
        undoAction(pointerStart, pointer, undoStack, history.frameIndex, history.layerId);
    }
    return isClearSel;
  }
  
  function restoreOldNameLayer(history) {
    // frame.goToFrame(history.frameIndex);  
    let isStoreHistory = false;
    app.layer.renameLayer(history.layerId, isStoreHistory, history.data.oldName);
    ui.layer.rename(history.layerId, history.data.oldName);
  }
  
  function restoreNewNameLayer(history) {
    let isStoreHistory = false;
    app.layer.renameLayer(history.layerId, isStoreHistory, history.data.newName);
    ui.layer.rename(history.layerId, history.data.newName);
  }
  
  function undoToggleLayerVisibility(history) {
    frame.goToFrame(history.frameIndex);  
    let isStoreHistory = false;
    app.layer.toggleVisibility(history.data.layerId, isStoreHistory);
    // app.layer.list()
  }
  
  function redoToggleLayerVisibility(history) {
    let isStoreHistory = false;
    app.layer.toggleVisibility(history.data.layerId, isStoreHistory);
    // app.layer.list()
  }
  
  function undoMoveLayer(history) {
    if (history.data.direction == 'down') {
      app.layer.moveUp(history.layerId, false);
    } else {
      app.layer.moveDown(history.layerId, false);
    }
  }
  
  function undoFlipHorizontal(history) {
    app.drawing.frame.undoFlipHorizontal(history.data);
  }
  
  function undoFlipVertical(history) {
    app.drawing.frame.undoFlipVertical(history.data);
  }
  
  function redoFlipHorizontal(history) {
    app.drawing.frame.redoFlipHorizontal(history.data);
  }
  
  function redoFlipVertical(history) {
    app.drawing.frame.redoFlipVertical(history.data);
  }
   
  function getBoxAt(e) {
    return {
      x: Math.floor((e.pageX-bound.x)/scale),
      y: Math.floor((e.pageY-bound.y)/scale),
    };
  }
  
  function isOnCanvas() {
    return destCtx.fillRect(0, 0, Math.ceil(baseCanvas.width/scale), Math.ceil(baseCanvas.height/scale));
  }
  
  function recordAction() {
    let toolName = tools.selectedTool;
    let recordData = {
      toolName,
      type: 'tool',
      frameIndex: frame.getFrameIndex(),
      layerId: app.layer.activeLayerId,
      data: [],
      lineWidth: tools.config.lineWidth,
      color: tools.utility.pencil.getColor(),
    };
    let sel = tools.utility.select.getSelection();
    if (!sel.isEmpty) {
      recordData.sel = sel;
      recordData.wandSections = JSON.parse(JSON.stringify(app.drawing.frame.wandSections));
      recordData.selectionMode = app.drawing.tools.selectionMode;
    }
    
    app.undoManager.startRecording(recordData);
  }
  
  let delayCallback = null;
  let multi = false;
  let lockedId;
  
  function cursorHandler(e) {
    switch (e.type) {
      case 'touchstart':
      case 'mousedown':
        oncursorstart(e);
        break;
      case 'touchend':
      case 'mouseup':
        oncursorend(e);
        break;
      case 'touchmove':
      case 'mousemove':
        oncursormove(e);
        break;
    }
  }
  
  function oncursorstart(e) {
    _.tmpCursorEvent = e;
    if (e.which === 1 || e.changedTouches) {
      document.activeElement.blur();
      e.preventDefault();
      cursorStartEvt = e;
      window.clearTimeout(delayCallback);
      delayCallback = null;
      delayCallback = window.setTimeout(triggerCursorStart, 50);
    }
  }
  
  let cursorStartEvt = null;
  function triggerCursorStart() {
    let e = cursorStartEvt;
    isDrag = true;
    if (e.changedTouches) {
      if (e.touches.length > 1) {
        lockedTouch = e.touches[0].identifier;
        app.drawing.tools.selectTool('hand', true);
        multi = true;
      } else {
        if (multi) {
          multi = false;
        }
      }
      e = e.changedTouches[0];
      lockedId = e.identifier;
    }
    cursorAction('start', e);
  }
  
  // window.setInterval(() => {
    // asd(isDrag)
  // }, 100)
  
  function oncursorend(e) {
    isDrag = false;
    if (delayCallback) {
      window.clearTimeout(delayCallback);
      delayCallback = null;
      triggerCursorStart();
    }
    if (e.changedTouches) {
      for (let touch of e.changedTouches) {
        if (touch.identifier == lockedId){
          e = touch;
          cursorAction('end', e);
          if (multi) {
            app.drawing.tools.selectLastTool();
          }
        }
        app.undoManager.stopRecording();
      }
    } else {
      cursorAction('end', e);
      app.undoManager.stopRecording();
    }
  }
  
  function oncursormove(e) {
    _.tmpCursorEvent = e;
    if (e.changedTouches) {
      for (let touch of e.changedTouches) {
        if (touch.identifier == lockedId){
          e = touch;
          cursorAction('move', e);
        }
      }
    } else {
      cursorAction('move', e);
    }
  }
  
  function centerCanvas(scale) {
    cam.x = -(baseCanvas.width-scale*frame.width)/2;
    cam.y = -(baseCanvas.height-scale*frame.height)/2;
  }
  
  function setSettings() {
    onionSkin = DOM.settingOnion.checked;
  }
  
  function removeSelection(isRecord = true, selectionMode = app.drawing.tools.selectionMode) {
    let sel = tools.utility.select.getSelection();
    if (sel.isEmpty)
      return;
    
    if (selectionMode == 'wand') {
      // clear wand selection
      let wandSections = [];
      for (let i=0; i<marker.length; i++) {
        let x = marker[i].x;
        let y = marker[i].y;
        let h = 1;
        let j = i+1;
        while (j < marker.length && marker[j].x == x) {
          if (marker[j].y == y+h) {
            h++;
            j++;
          } else {
            break;
          }
        }
        i = j-1;
        wandSections.push({x,y,h});
      }
      
      for (let i=0; i<wandSections.length; i++) {
        frame.getContext().clearRect(wandSections[i].x, wandSections[i].y, 1, wandSections[i].h);
      }
    } else if (selectionMode == 'rectangular') {
      // clear rectangular selection
      frame.getContext().clearRect(sel.x, sel.y, sel.w, sel.h);
    }
    
    tools.utility.select.clearSelection();
    clearUI();
    SELF.redraw();
    animator.onframeupdate(app.drawing.frame.getFrameIndex());
    if (isRecord) {
      app.undoManager.startRecording({
        type: 'delete',
        data: {
          sel,
          selectionMode: app.drawing.tools.selectionMode,
          wandSections: JSON.parse(JSON.stringify(app.drawing.frame.wandSections)),
        },
        frameIndex: frame.getFrameIndex(),
        layerId: frame.getLayerId(),
      })
      app.undoManager.stopRecording();
    }
  }
  
  function dataURLToCanvas(dataURL) {
    return new Promise(resolve => {
      let img = new Image();
      img.src = dataURL;
      img.onload = function() {
        let canvas = document.createElement('canvas');
        let c = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        c.drawImage(img, 0, 0);
        resolve(c);
      };
    })
  }
  
  function cropToSelection(sel = null, isRecord = false) {
    if (sel == null) {
      sel = tools.utility.select.getSelection();
      if (sel.isEmpty) {
        return;
      }
    }

    if (sel.x >= frame.width || sel.y >= frame.height || sel.x + sel.w <= 0 || sel.y + sel.h <= 0) {
      return
    }


    if (sel.x < 0 && sel.x + sel.w > frame.width) 
      sel.w = frame.width;
    else if (sel.x + sel.w > frame.width) {
      sel.w = Math.min(sel.x + sel.w, frame.width) - sel.x;
    } else if (sel.x < 0) {
      sel.w = sel.w + sel.x;
    }
    
    if (sel.y < 0 && sel.y + sel.h > frame.height) 
      sel.h = frame.height;
    else if (sel.y + sel.h > frame.height) {
      sel.h = Math.min(sel.y + sel.h, frame.height) - sel.y;
    } else if (sel.y < 0) {
      sel.h = sel.h + sel.y;
    }
    
    sel.x = Math.max(sel.x, 0);
    sel.y = Math.max(sel.y, 0);
    
    
    if (isRecord) {
      let history = {
        type: 'crop-to-selection',
        data: {
          origin: {
            w: app.drawing.frame.width,
            h: app.drawing.frame.height,
          },
          target: {
            w: sel.w,
            h: sel.h,
            x: sel.x,
            y: sel.y,
          },
          canvasCache: [],
        },
        frameIndex: app.drawing.frame.getFrameIndex(),
        layerId: app.layer.activeLayerId,
      };
      // cache previous canvas drawing
      if (history.data.target.w < history.data.origin.w || history.data.target.h < history.data.origin.h) {
        for (let layer of app.layer.layers) {
          if (!layer.isVisible)
            continue;
          let frameIndex = 0;
          for (let frame of layer.frames) {
            if (frame) {
              let c = app.drawing.frame.createDrawingContext();
              c.drawImage(frame.canvas, 0, 0);
              history.data.canvasCache.push({
                frameIndex,
                layerId: layer.id,
                canvas: c.canvas,
              });
            }
            frameIndex ++;
          }
        }
      }
      
      // app.drawing.frame.width = sel.w;
      // app.drawing.frame.height = sel.h;
      
      app.undoManager.startRecording(history);
      app.undoManager.stopRecording();
    }
    
    // crop process
    app.drawing.frame.width = sel.w;
    app.drawing.frame.height = sel.h;
    resizeDrawingCanvas(app.drawing.frame.width, app.drawing.frame.height);
    resizeContextCanvas(app.drawing.frame.getUIContext());
    resizeContextCanvas(app.drawing.frame.getSelectionUIContext());
    resizeContextCanvas(tmpFrameCanvas);
    for (let layer of app.layer.layers) {
      for (let frame of layer.frames) {
        if (frame) {
          clearContext(tmpFrameCanvas)
          tmpFrameCanvas.drawImage(frame.canvas, -sel.x, -sel.y);
          resizeContextCanvas(frame);
          frame.drawImage(tmpFrameCanvas.canvas, 0, 0);
        }
      }
    }
    
    app.drawing.tools.utility.select.selectAll();

    cacheGrid();
    SELF.redraw();
  }
  
  function moveSelection(direction) {
    if (window.app.drawing.tools.selectedTool == 'move') {
      let sel = tools.utility.select.getSelection()
      if (sel.isEmpty)
        return;
      app.drawing.tools.utility.move.movePerPixel(direction);    
    }
  }
  
  function onWindowBlur() {
    // programmatically mouseup/touchup
    if (_.tmpCursorEvent) {
      oncursorend(_.tmpCursorEvent);
      _.tmpCursorEvent = null;
    }
  }
  
  // window.setInterval(() => asd(isDrag), 100)
  
  function setDragState(state) {
    isDrag = state;
  }
  
  let portedSelf = {
    exportFrame,
    goToHistory,
    recordAction,
    clearUI,
    tools,
    frame,
    cursorHandler,
    cacheGrid,
    resizeBaseCanvas,
    resizeDrawingCanvas,
    moveSelection,
    cropToSelection,
    dataURLToCanvas,
    centerCanvas,
    setSettings,
    removeSelection,
    resizeSelectBox,
    resizeSelectWandBox,
    getCanvasSize,
    getCursor,
    getScreenCursor,
    getRelativeCursor,
    resizeCanvas,
    onWindowBlur,
    rebound,
    resetZoomScaleLevel,
    setDragState,
  };
  
  for (let key in portedSelf) {
    SELF[key] = portedSelf[key];
  }
  
  
  Object.defineProperty(SELF, 'context', { get: frame.getContext });
  Object.defineProperty(SELF, 'UIContext', { get: frame.getUIContext });
  Object.defineProperty(SELF, 'selectionUIContext', { get: frame.getSelectionUIContext });
  Object.defineProperty(SELF, 'cursorContext', { get: frame.getCursorContext });
  Object.defineProperty(SELF, 'lineWidth', { get: () => config.lineWidth });
  Object.defineProperty(SELF, 'totalWheelDeltaY', { get: () => _.totalWheelDeltaY, set: (x) => _.totalWheelDeltaY = x });
  Object.defineProperty(SELF, 'frameWidthScaledZoom', { get: () => _.frameWidthScaledZoom, set: (x) => _.frameWidthScaledZoom = x });
  
  generateSelectBox();
  initGridWorkCanvas();
  initGrid();
  resizeGridGuidelines();
  
  return SELF;
}