window.eventListeners = (function() {
  
  let SELF = {};
  
  SELF.init = function() {
    
    window.addEventListener('resize', (ev) => window.ui.triggerResize(ev));
    document.addEventListener('dragover', event => event.preventDefault());
    document.addEventListener('drop', (e) => {
      e.preventDefault();
      window.appFileReader.getDroppedFile(e);
    });
    document.body.addEventListener('click', function() {
      window.focus();
    });
    
    window.utility.attachClickable($('.clickable'), window.DOMEvents.clickable);
    window.utility.attachSubmittable($('.submittable'), window.DOMEvents.submittable);
    
    const keyHandler = {
      keyDown: function(e) {
        
        if (e.key == 'Delete' && !hasModalOpen()) {
          app.drawing.removeSelection();
          return;
        }
        
        if (e.altKey) {
          e.preventDefault();
        }
        pressedKeys.altKey = e.altKey;
        pressedKeys.ctrlKey = e.ctrlKey;
        pressedKeys.shiftKey = e.shiftKey;
        if (e.key == ' ' && !hasModalOpen()) {
          if (!window.ui.isMoveCanvas && !window.app.drawing.tools.isLocked) {
            window.ui.isMoveCanvas = true;
            app.drawing.tools.selectTool('hand', true);
            app.drawing.tools.lock();
            app.drawing.tools.utility.hand.start();
            document.body.classList.add('tool-hand');
          }
          e.preventDefault();
        }
      },
      keyUp: function(e) {
        pressedKeys.altKey = e.altKey;
        pressedKeys.ctrlKey = e.ctrlKey;
        pressedKeys.shiftKey = e.shiftKey;
        if (e.key == ' ') {
          if (window.ui.isMoveCanvas) {
            app.drawing.tools.unlock();
            app.drawing.tools.selectLastTool();
            window.ui.isMoveCanvas = false;
            app.drawing.tools.utility.hand.end();
            document.body.classList.remove('tool-hand');
          }
        }
      },
    };
    
    let drawingContainer = $I('.js-drawing-container');
    drawingContainer.addEventListener('wheel', wheelHandler, {passive:false});
    
    window.addEventListener('keydown', keyHandler.keyDown);
    window.addEventListener('keyup', keyHandler.keyUp);
    
    window.addEventListener('cut', evt => app.drawing.frame.cut(evt));
    window.addEventListener('copy', evt => app.drawing.frame.copy(evt));
    window.addEventListener('paste', evt => {
      if (!['INPUT', 'COLOR-PICKER-V1'].includes(evt.target.tagName)) {
        app.drawing.frame.paste(evt);
      }
    });
    
    document.addEventListener('click', hideContextmenu);
    drawingContainer.addEventListener('contextmenu', contextMenuHandler);
    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('blur', unregisterToolActions);
    
    window.addEventListener('mouseup', toolHandler);
    window.addEventListener('touchend', toolHandler);
    window.addEventListener('mousemove', toolHandler);
    window.addEventListener('touchmove', toolHandler);
    drawingContainer.addEventListener('mousedown', toolHandler);
    drawingContainer.addEventListener('touchstart', toolHandler);
    
    $('sidebar')[0].addEventListener('touchstart', () => {
      let e = event;
      setTimeout(function() {
        e.preventDefault();
      }, 200);
    });
    
    let keyboard = new KeyTrapper();
    keyboard.isBlocked = hasModalOpen;
    keyboard.listen(window.DOMEvents.keyboardShortcut);
    keyboard.listen(window.DOMEvents.keyboardShortcut2, 'keydown');
    keyboard.listen(window.DOMEvents.keyboardShortcut3, 'keydown', false); // preventDefault = false
    
  };
  
  function wheelHandler(event) {
    event.preventDefault();
    wheel(event.deltaY);
    hideContextmenu();
  }
  
  function toolHandler(event) {
    window.app.drawing.cursorHandler(event);
  }
  
  function unregisterToolActions() {
    pressedKeys.altKey = false;
    pressedKeys.ctrlKey = false;
    pressedKeys.shiftKey = false;
    hideContextmenu();
    
    if (window.ui.isMoveCanvas) {
      window.app.drawing.tools.unlock();
      window.app.drawing.tools.selectLastTool();
      window.ui.isMoveCanvas = false;
      window.app.drawing.tools.utility.hand.end();
      document.body.classList.remove('tool-hand');
    }
    
    window.app.drawing.onWindowBlur();
  }
  
  function hideContextmenu(){
    nono.style.display = 'none';
  }
  
  function contextMenuHandler(e) {
    nono.style.outline = 'none';
    nono.style.opacity = 0;
    nono.style.cursor = 'default';
    nono.style.display = 'block';
    nono.style.position = 'absolute';
    nono.style.zIndex = '1111';
    nono.style.left = e.pageX+'px';
    nono.style.top = e.pageY+'px';
    nono.style.width = '1px';
    nono.style.border = '0';
    nono.focus();
  }
  
  function beforeUnload(event) {
    event.preventDefault();
    event.returnValue = 'Changes you made may not be saved.';
  }
  
  function fn(w, res) {
    return res / (w / window.app.drawing.frame.width);
  }
  
  function wheel(delta) {
    window.app.drawing.cancelDrawCursor = true;
    if (pressedKeys.shiftKey) {
      cam.x += scale*delta/100;
    } else if (pressedKeys.ctrlKey) {
      cam.y += scale*delta/100;
    } else if (pressedKeys.altKey) {
      window.app.drawing.cancelDrawCursor = false;
      if (delta > 0) {
        window.app.drawing.tools.increaseLineWidth();
      } else {
        window.app.drawing.tools.decreaseLineWidth();
      }
    } else {
      // zoomFn(delta);
      zoomFnExperimental(delta);
    }
    window.app.drawing.redraw();
  }
  
  let initial = 0;
  let zoomSensitivity = 50;
  function zoomFnExperimental(delta) {
    let targetScale = scale + -delta/zoomSensitivity;
    
    // let x1 = (parseFloat($('#canvas')[0].height)) / (app.drawing.frame.width + app.drawing.frame.width * 30/100);
    // let x2 = (parseFloat($('#canvas')[0].width)) / (app.drawing.frame.height + app.drawing.frame.height * 30/100);
    // let x1 = (60) / app.drawing.frame.width;
    // let x2 = (60) / app.drawing.frame.height;
    let defaultZoomPadding = 96;
    let x1 = (parseFloat($('#canvas')[0].width) - defaultZoomPadding) / app.drawing.frame.width;
    let x2 = (parseFloat($('#canvas')[0].height) - defaultZoomPadding) / app.drawing.frame.height;
    let maxScale = Math.min(x1, x2)
    
    targetScale = Math.max(maxScale, Math.min(15 * 10, targetScale));
    window.app.drawing.zoom(targetScale);
    scale = targetScale;
    window.app.drawing.setTempScale(null);
    window.app.drawing.cancelDrawCursor = true; // todo: in above lines, something set this to false, causing a glitch
  }
  
  function zoomFn(delta) {
    app.drawing.totalWheelDeltaY += delta;
    let defaultConversionRate = 5;
    let blockConversionRate = fn(window.app.drawing.frameWidthScaledZoom, defaultConversionRate); 
    let block = Math.floor(window.app.drawing.totalWheelDeltaY / blockConversionRate); 
    window.app.drawing.totalWheelDeltaY = window.app.drawing.totalWheelDeltaY % 10;
    
    if (window.app.drawing.frameWidthScaledZoom - block > 64) {
      let targetScale = (window.app.drawing.frameWidthScaledZoom - block) / window.app.drawing.frame.width;
      if (targetScale > 70) {
        targetScale = 70;
        window.app.drawing.totalWheelDeltaY = 0;
      } else {
        window.app.drawing.frameWidthScaledZoom -= block;
        window.app.drawing.zoom(targetScale);
        scale = targetScale;
        window.app.drawing.setTempScale(null);
      }
    } else {
      window.app.drawing.totalWheelDeltaY = 0;
    }

    window.app.drawing.cancelDrawCursor = true; // todo: in above lines, something set this to false, causing a glitch
  }
  
  function hasModalOpen(shortcut, event) {
    if (shortcut && shortcut.key == 'Ctrl+A' && !['INPUT', 'COLOR-PICKER-V1'].includes(event.target.tagName)) {
      event.preventDefault();
    }
    return stateManager.states.length > 0 || document.activeElement.tagName == 'COLOR-PICKER-V1';
  }
  
  
  return SELF;
  
})();