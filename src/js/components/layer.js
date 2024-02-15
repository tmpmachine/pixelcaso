function Layer() {
  
  'use strict';
  
  let SELF = {
    activeLayerId: null, 
    activeLayerIndex: 0, 
    newLayerCounter: 1,
    layers: [],
  };
  
  SELF.reset = function() {
    SELF.activeLayerId = null;
    SELF.activeLayerIndex = 0;
    SELF.newLayerCounter = 1;
    SELF.layers.length = 0;
    
    let isRecordHistory = false;
    SELF.insertLayer(isRecordHistory);
    SELF.list();
  };
  
  SELF.setAlpha = function(layerId, initialAlpha, alpha) {
    let layer = SELF.getLayerById(layerId);
    layer.alpha = alpha;
    app.drawing.redraw();
    
    app.undoManager.store({
      type: 'set-alpha',
      frameIndex: app.drawing.frame.getFrameIndex(),
      layerId: layer.id,
      data: {
        alpha,
        initialAlpha,
      },
    });
  };
  SELF.undoSetAlpha = function(history) {
    let layer = SELF.getLayerById(history.layerId);
    layer.alpha = history.data.initialAlpha;
    app.drawing.redraw();
  };
  SELF.redoSetAlpha = function(history) {
    let layer = SELF.getLayerById(history.layerId);
    layer.alpha = history.data.alpha;
    app.drawing.redraw();
  };
  
  SELF.changeAlphaTemporary = function() {
    let form = this.form;
    let layer = SELF.getLayerById(form.layerId.value);
    layer.alpha = parseFloat(this.value);
    app.drawing.redraw();
  };
  
  SELF.getFrame = function(frameIndex) {
    let layer = SELF.layers[SELF.activeLayerIndex];
    if (layer)
      return layer.frames[frameIndex];
    return null;
  };
  
  SELF.isVisible = function() {
    return SELF.layers[SELF.activeLayerIndex].isVisible;
  };
  
  SELF.insertKeyFrame = function(frameIndex) {
    let frame = app.drawing.frame.createDrawingContext();
    SELF.layers[SELF.activeLayerIndex].frames[frameIndex] = frame;
    return frame;
  };
  
  function generateUID() {
    return parseInt(performance.now()).toString();
  }
  
  SELF.insertLayer = function(isRecord = true) {
    let layer = {
      id: generateUID(),
      name: `Untitled Layer ${SELF.newLayerCounter}`,
      isVisible: true,
      alpha: 1,
      frames: [],
    };
    
    SELF.newLayerCounter++;
    SELF.layers.splice(0,0,layer);
    
    ui.layer.append(layer);
    ui.statusBar.update({
      layer: layer.name,
    });
    
    if (isRecord) {
      app.undoManager.store({
        type: 'insert-layer',
        frameIndex: app.drawing.frame.getFrameIndex(),
        layerId: layer.id,
        data: {
          srcLayerId: SELF.activeLayerId,
        },
      });
    }
    
    SELF.change(layer.id);
    
    return layer;
  };
  
  SELF.change = function(layerId) {
    app.drawing.tools.utility.move.dropSelection();
    SELF.activeLayerId = layerId;
    SELF.activeLayerIndex = SELF.getLayerIndexById(layerId);
    
    SELF.setUIState();
    
    let layer = SELF.getLayerById(layerId);
    ui.statusBar.update({
      layer: layer.name,
    });
  };
  
  SELF.setUIState = function() {
    let states = [];
    if (SELF.activeLayerIndex === 0)
      states.push('is-first-layer');
    if (SELF.activeLayerIndex == SELF.layers.length-1)
      states.push('is-last-layer');
    if (SELF.layers.length === 0)
      states.push('is-last-layer', 'no-layer');
    
    ui.layer.updateActionState(states);
    ui.layer.highlightLayer(SELF.activeLayerId);
  };
  
  SELF.getLayerIndexById = function(layerId){
    let i = 0;
    for (let layer of SELF.layers) {
      if (layer.id == layerId) 
        break
      i++;
    }
    return i;
  };
  
  SELF.getLayerById = function(layerId){
    for (let layer of SELF.layers) {
      if (layer.id == layerId) 
        return layer;
    }
    return null;
  };

  
  SELF.delete = function(id = SELF.activeLayerId, isStoreHistory = true) {
    if (SELF.layers.length === 0)
      return;
      
    let index = SELF.getLayerIndexById(id);
    let deletedLayer = SELF.layers.splice(index, 1)[0];
    app.undoManager.deletedLayers.push({
      layer: deletedLayer,
      popIndex: index,
    });

    if (isStoreHistory) {
      app.undoManager.startRecording({
        type: 'delete-layer',
        frameIndex: app.drawing.frame.getFrameIndex(),
        layerId: deletedLayer.id,
        data: {
          popIndex: index,
        }
      }, false);
      app.undoManager.stopRecording();
    }
    let layerName = '<no-layer>';
    if (SELF.layers.length > 0) {
      SELF.change(SELF.layers[Math.min(SELF.layers.length-1, index)].id);
      layerName = SELF.layers[Math.min(SELF.layers.length-1, index)].name;
    } else {
      SELF.setUIState();
    }
    
    ui.layer.removeLayer(deletedLayer.id);
    ui.statusBar.update({
      layer: layerName,
    });
    
    app.drawing.redraw();
    animator.onframeupdate(app.drawing.frame.getFrameIndex());
  };
  
  SELF.mergeLayer = function() {
    if (app.layer.layers.length === 0)
      return;
    
    // STEP : export layer
    let canvas = app.drawing.frame.getCurrentCanvasCopy();

    // STEP : delete layer
    SELF.delete();

    // STEP : draw merged layer
    // if (!isWaitingDrop) {
    //   app.drawing.tools.utility.select.clearSelection();
    //   app.drawing.redraw();
    //   return;
    // }
    // let dropData = {
    //   isFlipHorizontal: _.isFlipHorizontal,
    //   isFlipVertical: _.isFlipVertical,
    //   selection: {
    //     x: selectOriginX,
    //     y: selectOriginY,
    //     w: selectionW,
    //     h: selectionH,
    //   },
    //   wandSections: null,
    //   drop: {
    //     x: dSX+dropX, 
    //     y: dSY+dropY,
    //   },
    //   selectionMode: app.drawing.tools.selectionMode,
    // };
    // if (app.drawing.tools.selectionMode == 'wand') {
      // dropData.wandSections = JSON.parse(JSON.stringify(app.drawing.frame.wandSections));
    // }
    
    let layer = app.drawing.frame.getSelectionLayer();
    // app.drawing.recordAction();
    // if (isCopy) {
    //   isCopy = false;
    //   let clipboardIndex = app.clipboard.store();
    //     app.undoManager.record(Object.assign({
    //       type: 'copy-from-clipboard',
    //       clipboardIndex,
    //     }, dropData));
    // } else {
      
    //   // clear wand/rectangular selection
    //   if (app.drawing.tools.selectionMode == 'wand') {
    //     let wandSections = app.drawing.frame.wandSections;
    //     for (let i=0; i<wandSections.length; i++) {
    //       app.drawing.context.clearRect(wandSections[i].x, wandSections[i].y, 1, wandSections[i].h);
    //     }
    //   } else if (app.drawing.tools.selectionMode == 'rectangular') {      
    //     app.drawing.context.clearRect(selectOriginX, selectOriginY, selectionW, selectionH);
    //   }
      
    //   app.undoManager.record(Object.assign({
    //     type: 'move',
    //   }, dropData));
    // }
    app.drawing.context.drawImage(canvas, 0, 0);
    // isWaitingDrop = false;
    // _.isFlipHorizontal = false;
    // _.isFlipVertical = false;
    // app.drawing.tools.utility.select.clearSelection();
    app.drawing.redraw();
    animator.onframeupdate(app.drawing.frame.getFrameIndex());
    // app.undoManager.stopRecording();
    
  };
  
  SELF.duplicate = function() {
    if (app.layer.layers.length === 0)
      return;
    
    let activeLayerId = SELF.activeLayerId;
    // STEP : export layer
    let canvas = app.drawing.frame.getCurrentCanvasCopy();

    // STEP : insert layer
    let isRecord = false;
    let layer = SELF.insertLayer(isRecord);
    
    app.undoManager.startRecording({
      type: 'duplicate-layer',
      frameIndex: app.drawing.frame.getFrameIndex(),
      layerId: layer.id,
      data: {
        srcLayerId: activeLayerId,
      },
    });
    
    app.drawing.context.drawImage(canvas, 0, 0);

    let isTakeSnapshot = true;
    let decrement = -1;
    app.undoManager.stopRecording(isTakeSnapshot, decrement);

    app.drawing.redraw();
    animator.onframeupdate(app.drawing.frame.getFrameIndex());
  };
  
  SELF.renameLayer = function(id = SELF.activeLayerId, isStoreHistory = true, name = null) {
    let layers = SELF.layers;
    if (layers.length === 0)
      return;
    let index = SELF.getLayerIndexById(id);
    
    new Promise(resolve => {
      if (name === null) {
        ui.prompt({
          title: 'Rename Layer',
          message: '',
          defaultValue: layers[index].name,
          selection: true,
        }).then(resolve);
      } else {
        resolve();
      }
    }).then(name => {
      if (name) {
        if (isStoreHistory) {
          app.undoManager.startRecording({
            type: 'rename-layer',
            frameIndex: app.drawing.frame.getFrameIndex(),
            layerId: id,
            data: {
              oldName: layers[index].name,
              newName: name,
            }
          }, false);
          app.undoManager.stopRecording();
        }
        
        layers[index].name = name;
        // SELF.list();
        ui.layer.rename(id, name);
        ui.statusBar.update({
          layer: name,
        });
      }
    });
    
  }
  
  SELF.moveUp = function(id = SELF.activeLayerId, isStoreHistory = true) {
    let layers = SELF.layers;
    let index = SELF.getLayerIndexById(id);
    let layer = layers.splice(index,1);
    layers.splice(Math.max(0,index-1),0,...layer);
    app.drawing.redraw();
    // SELF.list();
    ui.layer.moveUp(id);
    SELF.change(id);

    if (isStoreHistory) {
      app.undoManager.startRecording({
        type: 'move-layer',
        frameIndex: app.drawing.frame.getFrameIndex(),
        layerId: id,
        data: {
          direction: 'up',
        }
      }, false);
      app.undoManager.stopRecording();
    }
    animator.onframeupdate(app.drawing.frame.getFrameIndex());
  }
  
  SELF.moveDown = function(id = SELF.activeLayerId, isStoreHistory = true) {
    let layers = SELF.layers;
    let index = SELF.getLayerIndexById(id);
    let layer = layers.splice(index,1);
    layers.splice(Math.min(layers.length,index+1),0,...layer);
    app.drawing.redraw();
    // SELF.list();
    ui.layer.moveDown(id)
    SELF.change(id);
    // SELF.setUIState();

    if (isStoreHistory) {
      app.undoManager.startRecording({
        type: 'move-layer',
        frameIndex: app.drawing.frame.getFrameIndex(),
        layerId: id,
        data: {
          direction: 'down',
        }
      }, false);
      app.undoManager.stopRecording();
    }
    animator.onframeupdate(app.drawing.frame.getFrameIndex());
  }
  
  SELF.toggleVisibility = function(id = SELF.activeLayerId, isStoreHistory = true, isVisible = null) {
    let index = SELF.getLayerIndexById(id);
    let layer = SELF.layers[index];
    if (typeof(isVisible) == 'boolean')
      layer.isVisible = isVisible;
    else
      layer.isVisible = !layer.isVisible;

    if (isStoreHistory) {
      app.undoManager.startRecording({
        type: 'toggle-visibility',
        frameIndex: app.drawing.frame.getFrameIndex(),
        layerId: SELF.activeLayerId,
        data: {
          layerId: id,
          isVisible: layer.isVisible,
        }
      }, false);
      app.undoManager.stopRecording();
    }
    ui.layer.toggleVisibility(layer.id, layer.isVisible);
    app.drawing.redraw();
    animator.onframeupdate(app.drawing.frame.getFrameIndex());
  }
  
  SELF.list = function() {
    ui.layer.emptyTimeline();
    for (let i=SELF.layers.length-1; i>=0; i--) {
      ui.layer.append(SELF.layers[i]);
    }
    SELF.change(SELF.layers[0].id);
    
    // ui.layer.list(SELF.layers);
  };
  
  SELF.listMobile = function() {
    // uiMobile.layer.list(SELF.layers);
    // uiMobile.layer.emptyTimeline();
    // for (let i=SELF.layers.length-1; i>=0; i--) {
      // uiMobile.layer.append(SELF.layers[i]);
    // }
    // SELF.change(SELF.layers[0].id);
  }
  
  return SELF;
}