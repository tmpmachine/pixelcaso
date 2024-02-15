  
function UndoManager() {
  
  let undoStack = [];
  let layerSnapshots = {};
  let undoLayers = [];
  let deletedLayers = [];
  let deletedFrames = [];
  
  let pointer = 0;
  let pointerSnapshot = 0;
  let flagOffset = 5;
  
  let _ = {
    snapshots: [],
    isSnapshot: false,
    isRecording: false,
  };
  
  let SELF = {
    undo,
    redo,
    record,
    getUndoStack,
    getLastAction,
    stopRecording,
    startRecording,
    store,
  };
  
  //let x = [];
  
  function startRecording(data, isSnapshot = true) {
    if (!_.isRecording) {
      _.isRecording = true;
      _.isSnapshot = isSnapshot;
      undoStack.length = pointer;
      undoLayers.length = 0;
      
      let frameContext = app.layer.getFrame(app.drawing.frame.getFrameIndex());
      if (frameContext && frameContext.canvas.dataset.state == 1) {
        frameContext.canvas.dataset.state = 2;
        takeSnapshot(pointer-1, frameContext.canvas);
      }
      // data.tainted = true;
      // let c = app.drawing.frame.createDrawingContext();
      // let canvas = c.canvas;
      // c.drawImage(app.drawing.context.canvas,0,0);
      // x[pointer] = canvas;
      // document.body.append(canvas)
      
      undoStack.push(data);
      removeUnusedSnapshots();
    } else {
      // console.log('undoManager: another recording is running.');
    }
  }
  
  function stopRecording(isTakeSnapshot = false, pointerDecrement = 0) {
    if (!_.isRecording) {
      return;
    }
    
    pointer++;
    if (_.isSnapshot) {
      pointerSnapshot++;
      if (pointerSnapshot % flagOffset === 0 || isTakeSnapshot)
        takeSnapshot(pointer + pointerDecrement);
      else if (undoStack.length > 1)
        checkForceSnapshot(pointer); 
    }
    _.isRecording = false;
    _.isSnapshot = false;
  }
  
  function removeUnusedSnapshots() {
    if (_.snapshots.length === 0)
      return;
    let len = _.snapshots.length;
    let i = len-1;
    if (_.snapshots[i].pointer > pointer) {
      while (i >= 0) {
        if (_.snapshots[i].pointer > pointer) {
          len--;
        } else {
          break; 
        }
        i--;
      }
      _.snapshots.length = len;
    }
  }
  
  function takeSnapshot(pointer, baseCanvas) {
    let c = app.drawing.frame.createDrawingContext();
    let canvas = c.canvas;
    c.drawImage(app.drawing.context.canvas,0,0);
    let snapshot = {
      pointer,
      canvas,
      baseCanvas,
      layerId: app.layer.activeLayerId,
      frameIndex: app.drawing.frame.getFrameIndex(),
    };
    _.snapshots.push(snapshot);
  }
  
  function takeLastLayerSnapshot(pointer, layerId) {
    let c = app.drawing.frame.createDrawingContext();
    let canvas = c.canvas;
    let index = app.drawing.frame.getLayerIndex(layerId);
    if (index === -1)
      return;
    let frameIndex = app.drawing.frame.activeFrameIndex;
    let frame = app.layer.layers[index].frames[frameIndex];
    if (frame) {
      c.drawImage(app.layer.layers[index].frames[frameIndex].canvas,0,0);
    }
    let snapshot = {
      pointer,
      canvas,
      layerId,
    };
    _.snapshots.push(snapshot);
  }
  
  function checkForceSnapshot(pointer) {
    let i = pointer-2;
    while (undoStack[i]) {
      if (undoStack[i].type == 'delete-layer') {
        i--;
      } else {
        if (undoStack[pointer-1].layerId != undoStack[i].layerId) {
          takeLastLayerSnapshot(pointer-1, undoStack[i].layerId);
        }
        break;
      }
    }
  }
  
  function record(data) {
    undoStack[pointer].data.push(data);
  }
  
  function undo() {
    if (app.drawing.tools.utility.move.isWaitingDrop) {
      app.drawing.tools.utility.move.undo();
    } else {
      popHistory();
    }
  }
  
  function popHistory() {
    if (pointer <= 0) {
      return;
    }
    
    pointer--;
    if (!['delete-layer'].includes(undoStack[pointer].type)) {
      pointerSnapshot--;
    }
    let i = _.snapshots.length-1;
    // let snapshotCanvas;
    // while (i >= 0) {
    //   if (_.snapshots[i].pointer < pointer && _.snapshots[i].layerId == undoStack[pointer].layerId && _.snapshots[i].frameIndex == undoStack[pointer].frameIndex) {
    //     snapshotCanvas = _.snapshots[i];
    //     break;
    //   }
    //   i--;
    // }
    let snapshotData = getLastSnapshotData(i);
    
    let startPointer = (snapshotData.index <= 0) ? 0 : _.snapshots[snapshotData.index].pointer;
    // let startPointer = Math.min(Math.max(0, snapshotData.index), _.snapshots[i].pointer);
    app.drawing.goToHistory('undo', {
      startPointer,
      pointer,
      canvas: snapshotData.canvas,
    });
    app.clipboard.addHistoryOffset(-1);
  }
  
  function getLastSnapshotData(i) {
    let canvas;
    while (i >= 0) {
      if (_.snapshots[i].pointer < pointer && 
        _.snapshots[i].layerId == undoStack[pointer].layerId && 
        _.snapshots[i].frameIndex == undoStack[pointer].frameIndex) {
          
        canvas = _.snapshots[i];
        break;
      }
      i--;
    }
    return {
      canvas,
      index: i,
    };
  }
  
  function redo() {
    if (pointer < undoStack.length) {
      app.drawing.goToHistory('redo', {pointer});
      if (!['delete-layer'].includes(undoStack[pointer].type)) {
        pointerSnapshot++;
      }
      pointer++;
      app.clipboard.addHistoryOffset(1);
    }
  }
  
  function getLastAction() {
    return undoStack[pointer].data[undoStack[pointer].data.length-1];
  }
  
  function getUndoStack() {
    return undoStack;
  }
  
  function store(data) {
    startRecording(data);
    stopRecording();
  }
  
  SELF.reset = function() {
    undoStack.length = 0;
    _.snapshots.length = 0;
    layerSnapshots.length = 0;
    undoLayers.length = 0;
    deletedLayers.length = 0;
    deletedFrames.length = 0;
    pointer = 0;
    pointerSnapshot = 0;
  };
  
  Object.defineProperty(SELF, 'pointer', { get: () => pointer });
  Object.defineProperty(SELF, 'undoLayers', { get: () => undoLayers });
  Object.defineProperty(SELF, 'deletedLayers', { get: () => deletedLayers });
  Object.defineProperty(SELF, 'deletedFrames', { get: () => deletedFrames });
  Object.defineProperty(SELF, 'snapshots', { get: () => _.snapshots });
  
  return SELF;
}