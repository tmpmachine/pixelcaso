;(function() {
  
  "use strict";
  
  window.UIMobile = function() {
  
    // global var
    let _activePane = 'drawing';
    let $ = window.$;
    let app = window.app;
    let ui = window.ui;
    // let DOMEvents = window.DOMEvents;
    // let stateManager = window.stateManager;
  
    // local properties
    const SELF = {
  
    };
    
    SELF.toggleLayersWindow = function() {
      let isShown = document.body.classList.toggle('layer-setting');
      $('.tool-bar .inner')[0].classList.toggle('hide', isShown);
      if (isShown) {
        SELF.setActivePane('layers');
        displayExtraPane();
      } else {
        let isForce = true;
        SELF.updateToolPane(isForce);
      }
    };
    
    SELF.setActivePane = function(pane) {
      _activePane = pane;
      displayExtraPane();
    };
    
    SELF.updateToolPane = function(isForce = false) {
      let tool = app.drawing.tools.selectedTool;
      let isActiveLayerMenu = !$('.mobile-setting-menu')[0].classList.contains('hide');
      if (isActiveLayerMenu && !isForce) {
        return;
      }
      if (tool == 'hand')
        return;
        
      SELF.setActivePane('selection');
      if (['pencil','line','eraser','rectangle','ellipse'].includes(tool)) {
        SELF.setActivePane('drawing');
      }
      displayExtraPane();
    };
    
    function displayExtraPane() {
      for (let pane of $('.mobile-pane')) {
        pane.classList.toggle('hide', true);
      }
      for (let pane of $('.mobile-pane')) {
        if (pane.dataset.name == _activePane) {
          pane.classList.toggle('hide', false);
        }
      }
      
      // $('.mobile-setting-menu')[0].classList.toggle('hide', !isShown);
      // $('.mobile-setting-pane')[0].classList.toggle('hide', !isShown);
      // $('.mobile-selection-pane')[0].classList.toggle('hide', isShown);
    }  
    
    SELF.updatePenSize = function(size) {
      app.drawing.tools.setLineWidth(size);
    };
    
    SELF.toggleMove = function() {
      if (!ui.isMoveCanvas) {
        // $('.mobile-tools')[0].dataset.mode = 'selection';
        ui.isMoveCanvas = true;
        app.drawing.tools.selectTool('hand', true);
        // app.drawing.tools.lock();
        // app.drawing.tools.utility.hand.start();
      }else {
        disableMove2();
      }
      $('.mobile-left-tools')[0].classList.toggle('isPan', ui.isMoveCanvas);
      // if (!SELF.isMoveCanvas && !app.drawing.tools.isLocked) {
              // SELF.isMoveCanvas = true;
              // app.drawing.tools.selectTool('hand', true);
              // app.drawing.tools.lock();
              // app.drawing.tools.utility.hand.start();
            // }
      // this.classList.toggle('isActive', true);
    };
    
    SELF.dropSelection = function() {
      app.drawing.tools.selectLastTool();
      $('.mobile-tools')[0].dataset.mode = 'default';
      ui.escapeKey();
    };
    
    function disableMove2(node) {
      ui.isMoveCanvas = false;
      if (!app.drawing.tools.lastTool == 'move') {
        $('.mobile-tools')[0].dataset.mode = 'default';
      }
      
      // app.drawing.tools.unlock();
      app.drawing.tools.selectLastTool();
      // app.drawing.tools.utility.hand.end();
      // node.classList.toggle('isActive', false);
    }
    
    function disableMove() {
      disableMove2($('.clickable[data-callback="toggle-move"]')[0]);
    }
    
    SELF.settingMenu = {
      back: function() {
        $('.mobile-setting-menu')[0].classList.toggle('hide', true);
        $('.tool-bar .inner')[0].classList.toggle('hide', false);
      },
    };
    
    function attachClickable(nodes, callback) {
      for (let element of nodes) {
        element.addEventListener('click', getCallback(callback, element.dataset.callback.split('.')));
      }
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
    
    SELF.layer = {
      updateMenu: function(layerCount) {
        // L('todo: update mobile setting menu for layer control')
      },
      focus: function(e) {
        // let cls = event.target.classList;
        let layerId = e.target.dataset.layerId;
        ui.layer.change(e);
      },
      undoDelete: function(layer, index) {
        let container = $('.mobile-setting-pane')[0];
        if ($(`.layer.--active`, container)[0])
          $(`.layer.--active`, container)[0].classList.remove('--active');
        
        let node = $('template[layer-mobile]')[0].content.cloneNode(true);
        $('.name', node)[0].textContent = layer.name;
        $('.name', node)[0].title = layer.name;
        $('.frames', node)[0].dataset.layerId = layer.id;
        $('.name', node)[0].dataset.layerId = layer.id;
        $('.layer', node)[0].dataset.layerId = layer.id;
        $('.layer', node)[0].classList.add('--active');
        attachClickable($('.clickable', node), DOMEvents.clickable);
        container.insertBefore(node, $('.layer', container)[index]);
      },
      list: function(layers) {
        // if ($(`.layer.--active`)[0])
          // $(`.layer.--active`)[0].classList.remove('--active');
          
        let fragment = document.createDocumentFragment();
        for (let layer of layers) {
          let node = $('template[layer-mobile]')[0].content.cloneNode(true);
          $('.name', node)[0].textContent = layer.name;
          $('.frames', node)[0].dataset.layerId = layer.id;
          // $('.name', node)[0].addEventListener('dblclick', this.doubleClickRename);
          $('.name', node)[0].title = layer.name;
          $('.name', node)[0].dataset.layerId = layer.id;
          $('.layer', node)[0].dataset.layerId = layer.id;
          $('.layer', node)[0].classList.add('--active');
          attachClickable($('.clickable', node), DOMEvents.clickable);
          fragment.append(node);
        }
        $('.mobile-setting-pane')[0].innerHTML = '';
        $('.mobile-setting-pane')[0].append(fragment);
        
        SELF.layer.updateMenu(layers.length);
        // this.listFrames(layer);
        // this.highlightFrame(app.drawing.frame.getFrameIndex(), layer.id);
      },
      append: function(layer) {
        let container = $('.mobile-setting-pane')[0];
        if ($(`.layer.--active`, container)[0])
          $(`.layer.--active`, container)[0].classList.remove('--active');
        
        let node = $('template[layer-mobile]')[0].content.cloneNode(true);
        $('.name', node)[0].textContent = layer.name;
        $('.frames', node)[0].dataset.layerId = layer.id;
        // $('.name', node)[0].addEventListener('dblclick', this.doubleClickRename);
        $('.name', node)[0].title = layer.name;
        $('.name', node)[0].dataset.layerId = layer.id;
        $('.layer', node)[0].dataset.layerId = layer.id;
        $('.layer', node)[0].classList.add('--active');
        attachClickable($('.clickable', node), DOMEvents.clickable);
        $('.mobile-setting-pane')[0].insertBefore(node, $('.mobile-setting-pane')[0].firstElementChild);
        
        // this.listFrames(layer);
        // this.highlightFrame(app.drawing.frame.getFrameIndex(), layer.id);
      },
    },
    
    SELF.toggleDrawTool = function() {
      if (ui.isMoveCanvas) {
        disableMove();
        let tool = this.classList.contains('isPencil') ? 'pencil' : 'eraser';
        app.drawing.tools.selectTool(tool);
        return;
      }
      let isPencil = this.classList.toggle('isPencil');
      this.classList.toggle('isEraser');
      if (isPencil)
        app.drawing.tools.selectTool('pencil');
      else
        app.drawing.tools.selectTool('eraser');
    };
    
    return SELF;
  }
  
})();