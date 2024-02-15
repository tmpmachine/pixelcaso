let cam = {
  x: 0,
  y: 0,
  dx: 0,
};
cam2 = 0;
let scaleValues = [5,10,20,30,40,50,100,120,150,200];
let scaleIndex = 6;
let scale = 1;
let pressedKeys = {};

function App() {
  
  let SELF = {
    wakeLock: null,
    openedFileName: 'Untitled Project',
    openedFileId: null,
    
    // app sub components
    drawing: null,
    timeline: null,
    undoManager: null,
    clipboard: null,
    layer: null,
    stateManager: null,
    projectManager: null,
  };
  
  SELF.init = function() {
    // SELF.drawing.frame.insertKeyFrame();
    initPreferences();
    ui.init();
    ui.DOM.palette.init();
    SELF.projectManager.createProject();
    window.fileSave.listProjectFiles();
  };
  
  SELF.setGridSize = function(size) {
    window.app.settings.data.view.gridSize = parseInt(size);
    window.app.settings.save();
  };
  
  SELF.setGridStrokeWidth = function(size) {
    window.app.settings.data.view.gridStrokeWidth = parseFloat(size);
    window.app.settings.save();
  };
  
  SELF.setGridStroke = function(val) {
    window.app.settings.data.view.gridStroke = val;
    window.app.settings.save();
  };
  
  function initPreferences() {
    SELF.settings = new lsdb('pixelcaso-settings', {
      root: {
        isAwake: false,
        view: {
          showGrid: true,
          showGridPixel: false,
          gridSize: 2,
          gridStroke: 'black',
          gridStrokeWidth: 0.3,
        },
        windows: {
          // palette: true,
          // timeline: true,
          // reference: true,
          // preview: false,
          palette: {
            isShown: true,
          },
          timeline: {
            isShown: true,
          },
          reference: {
            isShown: false,
            x: 50,
            y: 50,
            width: 300,
            height: 300
          },
          preview: {
            isShown: false,
            x: 100,
            y: 100,
            width: 300,
            height: 300
          },
        },
      },
    });
    
    SELF.preferences = new lsdb('pixelcaso-preferences', {
      root: {
        mirror: 'none',
      },
    });
  }
  
  SELF.toggleRepeat = function() {
    SELF.preferences.data.mirror = (SELF.preferences.data.mirror == 'x') ? 'none' : 'x';
    SELF.drawing.redraw();
  };
  
  SELF.registerComponent = function(name, component) {
    if (SELF[name] === null) {
      SELF[name] = component;
    } else {
      console.log('Component '+name+' already registered or has not yet been defined.');
    }
  };
  
  SELF.changeComponent = function(name, component) {
    SELF[name] = component;
  };
  
  const requestWakeLock = async function() {
    try {
      SELF.wakeLock = await navigator.wakeLock.request('screen');
      SELF.wakeLock.addEventListener('release', () => {
        $('[data-callback="toggle-awake"]')[0].classList.remove('active');
      });
      $('[data-callback="toggle-awake"]')[0].classList.add('active');
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
    }
  };
 
  const handleVisibilityChange = () => {
    if (SELF.wakeLock !== null && document.visibilityState === 'visible') {
      requestWakeLock();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  SELF.toggleAwake = async function() {
    if (SELF.wakeLock === null) {
      await requestWakeLock();
    } else {
      SELF.wakeLock.release();
      SELF.wakeLock = null;
    }
  };
  
  SELF.newProject = function() {
    SELF.openedFileId = null;
    SELF.setOpenedFileHandle(null);
    animator.reset();
    app.drawing.frame.reset();
    app.clipboard.reset();
    app.layer.reset();
    window.app.drawing.setTempScale(null);
    ui.resetZoom();
    app.drawing.resizeCanvas(32, 32, false);
    app.drawing.centerCanvas(scale);
    pressedKeys.altKey = false;
    pressedKeys.ctrlKey = false;
    pressedKeys.shiftKey = false;
    app.undoManager.reset();
    app.drawing.tools.reset();
    app.drawing.redraw();
  };
  
  let openedFileHandle = null;
  
  SELF.hasOpenedFileHandle = function() {
    return (openedFileHandle !== null);
  };
  
  SELF.getActiveFileHandle = function() {
    return openedFileHandle;
  };
  
  SELF.setOpenedFileHandle = function(fileHandle) {
    openedFileHandle = fileHandle;
  };
  
  SELF.openProjectFromPopup = async function(event) {
    return SELF.openProject(event.target.files[0]); 
  };
  
  SELF.openProject = function(file) {
    return new Promise(resolve => {
      SELF.newProject();
      app.openedFileName = file.name;
      let r = new FileReader();
      r.onload = async function() {
        let data = JSON.parse(r.result);
        let layers = data.layers;
        for (let i=0; i<layers.length; i++) {
          if (typeof(layers[i].alpha == 'undefined'))
            layers[i].alpha = 1;
          for (let j=0; j<layers[i].frames.length; j++) {
            if (layers[i].frames[j]) {
              layers[i].frames[j] = await app.drawing.dataURLToCanvas(layers[i].frames[j]);
              layers[i].frames[j].canvas.dataset.state = 1; // 1 = original, 2 = tainted
              data.frameWidth = layers[i].frames[j].canvas.width;
              data.frameHeight = layers[i].frames[j].canvas.height;
            }
          }
        }

        SELF.layer.layers = data.layers;
        app.drawing.resizeCanvas(data.frameWidth, data.frameHeight);
        ui.resetZoom();
        app.drawing.centerCanvas(scale);
        app.drawing.redraw();
        app.drawing.frame.setFrameLength(data.frameLength);
        app.layer.list();
        
        // close mobile screen landing page
        // $('[data-callback="mobile.start-drawing"]')[0].click();
        resolve();
      };
      r.readAsText(file);
    });
  };
  
  SELF.openProjectIDB = function(projectBlob, thumbnailBlob, fileName, fileId, activeLayerId) {
    
    return new Promise(resolve => {
    
      SELF.newProject();
      app.openedFileName = fileName;
      app.openedFileId = fileId;
      let r = new FileReader();
      r.onload = async function() {
        let data = JSON.parse(r.result);
        let layers = data.layers;
        for (let i=0; i<layers.length; i++) {
          if (typeof(layers[i].alpha == 'undefined'))
            layers[i].alpha = 1;
          for (let j=0; j<layers[i].frames.length; j++) {
            if (layers[i].frames[j]) {
              layers[i].frames[j] = await app.drawing.dataURLToCanvas(layers[i].frames[j]);
              layers[i].frames[j].canvas.dataset.state = 1; // 1 = original, 2 = tainted
              data.frameWidth = layers[i].frames[j].canvas.width;
              data.frameHeight = layers[i].frames[j].canvas.height;
            }
          }
        }

        SELF.layer.layers = data.layers;
        app.drawing.resizeCanvas(data.frameWidth, data.frameHeight);
        ui.resetZoom();
        app.drawing.centerCanvas(scale);
        app.drawing.redraw();
        app.drawing.frame.setFrameLength(data.frameLength);
        app.layer.list();
        if (typeof activeLayerId != 'undefined') {
          app.layer.change(activeLayerId);
          ui.layer.highlightFrame(0, activeLayerId);
        }
        
        //$('[data-callback="mobile.start-drawing"]')[0].click();
      };
      r.readAsText(projectBlob);
    
    });
    
  };
  
  SELF.exportProject = function() {
    let data = {
      frameLength: app.drawing.frame.frameLength,
      frameWidth: app.drawing.frame.width,
      frameHeight: app.drawing.frame.height,
    };
    let layers = JSON.parse(JSON.stringify(SELF.layer.layers));
    for (let i=0; i<layers.length; i++) {
      for (let j=0; j<layers[i].frames.length; j++) {
        if (SELF.layer.layers[i].frames[j]) {
          layers[i].frames[j] = SELF.layer.layers[i].frames[j].canvas.toDataURL();
        }
      }
    }
    data.layers = layers;
    return JSON.stringify(data);
  };
  
  SELF.debugCanvas = function(canvas) {
    $('.debug-canvas-container')[0].append(canvas);
  }
  
  return SELF;
}