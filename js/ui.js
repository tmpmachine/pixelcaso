function UI() {
  
  'use strict';

  let $ = window.$;
  let app = window.app;

  const SELF = {
    ReloadToolbarStates,
    switchProject: (evt) => {
      let index = evt.target.dataset.index;
      app.projectManager.openProject(index);
    },
    DOM: {
      palette: $('#color-picker')[0],
      animation: {
        fps: $('#in-fps')[0],
      },
    },
    isMoveCanvas: false,
    modal: {
      resizeCanvas: function() {
        let modal = SELF.toggleModal('resize-canvas');
        let form = $('form', modal)[0];
        form.width.value = app.drawing.frame.width;
        form.height.value = app.drawing.frame.height;
      },
    },
    toolbar: {
      onFloatingToolClick: function(event) {
        let toolName = event.target.dataset.tool;
        if (!toolName) {
          return;
        }
        let isSetLastTool = true;
        // SELF.toolbar.setActiveTool(toolName);
        
        switch (toolName) {
          case 'undo':
            window.app.undoManager.undo()
            app.drawing.tools.selectTool(toolName, isSetLastTool);
            break;
          case 'select':
          case 'picker':
            app.drawing.tools.selectTool(toolName, isSetLastTool);
            break;
          default:
            app.drawing.tools.selectTool(toolName);
            break;
        }
        
      },
      setActiveTool: function(toolName) {
        /*let activeNode = $('.tool-bar .isActive')[0];
        if (activeNode)
          activeNode.classList.remove('isActive');
        let node = $(`.tool-bar [data-tool="${toolName}"]`)[0];
        if (node)
          node.classList.add('isActive');*/
      }
    },
    window: {
      toggleLayers: function(forcedState) {
        let isHide;
        if (typeof(forcedState) != 'undefined') {
          isHide = $('.mini-window[timeline]')[0].classList.toggle('hide', forcedState);
        } else {
          isHide = $('.mini-window[timeline]')[0].classList.toggle('hide');
        }
        resize();
        app.settings.data.windows.timeline.isShown = !isHide;
        app.settings.save();
      },
      toggleReference: function(forcedState) {
        let isOpened = $('.mini-window[reference]')[0].toggle();
        app.settings.data.windows.reference.isShown = isOpened;
        app.settings.save();
      },
      togglePreview: function(forcedState) {
        let isOpened;
        if (typeof(forcedState) == 'undefined') {
          isOpened = $('.mini-window[preview]')[0].toggle();
        } else {
          isOpened = forcedState;
          $('.mini-window[preview]')[0].toggle();
          if (!isOpened)
            window.animator.pause();
        }
        if (isOpened) {
          let btn = $('.clickable[data-callback="animator.toggle-play"]')[0];
          btn.classList.toggle('isPause', false);
          btn.classList.toggle('isPlay', true);
          if (window.animator.getLastState()) {
            window.animator.play();
            window.animator.setLastState(false);
          }
        } else {
          window.animator.pause();
        }
        app.settings.data.windows.preview.isShown = isOpened;
        app.settings.save();
      },
      toggleGridSettings: function(forcedState) {
        let modal = $I('.mini-window[grid-settings]');
        let isShown = modal.toggle();
        if (isShown) {
          let elin = modal.q('input[name="grid-size"]');
          elin.value = window.app.settings.data.view.gridSize;
          elin.focus();
          
          modal.q('input[name="grid-stroke"]').value = window.app.settings.data.view.gridStroke;
          modal.q('input[name="grid-stroke-width"]').value = window.app.settings.data.view.gridStrokeWidth;
        }
      },
    },
    animator: {
      togglePlay: function() {
        if (this.classList.contains('isPlay')) {
          window.animator.play();
        } else {
          window.animator.pause();
        }
        this.classList.toggle('isPause');
        this.classList.toggle('isPlay');
      },
    },
    timeline: {
      editFrameLength: function() {
        let modal = SELF.toggleModal('frame-length');
        let form = $('form', modal)[0];
        let input =$('input', modal)[0];
        form.frameLength.value = app.drawing.frame.frameLength;
        var temp = input.value;
        window.setTimeout(() => {
          input.value = '';
          input.value = temp;
          input.focus();
        }, 10);
      },
      changeFrameLength: function(event) {
        let form = this;
        let input = form.frameLength.value;
        event.preventDefault();
        event.stopPropagation();
        if (input && !window.isNaN(parseInt(input))) {
          if (input >= 50) {
            SELF.confirm('Heads up! You are about to create >= 50 frames! We have not tested that case yet. Performance may be degraded or even crashing the browser. Continue?', 'Confirm').then(isOK => {
              if (isOK) {
                app.drawing.frame.setFrameLength(parseInt(input));
                SELF.timeline.setFrameNodes();
                SELF.toggleModal('frame-length');
              }
            });
          } else if (input >= 1) {
            app.drawing.frame.setFrameLength(parseInt(input));
            SELF.timeline.setFrameNodes();
            SELF.toggleModal('frame-length');
          } else {
            alert('Frame length must be >= 1');
          }
        }
      },
      setFrameNodes: function() {
        let currentFrameLength = $('#timeline .frames')[0].childElementCount;
        let frameLen = app.drawing.frame.frameLength;
        if (frameLen < currentFrameLength) {
          for (let layer of $('#timeline .frames')) {
            let i = currentFrameLength;
            while (i > frameLen) {
              layer.lastElementChild.remove();
              i--;
            }
          }
        }
        if (currentFrameLength < frameLen) {
          for (let layer of $('#timeline .frames')) {
            let fragment = document.createDocumentFragment();
            let i = currentFrameLength;
            while (i < frameLen) {
              let node = $('template[frame]')[0].content.cloneNode(true);
              fragment.append(node);
              i++;
            }
            layer.append(fragment);
          }
        }
      },
    },
    statusBar: {
      update: function(items) {
        for (let key in items) {
          let value = items[key];
          switch (key) {
            case 'layer':
              if (value == '<no-layer>') {
                $('.txt-status ._layer')[0].innerHTML = '<i>No layer selected</i>';
                $('.txt-status ._frame')[0].innerHTML = '<i>None</i>';
              } else {
                $('.txt-status ._layer')[0].textContent = value;
              }
              break;
            case 'frame':
              $('.txt-status ._frame')[0].textContent = value;
              break;
            case 'tool':
              $('.txt-status ._tool')[0].textContent = getToolLabel(value);
              break;
          }
        }
      },
    },
    layer: {
      emptyTimeline: function() {
        $('#timeline')[0].innerHTML = '';
        $('.mobile-setting-pane')[0].innerHTML = '';
      },
      moveUp: function(id) {
        let node = $(`#timeline .layer[data-layer-id="${id}"]`)[0];
        node.parentNode.insertBefore(node, node.previousElementSibling);
        node = $(`.mobile-setting-pane .layer[data-layer-id="${id}"]`)[0];
        node.parentNode.insertBefore(node, node.previousElementSibling);
      },
      moveDown: function(id) {
        let node = $(`#timeline .layer[data-layer-id="${id}"]`)[0];
        node.parentNode.insertBefore(node, node.nextElementSibling.nextElementSibling);
        node = $(`.mobile-setting-pane .layer[data-layer-id="${id}"]`)[0];
        node.parentNode.insertBefore(node, node.nextElementSibling.nextElementSibling);
      },
      updateActionState: function(states) {
        let btnUp = $('.btn-layer-up');
        let btnDown = $('.btn-layer-down');
        let btnRename = $('.btn-layer-rename');
        let btnDelete = $('.btn-layer-delete');
        for (let node of $('.btn-layer')) {
          node.disabled = false;
        }
        for (let state of states) {
          switch (state) {
            case 'no-layer':
              for (let node of btnUp)
                node.disabled = true;
              for (let node of btnDown)
                node.disabled = true;
              for (let node of btnRename)
                node.disabled = true;
              for (let node of btnDelete)
                node.disabled = true;
            break;
            case 'is-first-layer':
              for (let node of btnUp)
                node.disabled = true;
            break;
            case 'is-last-layer':
              for (let node of btnDown)
                node.disabled = true;
            break;
          }
        }
      },
      highlightLayer: function(layerId) {
        let container = $('#timeline')[0];
        for (let node of $('.layer.--active', container)) {
          node.classList.remove('--active');
        }
        if ($(`.layer[data-layer-id="${layerId}"]`, container).length > 0)
          $(`.layer[data-layer-id="${layerId}"]`, container)[0].classList.add('--active');
        container = $('.mobile-setting-pane')[0];
        for (let node of $('.layer.--active', container)) {
          node.classList.remove('--active');
        }
        if ($(`.layer[data-layer-id="${layerId}"]`, container).length > 0)
          $(`.layer[data-layer-id="${layerId}"]`, container)[0].classList.add('--active');
      },
      change: function(evt) {
        let node = evt.target;
        let layerId;
        let frameIndex;
        if (node.classList.contains('frame')) {
          layerId = node.parentNode.dataset.layerId;
          frameIndex = Array.prototype.indexOf.call(node.parentNode.children, node);
        } else if (node.classList.contains('frames') || node.classList.contains('name')) {
          layerId = node.dataset.layerId;
          frameIndex = app.drawing.frame.getFrameIndex();
        }
        
        if (typeof(layerId) != 'undefined') {
          app.layer.change(layerId);
          let container = $('#timeline')[0];
          $(`.layer.--active`, container)[0].classList.remove('--active');
          $(`.layer[data-layer-id="${layerId}"]`, container)[0].classList.add('--active');
          container = $('.mobile-setting-pane')[0];
          $(`.layer.--active`, container)[0].classList.remove('--active');
          $(`.layer[data-layer-id="${layerId}"]`, container)[0].classList.add('--active');
          if (typeof(frameIndex) != 'undefined') {
            app.drawing.frame.goToFrame(frameIndex);
            this.highlightFrame(frameIndex, layerId);
          }
          app.drawing.redraw();
        }
      },
      highlightFrame: function(frameIndex=app.drawing.frame.getFrameIndex(), layerId=app.layer.activeLayerId) {
        if ($(`.frame.--active`)[0])
          $(`.frame.--active`)[0].classList.remove('--active');
        let frameNode =  $(`.layer[data-layer-id="${layerId}"] .frame:nth-child(${frameIndex+1})`)[0];
        if (frameNode)
          frameNode.classList.add('--active');
        
        ui.statusBar.update({
          frame: frameIndex + 1,
        });
      },
      list: function(layers) {
        // if ($(`.layer.--active`)[0])
          // $(`.layer.--active`)[0].classList.remove('--active');
        
        // let node = $('template[layer]')[0].content.cloneNode(true);
        // $('.name', node)[0].textContent = layer.name;
        // $('.frames', node)[0].dataset.layerId = layer.id;
        // $('.name', node)[0].addEventListener('dblclick', this.doubleClickRename);
        // $('.name', node)[0].title = layer.name;
        // $('.name', node)[0].dataset.layerId = layer.id;
        // $('.layer', node)[0].dataset.layerId = layer.id;
        // $('.layer', node)[0].classList.add('--active');
        // window.utility.attachClickable($('.clickable', node), DOMEvents.clickable);
        // $('#timeline')[0].insertBefore(node, $('#timeline')[0].firstElementChild);
        
        // this.listFrames(layer);
        // this.highlightFrame(app.drawing.frame.getFrameIndex(), layer.id);
        // uiMobile.layer.list(layers);
      },
      append: function(layer) {
        if ($(`#timeline .layer.--active`)[0])
          $(`#timeline .layer.--active`)[0].classList.remove('--active');
        
        let node = $('template[layer]')[0].content.cloneNode(true);
        $('.name', node)[0].textContent = layer.name;
        $('.frames', node)[0].dataset.layerId = layer.id;
        $('.name', node)[0].addEventListener('dblclick', this.doubleClickRename);
        $('.name', node)[0].title = layer.name;
        $('.name', node)[0].dataset.layerId = layer.id;
        $('.layer', node)[0].dataset.layerId = layer.id;
        $('.layer', node)[0].classList.add('--active');
        window.utility.attachClickable($('.clickable', node), DOMEvents.clickable);
        $('#timeline')[0].insertBefore(node, $('#timeline')[0].firstElementChild);
        
        this.listFrames(layer);
        this.highlightFrame(app.drawing.frame.getFrameIndex(), layer.id);
        
        uiMobile.layer.append(layer);
      },
      appendTo: function(layer, index) {
        if ($(`.layer.--active`)[0])
          $(`.layer.--active`)[0].classList.remove('--active');
        
        let node = $('template[layer]')[0].content.cloneNode(true);
        $('.name', node)[0].textContent = layer.name;
        $('.name', node)[0].title = layer.name;
        $('.frames', node)[0].dataset.layerId = layer.id;
        $('.name', node)[0].addEventListener('dblclick', this.doubleClickRename);
        $('.name', node)[0].dataset.layerId = layer.id;
        $('.layer', node)[0].dataset.layerId = layer.id;
        $('.layer', node)[0].classList.add('--active');
        window.utility.attachClickable($('.clickable', node), DOMEvents.clickable);
        if (!layer.isVisible)
          $('.layer .toggle-visibility', node)[0].textContent = 'visibility_off';
        
        $('#timeline')[0].insertBefore(node, $('#timeline .layer')[index]);
        
        
        this.listFrames(layer);
        this.highlightFrame(app.drawing.frame.getFrameIndex(), layer.id);
      },
      listFrames: function(layer) {
        for (var i = 0; i < app.drawing.frame.frameLength; i++) {
          let node = $('template[frame]')[0].content.cloneNode(true);
          $(`.layer[data-layer-id="${layer.id}"] .frames`)[0].append(node);
        }
      },
      updateFrameLabel: function(frameIndex) {
        $('[data-name="label-frame-number"]')[0].textContent = frameIndex+1;
      },
      removeLayer: function(id) {
        $(`#timeline .layer[data-layer-id="${id}"]`)[0].remove();
        $(`.mobile-setting-pane .layer[data-layer-id="${id}"]`)[0].remove();
        this.highlightFrame(app.drawing.frame.getFrameIndex());
        let modal = $('.mini-window[data-name="layer-settings"]')[0];
        let form = $('form', modal)[0];
        if (form.layerId.value == id) {
          form.reset();
          modal.close();  
        }
      },
      doubleClickRename: function() {
        app.layer.renameLayer();
      },
      rename: function(id, name) {
        $(`#timeline .layer[data-layer-id="${id}"] .name`)[0].textContent = name;
        $(`.mobile-setting-pane .layer[data-layer-id="${id}"] .name`)[0].textContent = name;
      },
      eventHandler: function(event) {
        let cls = event.target.classList;
        let layerId = this.dataset.layerId;
        if (cls.contains('frame') || cls.contains('frames') || cls.contains('name')) {
          SELF.layer.change(event);
        } else if (cls.contains('toggle-visibility')) {
          app.layer.toggleVisibility(layerId);
        } else if (cls.contains('btn-settings')) {
          SELF.layer.toggleSettings(layerId);
        } else if (cls.contains('toggle-lock')) {
          app.layer.toggleLock();
        }
      },
      toggleSettings: function(layerId) {
        let modal = $('.mini-window[data-name="layer-settings"]')[0];
        modal.addEventListener('onclose', SELF.layer.closeSettings);
        let form = $('form', modal)[0];
        
        if (form.layerId.value == layerId) {
          modal.close();
          form.reset();
        } else {
          let isShown = modal.toggle(true);
          if (isShown) {
            let layer = app.layer.getLayerById(layerId);
            form.name.value = layer.name;
            form.initialAlpha.value = layer.alpha;
            form.alpha.value = layer.alpha;
            form.alpha.addEventListener('input', app.layer.changeAlphaTemporary);
            form.layerId.value = layerId;
          }
        }
      },
      updateLayerSettings: function(evt) {
        evt.preventDefault();
        let form = this;
        app.layer.setAlpha(form.layerId.value, parseFloat(form.initialAlpha.value), parseFloat(form.alpha.value));
        form.reset();
        $('.mini-window[data-name="layer-settings"]')[0].close();
      },
      closeSettings: function(evt) {
        let modal = evt.target;
        let form = $('form', modal)[0];
        form.alpha.removeEventListener('input', app.layer.changeAlphaTemporary);
        
        if (form.initialAlpha.value != form.alpha.value) {
          app.layer.setAlpha(form.layerId.value, parseFloat(form.initialAlpha.value), parseFloat(form.initialAlpha.value));
          app.drawing.redraw();
        }
      },
      toggleVisibility: function(layerId, isVisible) {
        let container = $('#timeline')[0];
        let node = $(`.layer[data-layer-id="${layerId}"] .toggle-visibility`, container)[0];
        let iconName = node.textContent;
        if (typeof(isVisible) == 'undefined')
          iconName = (iconName == 'visibility') ? 'visibility_off' : 'visibility';
        else
          iconName = isVisible ? 'visibility' : 'visibility_off';
        node.textContent = iconName;
        node.classList.toggle('isOff', (iconName == 'visibility_off'));
      }
    },
  };
  
  function ReloadToolbarStates() {
    let activeTool = compoToolbar.GetActive();
    for (let el of $('.widget-toolbar [data-tool]')) {
      el.classList.remove('isActive');
      if (el.dataset.tool == activeTool) {
        el.classList.add('isActive');
      }
    }
  }
  
  SELF.paste = function() {
    navigator.permissions.query({ name: "clipboard-read" }).then((result) => {
      if (result.state == "granted" || result.state == "prompt") {
        navigator.clipboard.read().then((data) => {
          for (let i = 0; i < data.length; i++) {
            if (!data[i].types.includes("image/png")) {
              //
            } else {
              data[i].getType("image/png").then(insertFromClipboard);
            }
          }
        });
      }
    });
  };
  
  SELF.toggleShowGrid = function() {
    window.app.settings.data.view.showGrid = !window.app.settings.data.view.showGrid;
    window.app.settings.save();
    $I('body').classList.toggle('is--show-grid', window.app.settings.data.view.showGrid);
    window.app.drawing.updateGridGuidelinesPosition();
  };
  
  SELF.toggleShowGridPixel = function() {
    window.app.settings.data.view.showGridPixel = !window.app.settings.data.view.showGridPixel;
    window.app.settings.save();
    $I('body').classList.toggle('is--show-grid-pixel', window.app.settings.data.view.showGridPixel);
    window.app.drawing.updateGridGuidelinesPosition();
  };
  
  SELF.toggleRecentProjects = function() {
    window.fileSave.listProjectFiles($I('.js-project-list'));
    SELF.toggleModal('recent-projects');
  };
  
  function getToolLabel(toolName) {
    let label = '(no tool selected)';
    switch (toolName) {
      case 'pencil': label = 'Pencil'; break;
      case 'eraser': label = 'Eraser'; break;
      case 'picker': label = 'Color picker'; break;
      case 'line': label = 'Line'; break;
      case 'fill': label = 'Flood fill'; break;
      case 'hand': label = 'Pan tool'; break;
      case 'select': label = 'Rectangular selection'; break;
      case 'wand': label = 'Tone selection'; break;
      case 'move': label = 'Move tool'; break;
    }
    return label;
  }
  
  function insertFromClipboard(blob){
    let img = new Image();
    img.src = URL.createObjectURL(blob);
    img.onload = () => window.app.drawing.frame.fromImage(img);
  }
  
  let wakeLock = null;
  let wakeLockToggler = null;
            
  (function() {
    
      const requestWakeLock = async () => {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
          wakeLock.addEventListener('release', () => {
            window.app.settings.data.isAwake = false;
            window.app.settings.save();
            $('.btn-mobile-awake')[0].classList.toggle('active', false);
          });
          $('.btn-mobile-awake')[0].classList.toggle('active', true);
          window.app.settings.data.isAwake = true;
          window.app.settings.save();
        } catch (err) { }
      };
     
     async function wake() {
        if (wakeLock === null) {
          await requestWakeLock();
          aww.pop('Screen will now stay awake!');
        } else {
          wakeLock.release();
          aww.pop('Screen awake disabled');
          wakeLock = null;
        }
        const handleVisibilityChange = () => {
          if (wakeLock !== null && document.visibilityState === 'visible') {
            requestWakeLock();
          }
        };
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);
     }
    
    function toggleAwake() {
      if ('wakeLock' in navigator) {
        wake();
      }
    }
    
    wakeLockToggler = toggleAwake;
  
  })();
  
  function attachScreenAwakeHandler() {
    if ('wakeLock' in navigator) {
      $('.btn-mobile-awake')[0].parentNode.classList.toggle('hide', false);
      window.addEventListener('click', handleScreenAwake);
      window.addEventListener('touchstart', handleScreenAwake);
      function handleScreenAwake() {
        if (window.app.settings.data.isAwake) {
          $('.btn-mobile-awake')[0].classList.toggle('active');
          SELF.toggleAwake();
        }
        window.removeEventListener('click', handleScreenAwake);
        window.removeEventListener('touchstart', handleScreenAwake);
      }
    } 
  }
  
  SELF.toggleAwake = function() {
    wakeLockToggler();
  }
  
  function initGutterResizer() {
    let gutterEl =  $('.mini-window[timeline] .gutter')[0];
    let isDragged = false;
    let width = 96;
    let oldX, delta, updateEditor;
    let throttle = null;
    let _allowResize = false;
    
    function mouseHandler(event) {
      if (event.type == 'mousedown') {
        oldX = event.pageY;
        document.addEventListener('mouseup', mouseHandler);
        document.addEventListener('mousemove', mouseMove);
        window.addEventListener('blur', mouseHandler);
        window.clearInterval(throttle);
        _allowResize = false;
        throttle = null;
      } else if (event.type == 'mouseup' || event.type == 'blur') {
        document.removeEventListener('mouseup', mouseHandler);
        document.removeEventListener('mousemove', mouseMove);
        window.removeEventListener('blur', mouseHandler);
        window.clearInterval(throttle);
        _allowResize = false;
        throttle = null;
      }
      isDragged = (event.type == 'mousedown');
    }
    
    function mouseMove(event) {
      if (isDragged) {
        delta = oldX - event.pageY;
        oldX = event.pageY;
        width += delta;
        width = Math.max(30, Math.min(300, width));
        $('.timeline-wrapper')[0].style.height = width+'px';
        if (_allowResize) {
          resize(); 
          _allowResize = false;
        }
        if (throttle === null) {
          throttle = window.setInterval(throttleResize, 50);
        }
      }
    }
    
    function throttleResize() {
      _allowResize = true;
    }
    
    gutterEl.addEventListener('mousedown', mouseHandler);
  }
  
  SELF.init = function() {
    attachMenuListener();
    attachModalListener();
    initUIToggler();
    initInputable();
    initModalWindow();
    initGutterResizer();
    
    for (let modal of $('.modal-window')) {
      modal.classList.toggle('transition-enabled', true);
      setDataTarget($('.Overlay',modal)[0]);
      setDataTarget($('.Btn-close',modal)[0]);
      $('.Overlay',modal)[0].addEventListener('click', ui.toggleModalByClick);
      $('.Btn-close',modal)[0].addEventListener('click', ui.toggleModalByClick);
    }
    
    ui.initUploadable();
    initWindowState();
    initUserPreferences();
    window.eventListeners.init();
    attachScreenAwakeHandler();
  };
  
  function attachModalListener() {
    for (let node of $('.modal-component')) {
      node.addEventListener('onclose', popModalState);
    }
  }
  
  function popModalState() {
  	window.stateManager.popState([0]);
  }
  
  function initWindowState() {
    if (app.settings.data.windows.palette.isShown)  {
      let modal = $(`.modal-component[data-name="color-palette"]`)[0];
      let isHide = false;
      modal.toggle(isHide);
    }
     let windowName = ['timeline', 'reference', 'preview'];
     for (let name of windowName) {
       $(`.mini-window[${name}]`)[0].classList.toggle('hide', !app.settings.data.windows[name].isShown);
     }
     for (let name of ['reference', 'preview']) {
      let pos = app.settings.data.windows[name];
      $(`.mini-window[${name}]`)[0].setPosition(pos.x, pos.y);
     }
  }
  
  function initUserPreferences() {
    let size = window.app.settings.data.view.gridSize;
    if (size) {
      reloadGridGuidelines();
    }
    $I('body').classList.toggle('is--show-grid', window.app.settings.data.view.showGrid);
    $I('body').classList.toggle('is--show-grid-pixel', window.app.settings.data.view.showGridPixel);
  }
  
  SELF.zoomIn = function() {
    scaleIndex = getNearestDownScaleIndex();
    if (scaleIndex > 0) {
      window.app.drawing.setTempScale(null);
      let zoomPercentage = scaleValues[scaleIndex];
      let x1 = (parseFloat($I('#canvas').width) - defaultZoomPadding) / (app.drawing.frame.width * zoomPercentage / 100);
      let x2 = (parseFloat($I('#canvas').height) - defaultZoomPadding) / (app.drawing.frame.height * zoomPercentage / 100);
      let targetScale = Math.min(x1, x2);
      
      app.drawing.zoom(targetScale);
      scale = targetScale;
      app.drawing.redraw();
    }
  };
  
  SELF.zoomOut = function() {
    scaleIndex = getNearestUpScaleIndex();
    if (scaleIndex < scaleValues.length-1) {
      window.app.drawing.setTempScale(null);
      let zoomPercentage = scaleValues[scaleIndex];
      
      let x1 = (parseFloat($I('#canvas').width) - defaultZoomPadding) / (app.drawing.frame.width * zoomPercentage / 100);
      let x2 = (parseFloat($I('#canvas').height) - defaultZoomPadding) / (app.drawing.frame.height * zoomPercentage / 100);
      let targetScale = Math.min(x1, x2);
      
      app.drawing.zoom(targetScale);
      scale = targetScale;
      app.drawing.redraw();
    }
  };
  
  function getNearestUpScaleIndex() {
    let index = 0;
    let baseScale = getBaseScale();
    for (let zoom of scaleValues) {
      let x1 = (parseFloat($I('#canvas').width) - defaultZoomPadding) / (app.drawing.frame.width * zoom / 100);
      let x2 = (parseFloat($I('#canvas').height) - defaultZoomPadding) / (app.drawing.frame.height * zoom / 100);
      let targetScale = Math.min(x1, x2);
      if (targetScale/scale < 1) {
        return index;
      }
      index++;
    }
    
    return index;
  }
  
  let defaultZoomPadding = 96;
  
  function getBaseScale() {
    let baseScale1 = (parseFloat($I('#canvas').width) - defaultZoomPadding) / app.drawing.frame.width;
    let baseScale2 = (parseFloat($I('#canvas').height) - defaultZoomPadding) / app.drawing.frame.height;
    let baseScale = Math.min(baseScale1, baseScale2)
  }
  
  function getNearestDownScaleIndex() {
    let baseScale = getBaseScale()
    for (let i = scaleValues.length; i--; ) {
      let zoom = scaleValues[i];
      let x1 = (parseFloat($I('#canvas').width) - defaultZoomPadding) / (app.drawing.frame.width * zoom / 100)
      let x2 = (parseFloat($I('#canvas').height) - defaultZoomPadding) / (app.drawing.frame.height * zoom / 100)
      let targetScale = Math.min(x1, x2);
      // let x2 = (parseFloat($I('#canvas').width)) / (app.drawing.frame.width * zoom / 100);
      if (targetScale/scale > 1) {
        return i;
      }
      // if (scale > x) {
        // return i;
      // }
    }
    return 0;
  }
  
  SELF.resetZoom = function() {
    window.app.drawing.resetZoom();
  };
  
  SELF.resizeCanvas = function(event) {
    let form = this;
    let width = form.width.value;
    let height = form.height.value;
    event.preventDefault();
    event.stopPropagation();
    app.drawing.resizeCanvas(parseInt(width), parseInt(height), true);
    app.drawing.centerCanvas(scale);
    window.app.drawing.setTempScale(null);
    SELF.resetZoom();
    SELF.toggleModal('resize-canvas');
  };
  
  SELF.togglePaletteWindow = function(opt) {
    let modal = $(`.modal-component[data-name="color-palette"]`)[0];
    let isMobile = ($('.btn-mobile-palette')[0].offsetHeight > 0);
    if (isMobile) {
      modal.toggleMobile();
    } else {
      modal.toggle();
      app.settings.data.windows.palette.isShown =  modal.isShown;
      app.settings.save();
    }
    resize();
  };
  
  SELF.toggleLayerWindow = function() {
    $('.lightbox[data-name="layers"]')[0].toggle();
  };
  
  SELF.escapeKey = function() {
    document.activeElement.blur();
    if (app.drawing.tools.selectedTool == 'rotate') {
      app.drawing.tools.selectLastTool();
      app.drawing.tools.utility.rotate.dropSelection();
    } else if (app.drawing.tools.selectedTool == 'move') {
      app.drawing.tools.selectLastTool();
      app.drawing.tools.utility.move.dropSelection();
    } else {
      app.drawing.frame.clearSelection();
      app.drawing.tools.utility.select.clearSelection();
      app.drawing.redraw();
    }
  };
  
  SELF.saveProject = function() {
    if (window.app.hasOpenedFileHandle()) {
      saveProjectToFileHandle();
    } else if (window.app.openedFileId !== null) {
      storeProjectIDB(app.openedFileId);
    } else {
      saveProject();
    }
  };
  
  async function saveProjectToFileHandle() {
    let json = window.app.exportProject();
    await window.fileSave.saveToFileHandle(json);
    aww.pop('Saved successfully');
  }
  
  SELF.exportProject = function() {
    exportProject();
  };
  
  SELF.confirmDeleteProject = function(id, elProject) {
    if (typeof id != 'number') throw 0;
    
    SELF.confirm('Delete this project?', 'Confirmation').then(isOK => {
      if (isOK) {
        window.fileSave.deleteProject(id).then(() => {
          elProject.remove();
        });
      }
    });
  };
  
  function storeProjectIDB(projectId) {
    let json = window.app.exportProject();
    let blob = new Blob([json], {type:'application/json'});
    
    getThumbnailForIDB().then(thumbnailBlob => {
      window.fileSave.putProjectFile(blob, thumbnailBlob, projectId);
      aww.pop('Project saved');
    });
  }
  
  SELF.closeMobileLandingScreen = function() {
    $('.home-mobile-screen')[0].style.display = 'none';
  };
  
  SELF.backToMobileLandingScreen = function() {
    SELF.confirm('Your still have unsaved work, discard changes?', 'Discard changes').then(isOK => {
      if (isOK) {
        $('.home-mobile-screen')[0].removeAttribute('style');
        window.fileSave.listProjectFiles();
      }
    });
  };
  
  SELF.setGridSize = function(val) {
    window.app.setGridSize(+val);
    reloadGridGuidelines();
  };
  
  SELF.setGridStrokeWidth = function(val) {
    window.app.setGridStrokeWidth(parseFloat(val));
    reloadGridGuidelines();
  };
  
  SELF.setGridStroke = function(val) {
    window.app.setGridStroke(val);
    reloadGridGuidelines();
  };
  
  // SELF.setGridSize = function() {
  //   let selEnd = 99;
  //   // let extMatch = app.openedFileName.split('').reverse().join('').match(/\./);
  //   // if (extMatch) {
  //     // selEnd = app.openedFileName.length - extMatch.index - 1;
  //   // }
  //   SELF.prompt({
  //     title: 'Set Grid Size',
  //     message: 'Grid Size',
  //     defaultValue: window.app.settings.data.view.gridSize,
  //     selection: true,
  //     selectionStart: 0,
  //     selectionEnd: selEnd,
  //   }).then(val => {
  //     val = val.trim();
  //     if (val.length > 0) {
  //       window.app.setGridSize(+val);
  //       reloadGridGuidelines(+val);
  //     }
  //   });
  // };
  
  function reloadGridGuidelines() {
    // size = size * 16;
    let size = app.settings.data.view.gridSize * 16;
    let strokeWidth = app.settings.data.view.gridStrokeWidth;
    let stroke = app.settings.data.view.gridStroke;
    
    $I('#js-grid-guidelines defs').innerHTML = `<pattern id="small-grid" width="${size}" height="${size}" patternUnits="userSpaceOnUse"> 
                  <path d="M ${size} 0 L 0 0 0 ${size}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}"></path> 
              </pattern> `;
  }
  
  SELF.createDraftProject = function() {
    
    // ui.newProject();
    window.app.newProject();
    SELF.closeMobileLandingScreen();
    // let projectTitle = new Date().toDateString();
    // let json = app.exportProject();
    // let a = document.createElement('a');
    // let blob = new Blob([json], {type:'application/json'});
    
    // getThumbnailForIDB().then(thumbnailBlob => {
    //   window.fileSave.create({
    //     blob, 
    //     thumbnailBlob,
    //     title: projectTitle,
    //   });
    // });
    
  };
  
  function exportProject() {
    let selEnd = 0;
    let extMatch = app.openedFileName.split('').reverse().join('').match(/\./);
    if (extMatch) {
      selEnd = app.openedFileName.length - extMatch.index - 1;
    }
    SELF.prompt({
      title: 'Save Project',
      message: 'File name',
      defaultValue: app.openedFileName,
      selection: true,
      selectionStart: 0,
      selectionEnd: selEnd,
    }).then(name => {
      if (name.trim().length > 0) {
        let json = window.app.exportProject();
        let a = document.createElement('a');
        a.download = name + '.pxcaso';
        a.href = URL.createObjectURL(new Blob([json], {type:'application/json'}));
        a.style.display = 'none';
        document.body.append(a);
        a.click();
        a.onclick = function() {
          a.remove();
        };
      }
    });
  }
  
  function saveProject() {
    let selEnd = 0;
    let extMatch = app.openedFileName.split('').reverse().join('').match(/\./);
    if (extMatch) {
      selEnd = app.openedFileName.length - extMatch.index - 1;
    }
    SELF.prompt({
      title: 'Save Project',
      message: 'File name',
      defaultValue: app.openedFileName,
      selection: true,
      selectionStart: 0,
      selectionEnd: selEnd,
    }).then(name => {
      if (name.trim().length > 0) {
        let json = window.app.exportProject();
        let blob = new Blob([json], {type:'application/json'});
        getThumbnailForIDB().then(thumbnailBlob => {
          window.fileSave.save({
            blob, 
            thumbnailBlob,
            title: name,
          }).then(fileId => {
            window.app.openedFileId = fileId;
          });
        });
      }
    });
  }
  
  function getThumbnailForIDB() {
    return new Promise(resolve => {
      
      // get thumbnail blob          
      let config = {
        width: 120,
        height: 120,
        frame: 'single-frame',
        isReverseAnimation: false,
        isExportSelectedLayer: false,
      };
      
      let canvas = app.drawing.frame.generateExportCanvas(config);
    
      canvas.toBlob(thumbnailBlob => {
        resolve(thumbnailBlob);
      }, {type: 'image/png'});   
      
    })
  }
  
  
  function toggleModal(name) {
    for (let modal of $('.modal-window')) {
      if (modal.dataset.name == name) {
        let isHide = modal.classList.toggle('Hide');
        if (isHide) {
        	window.stateManager.popState([0]);
        } else {
        	window.stateManager.pushState([0]);
        }
        break;
      }
    }
  }
  
  SELF.exportImage = async function(event) {
    event.preventDefault();
    let form = this;
    let config = {
      width: form.width.value,
      height: form.height.value,
      frame: form.frame.value,
      isReverseAnimation: form.isReverseAnimation.checked,
      isExportSelectedLayer: form.isExportSelectedLayer.checked,
    };
    
    if (form.isExportLayers.checked) {
      
      let resultItems = app.drawing.frame.generateExportLayersCanvas(config);
      
      if (resultItems.length > 0) {
        
        let zip = new JSZip();
      
        for (let item of resultItems) {
          let blob = await new Promise(resolve => {
            item.canvas.toBlob(blob => {
              resolve(blob);
            }, {type: 'image/png'});
          })
          zip.file(item.fileName, blob, {base64: true});
        }
        
        zip.generateAsync({type:"blob"})
        .then(content => {
          let blob = new Blob([content], { type: 'application/zip' });
      	  let a = document.createElement('a');
      	  a.href = URL.createObjectURL(blob);
      	  a.download = `pixelcaso-export-${new Date().getTime()}.zip`;
      	  document.body.append(a);
      	  a.click();
      	  a.remove();
        });
        
      }
      
    } else {
      
      let canvas = app.drawing.frame.generateExportCanvas(config);
      
      canvas.toBlob(blob => {
        let a = document.createElement('a');
        let url = URL.createObjectURL(blob);
        a.href = url;
        a.download = form.fileName.value;
        a.style.display = 'none';
        document.body.append(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, {type: 'image/png'});
      
    }
  };
  
  SELF.toggleModalByClick = function() {
    toggleModal(this.dataset.target);
  };
  
  SELF.initExportImageForm = function(modal) {
    let form = $('form', modal)[0];
    form.fileName.value = 'Untitled.png';
    form.width.value = app.drawing.frame.width;
    form.height.value = app.drawing.frame.height;
  };
  
  SELF.initExportVideoForm = function(modal) {
    let form = $('form', modal)[0];
    form.width.value = app.drawing.frame.width;
    form.height.value = app.drawing.frame.height;
  };
  
  SELF.handleProjectClick = function(ev) {
    let el = ev.target.closest('.thumbnail');
    if (el) {
      window.fileSave.openProject(Number(el.dataset.id));
      ui.closeMobileLandingScreen();
      let isHide = true;
      SELF.toggleModal('recent-projects', isHide);
    } else {
      el = ev.target.closest('.__remove-btn');
      if (el) {
        let elProject = ev.target.closest('.thumb-save');
        SELF.confirmDeleteProject(Number(el.dataset.id), elProject);
      }
    }
  };
  
  SELF.toggleModal = function(name, forceHide) {
    let modal;
    if (forceHide !== undefined) {
      if (forceHide) {
        modal = $(`.modal-component[data-name="${name}"]`)[0].close();
      } else {
        modal = $(`.modal-component[data-name="${name}"]`)[0].open();
      }
    } else {
      modal = $(`.modal-component[data-name="${name}"]`)[0].toggle();
    }
    if (modal.isShown) {
      document.activeElement.blur();
      window.setTimeout(() => {
        let firstInputEl = modal.qf('input');
        if (firstInputEl) {
          modal.q('input,select').focus();
        } else {
          modal.q('button').focus();
        }
      }, 50);
    	window.stateManager.pushState([0]);
      switch (name) {
        case 'export-image': SELF.initExportImageForm(modal); break;
        case 'export-video': SELF.initExportVideoForm(modal); break;
      }
    }
    return modal;
  };
  
  SELF.openModal = function(name) {
    SELF.toggleModal(name);
  };
  
  SELF.newProject = function() {
    SELF.confirm('Discard current project and start a new one?', 'New Project').then(isOK => {
      if (isOK) {
        app.newProject();
      }
    });
  };
  
  
  SELF.exportVideo = function() {
    let modalName = this.dataset.targetModal;
    let form = $(`.custom-form[name="${modalName}"]`)[0];
    form.width.value = app.drawing.frame.width;
    form.height.value = app.drawing.frame.height;
    toggleModal(modalName);
  }
  
  
  SELF.openProject = function() {
    $('.uploadable[data-callback="open-project"]')[0].click();
  };
  
  
  SELF.initUploadable = function() {
    for (let node of $('.uploadable')) {
      node.addEventListener('change', DOMEvents.uploadable[node.dataset.callback]);
    }
  };
  
  function getAspectRatioHeight(newWidth, width, height) {
    let newHeight = newWidth * height / width; 
    return newHeight;
  }
  
  function resize() {
    window.setTimeout(() => {
      app.drawing.rebound();
      let isMobile = ($('.btn-mobile-palette')[0].offsetHeight > 0);
      if (isMobile) {
        app.drawing.resizeBaseCanvas(DOM.canvas.parentNode.offsetWidth, DOM.canvas.parentNode.offsetHeight);
      } else {
        // todo: find a way to recalculate automatic grid canvas size
        let w = ($('modal-v2-color-palette')[0].offsetWidth > 0) ? document.body.offsetWidth - 282 : document.body.offsetWidth;
        app.drawing.resizeBaseCanvas(w, DOM.canvas.parentNode.offsetHeight);
      }
      // app.drawing.centerCanvas(scale);
      app.drawing.redraw();
    })
  }
  
  SELF.triggerResize = resize;
  
  function seekCallback() {
    let callback = this.dataset.callback;
  }
  
  function initModalWindow() {
    
    // preferences
    let modal;
    let content;
    let overlay;
    let btnClose;
    let form;
    let title;
    let message;
    let input;
    let hideClass = 'Hide';
  
    let _resolve;
    let _reject;
    let type = 'confirm';
  
    function initComponent(modal) {
      content = $('.Modal', modal)[0];
      overlay = $('.Overlay', modal)[0];
      btnClose = $('.Btn-close', modal)[0];
      form = $('.form', modal)[0];
      title = $('.Title', modal)[0];
      message = $('.Message', modal)[0];
      input = $('input', modal)[0]; 
    }
  
    function getResolver() {
    	window.addEventListener('keydown', blur);
    	return new Promise((resolve, reject) => {
        _resolve = resolve;
        _reject = reject;
      });
    }
    
    function closeModal() {
      modal.classList.toggle(hideClass, true);
      window.removeEventListener('keydown', blur);
      app.stateManager.popState([0]);
      form.onsubmit = () => event.preventDefault();
    }
  
    function blur() {
      if (event.key == 'Escape') {
        closeModal();
  	if (type == 'prompt')
        _resolve(null);
      else {
        _reject();
      }
      } 
    }
    
    function close() {
      closeModal();
  	if (type == 'prompt')
  	    _resolve(null)
      else {
        _reject();
      }
    }
  
    function submitForm() {
      event.preventDefault();
      if (event.submitter.name == 'submit') {
        if (type == 'confirm')
          _resolve();
        else
          _resolve(input.value);
      } else {
    		if (type == 'prompt')
  	  		_resolve(null)
        else {
          _reject();
        }
      }
      closeModal(); 
    }
  
    window.cconfirm = function(promptText = '', isFocusSubmit = true) {
      modal = $('#cconfirm-modal');
      initComponent(modal);
      type = 'confirm';
      modal.classList.toggle(hideClass, false)
      app.stateManager.pushState([0]);
      overlay.onclick = close;
      btnClose.onclick = close;
      form.onsubmit = submitForm;
      document.activeElement.blur();
      setTimeout(() => {
        if (isFocusSubmit)
          $('.Btn-submit', modal)[0].focus();
        else
          $('.Btn-cancel', modal)[0].focus();
      }, 150);
      message.textContent = promptText;
      return getResolver();
    }
  
    window.cprompt = function(promptText = '', defaultValue = '') {
      modal = $('#cprompt-modal');
      initComponent(modal);
      input = $('input', modal)[0];
      type = 'prompt';
      modal.classList.toggle(hideClass, false)
      app.stateManager.pushState([0]);
      overlay.onclick = close;
      btnClose.onclick = close;
      form.onsubmit = submitForm;
      document.activeElement.blur()
      title.textContent = promptText;
      input.value = defaultValue;
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(0,input.value.length);
      }, 150);
      return getResolver();
    }
  }
  
  function setDataTarget(el) {
    let node = el.parentNode;
    while (node) {
      if (node.classList.contains('modal-window')) {
        el.dataset.target = node.dataset.name;
        break;
      } else {
        node = node.parentNode;
      }
    } 
  }
  
  SELF.mobileSelectionTool = function() {
    $('.mobile-tools')[0].dataset.mode = "selection";  
    app.drawing.tools.selectTool('select', true);
  };
  
  function initUIToggler() {
    
    function getCallback() {
      let isToggled = toggleCustomResolution.isToggled === undefined ? true : toggleCustomResolution.isToggled;
      callbacks[this.dataset.callback](isToggled, this);
      toggleCustomResolution.isToggled = isToggled ? false : true;
    }
    
    for (let node of $('.ui-toggler')) {
      node.addEventListener('input', getCallback);
    }
  }
  
  function ratioInput(form, input) {
    if (form.isMaintainAspectRatio.checked) {
      if (input.name == 'width') {
        form.height.value = Number(input.value)*app.drawing.frame.height/app.drawing.frame.width;
      } else if (input.name == 'height') {
        form.width.value = Number(input.value)*app.drawing.frame.width/app.drawing.frame.height;
      }
    }
  }
  
  function initInputable() {
    let callback = {
      'export-image::width': ratioInput,
      'export-image::height': ratioInput,
      'export-video::width': ratioInput,
      'export-video::height': ratioInput,
    };
    
    function handleInput() {
      let form = this.form;
      let name = this.name;
      let key = form.name+'::'+name;
      if (callback[key])
        callback[key](this.form, this);
    }
    
    for (let node of $('.inputable')) {
      node.addEventListener('input', handleInput);
    }
  }
  
  
  function selectTool() {
    app.drawing.tools.selectTool(this.dataset.tool);
  }
  
  function attachMenuListener() {
  
    let callbacks = DOMEvents.menuLink;
    
    for (let menu of $('.menu-link')) {
      let callback = getCallback(callbacks, menu.dataset.callback.split('.'));
      menu.addEventListener('click', callback);
    }
    
    function getCallback(cb, keys) {
      if (keys.length > 0) {
        let key = keys.shift();
        if (cb[key] === undefined)
          return null;
        return getCallback(cb[key], keys);
      } else {
        return cb;
      }
    }
  }
  
  SELF.getImageData = function(e) {
    const dT = e.clipboardData || window.clipboardData;
    const file = dT.files[0];
    if (file && file.type.includes('image')) {
      window.appFileReader.openImage(dT);
    }
    nono.style.display = 'none';
  };
  
  SELF.resetWindow = function() {
    app.settings.reset();
    initWindowState();
  };
  
  SELF.confirm = function(message = '', title = 'Confirm', cancelText = 'Cancel') {
    let modal = SELF.toggleModal('confirm');
    let form = $('form', modal)[0];
    let cancelBtn = $('.cancel-btn', modal)[0];
    cancelBtn.textContent = cancelText;
    $('p', modal)[0].innerHTML = message;
    $('.title', modal)[0].innerHTML = title;
    return new Promise(resolve => {
      cancelBtn.onclick = () => {
        resolve(false);
      };
      form.onsubmit = (event) => { 
        event.preventDefault(); event.stopPropagation();
        resolve(true);
        SELF.toggleModal('confirm');
      };
    }); 
  };

  SELF.prompt = function(opt = {
    message: 'Default message',
    title: 'Default title',
    defaultValue: '',
    selection: false,
    selectionStart: null,
    selectionEnd: null,
  }) {
    let modal = SELF.toggleModal('prompt');
    let form = $('form', modal)[0];
    $('.label', modal)[0].innerHTML = opt.message;
    $('.title', modal)[0].innerHTML = opt.title;
    $('input', modal)[0].value = opt.defaultValue;
    if (opt.selection) {
      window.setTimeout(() => {
        if (opt.selectionStart != null && opt.selectionEnd != null) {
          $('input', modal)[0].setSelectionRange(opt.selectionStart, opt.selectionEnd);
        } else {
          $('input', modal)[0].setSelectionRange(0, opt.defaultValue.length);
        }
      }, 1);
    }
    
    return new Promise(resolve => {
      form.onsubmit = (event) => { 
        event.preventDefault(); event.stopPropagation();
        resolve($('input', modal)[0].value);
        SELF.toggleModal('prompt');
      };
    }); 
  };

  return SELF;
}