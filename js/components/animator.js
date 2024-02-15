"use strict";

window.animator = new Animator();

function Animator() {
  
  let SELF = {
    scale: 1,
  };
  
  let canvas = $('canvas#animator')[0];
  canvas.width = 300;
  canvas.height = 300;
  let c = canvas.getContext('2d');
  c.imageSmoothingEnabled = false;
  let animationFrame = 0;
  let spritesheet = document.createElement('canvas'); // blank canvas
  let sc = spritesheet.getContext('2d');
  let animationLength = 1;
  let frameNow = 0;
  let fps = 12;
  let self = {
    animationFrame: null,
    isPlayed: false,
    isLastStatePlayed: false,
    DOM: {
      frameLabel: null,
    }
  };
  
  this.initPreviewModal = function() {
    $('.lightbox[data-name="animation"]')[0].addEventListener('onclose', function() {
      stopAnimation();
    });
  };
  
  function stopAnimation() {
    animationFrame = 0;
    draw();
    window.cancelAnimationFrame(self.animationFrame);
    self.isPlayed = false;
  }
  
  this.getLastState = function() {
    return self.isLastStatePlayed;
  }
  
  this.setLastState = function(state) {
    self.isLastStatePlayed = state;
  }
  
  this.play = function() {
    self.isPlayed = true;
    fpsInterval = 1000 / fps;
    then = Date.now();
    startTime = then;
    getSpritesheet();
    animate();
    self.DOM.frameLabel = $('[label-frame]')[0];
  };
  
  let frameUpdateTimeout = null;
  
  this.onframeupdate = function(frameIndex) {
    if (!app.settings.data.windows.preview.isShown)
      return;
    window.clearTimeout(frameUpdateTimeout);
    updateFrame.frameIndex = frameIndex;
    frameUpdateTimeout = window.setTimeout(updateFrame, 1000);
  };
  
  function updateFrame() {
    asd(1)
    updateSpritesheetFrame(updateFrame.frameIndex);
    if (!self.isPlayed) {
      draw();
    }
  }
  
  this.reset = function() {
    this.pause();
    canvas.width = canvas.width;
    SELF.scale = 1
    c.imageSmoothingEnabled = false;
    animationFrame = 0;
    spritesheet = document.createElement('canvas'); // blank canvas
    sc = spritesheet.getContext('2d');
    animationLength = 1;
    frameNow = 0;
    fps = 12;
    ui.DOM.animation.fps.value = 12;
    self.animationFrame = null;
    self.isPlayed = false;
    self.isLastStatePlayed = false;
  }
  
  this.onframelengthupdated = function() {
    getSpritesheet()
  }
  
  this.pause = function() {
    if (self.isPlayed) {
      self.isLastStatePlayed = true;
    }
    stopAnimation();
  }
  
  function getSpritesheet() {
    let config = {
      width: app.drawing.frame.width,
      height: app.drawing.frame.height,
      frame: 'spritesheet',
    };
    
    animationFrame = 0;
    animationLength = app.drawing.frame.frameLength;
    spritesheet = app.drawing.frame.generateExportCanvas(config);
    sc = spritesheet.getContext('2d');
    // c.fillStyle = 'white';
    // c.fillRect(0,0,canvas.width,canvas.height);
    c.drawImage(spritesheet, app.drawing.frame.width*animationFrame, 0);
  }
  
  function updateSpritesheetFrame(frameIndex) {
    let config = {
      width: app.drawing.frame.width,
      height: app.drawing.frame.height,
      frame: 'single-frame',
    };
    let frameCanvas = app.drawing.frame.generateExportCanvas(config);
    // spritesheet = app.drawing.frame.generateExportCanvas(config);
    sc.clearRect(app.drawing.frame.width*frameIndex, 0, app.drawing.frame.width, app.drawing.frame.height)
    sc.drawImage(frameCanvas, app.drawing.frame.width*frameIndex, 0);
  }
  
  var stop = false;
  var frameCount = 0;
  var $results = $("#results");
  var fpsInterval, startTime, now, then, elapsed;
  
  this.setFPS = function(_fps) {
    _fps = parseInt(_fps);
    if (_fps > 0 && _fps <= 120) {
      fps = _fps;
      fpsInterval = 1000 / fps;
    }
  }
  
  function animate() {
    now = Date.now();
    elapsed = now - then;
    if (elapsed > fpsInterval) {
      then = now - (elapsed % fpsInterval);
      draw();
      animationFrame++;
      if (animationFrame == animationLength)
        animationFrame = 0;
      updateFrameLabel();
    }
    
    self.animationFrame = window.requestAnimationFrame(animate);
  }
  
  function updateFrameLabel() {
    self.DOM.frameLabel.textContent = animationFrame + 1;
  }
  
  SELF.draw = draw;
  function draw() {
    c.fillStyle = 'white';
    c.fillRect(0,0,canvas.width,canvas.height);
    let w = app.drawing.frame.width;
    let h = app.drawing.frame.height;
    c.drawImage(spritesheet, w*animationFrame, 0, w, w, 0,0, w*SELF.scale,w*SELF.scale);
  }
  
  function exportSpritesheet(canvas, config) {
    canvas.width = parseInt(config.width) * frames.length;
        let c = canvas.getContext('2d');
        canvas.height = config.height;
        c.imageSmoothingEnabled = false;
        for (let i=0; i<frames.length; i++) {
          c.drawImage(app.drawing.frame.exportCanvas(i), 0, 0, app.drawing.frame.width, app.drawing.frame.height, i*config.width, 0, config.width, config.height);
        }
        return canvas;
  }
  
  this.scale = function(userScale) {
    SELF.scale += userScale;
    if (!self.isPlayed) {
      canvas.width = canvas.parentNode.offsetWidth;
      canvas.height = canvas.parentNode.offsetHeight;
      c.imageSmoothingEnabled = false;
      draw();
    }
  };
  
  this.exportVideo = function(event) {
    event.preventDefault();
    let form = event.target;

    let config = {
      width: window.app.drawing.frame.width,
      height: window.app.drawing.frame.height,
      frame: 'spritesheet',
    };
    
    let canvas = document.createElement('canvas');
    canvas.width = parseInt(form.width.value);
    canvas.height = parseInt(form.height.value);
    let c = canvas.getContext('2d');
    c.imageSmoothingEnabled = false;
    let loop = 1;
    
    let animationFrame = 0;
    let animationLength = window.app.drawing.frame.frameLength;
    let spritesheet = window.app.drawing.frame.generateExportCanvas(config);
    let frameNow = 0;
    let fps = parseInt(form.fps.value);
    let loopMax = parseInt(form.loop.value);
    let progressIndicator = $('progress', form)[0];
    let maxProgress = animationLength * loopMax;
    let progress = 0;
    let then = Date.now();
    let fpsInterval = 1000 / fps;

    function recordAnimation() {
      c.fillStyle = 'white';
      c.fillRect(0,0,canvas.width,canvas.height);
      let w = app.drawing.frame.width;
      let h = app.drawing.frame.height;
      c.drawImage(spritesheet, w*animationFrame, 0, config.width, config.height, 0, 0, canvas.width, canvas.height);
    	capturer.capture(canvas);
      progressIndicator.value = Math.floor(progress / maxProgress *100);
      
      let now = Date.now();
      let elapsed = now - then;
      if (elapsed > fpsInterval) {
        then = now - (elapsed % fpsInterval);
        animationFrame++;
        if (animationFrame == animationLength) {
          animationFrame = 0;
          loop++;
          if (loop > loopMax) {
            progressIndicator.value = 100;
            capturer.stop();
            capturer.save();
            return
          }
        }
        progress++;
      } 
      window.requestAnimationFrame(recordAnimation);
    }
    
    window.capturer = new CCapture( { format: 'webm' } );
    capturer.start();
    recordAnimation();
  };
  
}