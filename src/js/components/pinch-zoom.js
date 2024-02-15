"use strict";

(function(argument) {

  var evCache = [];
  var prevDiff = -1;
  let targetScale = scaleValues[scaleIndex];

  function init() {
   var el=document.getElementById("canvas");
   el.onpointerdown = pointerdown_handler;
   el.onpointermove = pointermove_handler;
   el.onpointerup = pointerup_handler;
   el.onpointercancel = pointerup_handler;
   el.onpointerout = pointerup_handler;
   el.onpointerleave = pointerup_handler;
  }
  
  function pointerdown_handler(ev) {
   evCache.push(ev);
  }
  
  function pointermove_handler(ev) {
    for (var i = 0; i < evCache.length; i++) {
      if (ev.pointerId == evCache[i].pointerId) {
        evCache[i] = ev;
        break;
      }
    }
  
   if (evCache.length == 2) {
     var curDiff = Math.hypot(evCache[0].clientX - evCache[1].clientX, evCache[0].clientY - evCache[1].clientY);
     let divider = 70;
     if (prevDiff > 0) {
       if (curDiff > prevDiff) {
         targetScale = targetScale + (curDiff - prevDiff) * 0.2;
         targetScale = Math.min(70, targetScale);
         window.app.drawing.zoom(targetScale);
         scale = targetScale;
         window.app.drawing.redraw();
       } else if (curDiff < prevDiff) {
         targetScale = targetScale + (curDiff - prevDiff) * 0.2;
         targetScale = Math.max(2, targetScale);
         window.app.drawing.zoom(targetScale);
         scale = targetScale;
         window.app.drawing.redraw();
       }
     }
     
     prevDiff = curDiff;
   }
  }
  function remove_event(ev) {
   for (var i = 0; i < evCache.length; i++) {
     if (evCache[i].pointerId == ev.pointerId) {
       evCache.splice(i, 1);
       break;
     }
   }
  }
  
  function pointerup_handler(ev) {
    remove_event(ev);
    if (evCache.length < 2) {
      prevDiff = -1;
    }
  }
  
  init();

})();