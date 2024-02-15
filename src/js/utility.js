window.utility = (function() {
  
  let SELF = {};
  
  SELF.attachClickable = function(nodes, callback) {
    for (let element of nodes) {
      element.addEventListener('click', getCallback(callback, element.dataset.callback.split('.')));
    }
  }
  
  SELF.attachSubmittable = function(nodes, callback) {
    for (let element of nodes) {
      element.addEventListener('submit', callback[element.dataset.callback]);
    }
  }
  
  function getCallback(cb, keys) {
    if (keys.length > 0) {
      let key = keys.shift();
      if (typeof(cb[key]) == 'undefined')
        return null;
      return getCallback(cb[key], keys);
    } else {
      return cb;
    }
  }
  
  return SELF;
  
})();