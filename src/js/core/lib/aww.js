/*
0.054 : 2 dec -- fix aww element initialization, fix pop out animation
0.053 : 28 -- fix notification blocking 
0.052 : 7 -- fix notification blocking
0.051 - 6 sep 19 - change font size to rem
0.05 - 5 sep 19 - zero height / non blocking notification element
0.041 - 31 July 2019 - pop element now have id
0.04 - 30 July 2019 - encapsulation
0.032 - 13 july 19 - change document body offsetWidth > clientWidth
0.031 - 32 june 19 - replaced screen var
0.030 - 4 apr 19 - fix persistent
0.029 - 18 sep 18 - remove prompt
0.028 - 13 sep 18 - o.js change
0.027 - 19 july 18
0.026 - 15 june 18
*/

(function () {
  
  let messageQueue = [];
  
  function Aww() {
    
    let popElement = document.createElement('div');
    
    function initPopElement() {
      popElement.setAttribute('style','height:0;overflow:hidden;position:fixed;top:0;z-index:1000;width:100%;text-align:center;');
      popElement.innerHTML = "<div style='-webkit-transform:translateY(-150%);transform:translateY(-150%);-webkit-transition:-webkit-transform 500ms;transition:transform 500ms;margin-top:4px;box-shadow: 0 0px 10px 0 rgba(0,0,0,0.2), 0 0px 5px 0 rgba(0,0,0,0.19);background:white;border-radius:2px;display:inline-block;padding:4px 8px;font-family:sans-serif;font-size:0.8rem;color:#000!important;'>&nbps;</div>";
      document.body.appendChild(popElement);
      
      window.onresize = function() {
        popElement.style.left = (document.body.clientWidth - popElement.offsetWidth) / 2 + 'px';
      };
    }
    
    initPopElement();
    
    this.pop = function (content, isPersistence = false, timeout = 2000) {
      
      if (popElement.parentNode === null)
        initPopElement();
        
      popElement.firstElementChild.innerHTML = content;
      popElement.style.left = (document.body.clientWidth - popElement.offsetWidth) / 2 + 'px';
      popElement.firstElementChild.style.webkitTransform = 'translateY(0px)';
      popElement.firstElementChild.style.transform = 'translateY(0px)';
      popElement.style.overflow = 'visible';
      
      clearTimeout(this.hide);
      this.hide = setTimeout(function() {
        popElement.firstElementChild.style.webkitTransform = 'translateY(-150%)';
        popElement.firstElementChild.style.transform = 'translateY(-150%)';
        setTimeout(function() {
          popElement.style.overflow = 'hidden';
        }, 250);
      }, timeout);
      
      if (isPersistence)
        clearTimeout(this.hide);
    };
  }
  
  if (window.aww === undefined)
    window.aww = new Aww();
  else
    console.error('aww.js:', 'Failed to initialize. Duplicate variable exists.');
})();