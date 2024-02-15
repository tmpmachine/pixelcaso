/*
0.12 : 29 Jul 2021 -- prevent changing subkey value
0.11 : 4 May 2021 -- + store data & delayed save options
0.1 : 24 march 20 -- added data reference for shorter name use
0.091 : 6 sep 19 -- encapsulation
0.09 : 18 mar 19 -- fix reference to root data
0.08 : 19 dec 18 -- fix reference to root data
0.07 : 10 dec 18 -- added data reset feature
0.06 : 4 dec 18 -- fix : saving changes to localStorage not working
0.05 : 3 dec 18 -- migrate to using object prototype to create lsdb object instead of calling init function
0.04 : 24 sep 18 -- added root check validation
0.03 : 19 july 18 -- added null and undefined bypass value
0.02 : 26 june 18 -- added 2nd level object check
0.01
*/

(function () {
  
  const lsdb = function(storageName, rootObject, options = {}) {
    this.root = JSON.parse(JSON.stringify(rootObject));
    this.storageName = storageName;
  	this.data = JSON.parse(getStorageData(this.storageName, null));
    // delete or update storage keys value according to rootObject
  	this.deepCheck(this.data, rootObject.root, true);
  	this.saveResolver = [];
  	this.options = {
  	  isSaveDelayed: false,
  	  isStoreData: true,
  	};
  	for (let key in options) {
  	  if (typeof(this.options[key]) != 'undefined')
  	    this.options[key] = options[key];
  	  else
  	    console.log('lsdb.js:', 'Unkown option name:', key);
  	}
  };
  
  lsdb.prototype.deepCheck = function(data, root, firstDive) {
    
    if (data === null) {
      this.data = JSON.parse(JSON.stringify(this.root.root));
    } else {
      
      for (const i in data) {
       if (root[i] === undefined)
          delete data[i];
      } 
      
      for (const i in root) {
        if (data[i] === undefined)
          data[i] = root[i];
      }
      
      for (const i in data) {
        if (Array.isArray(data[i])) {
          for (let j = 0; j < data[i].length; j++) {
            if (typeof(data[i][j]) === 'object' && !Array.isArray(data[i][j])) {
              if (this.root[i] !== undefined)
                this.deepCheck(data[i][j], this.root[i]);
            }
          }
        } else {
          if (!(data[i] === null || data[i] === undefined) && typeof(data[i]) === 'object' && !Array.isArray(data[i]) && typeof(this.root.root[i]) != 'undefined') {
            if (firstDive) {
              if (Object.keys(this.root.root[i]).length > 0)
                this.deepCheck(data[i], this.root.root[i], false);
            } else {
              if (Object.keys(this.root.root[i]).length > 0)
                this.deepCheck(data[i], root[i], firstDive);
            }
          }
        }
      }
    }
  };
  
  lsdb.prototype.save = function() {
    if (!this.options.isStoreData)
      return;
    if (this.options.isSaveDelayed) {
      return new Promise(resolve => {
        this.saveResolver.push(resolve);
        window.clearTimeout(this.saveTimeout);
        this.saveTimeout = window.setTimeout(this.storeData.bind(this), 50);
      });
    } else {
      this.storeData();
    }
  };
  
  lsdb.prototype.storeData = function() {
    window.localStorage.setItem(this.storageName, JSON.stringify(this.data));
    for (let resolver of this.saveResolver) {
      resolver();
    }
    this.saveResolver.length = 0;
  };
  
  lsdb.prototype.reset = function() {
    if (this.options.isStoreData)
      window.localStorage.removeItem(this.storageName);
    this.data = JSON.parse(JSON.stringify(this.root.root));
  };
  
  lsdb.prototype.new = function(keyName, values) {
    const data = JSON.parse(JSON.stringify(this.root[keyName]));
    for (const i in values)
      data[i] = values[i];
    return data;
  };
  
  lsdb.prototype.saveTimeout = function() {};

  function getStorageData(name, defaultValue) {
  	return (!window.localStorage.getItem(name)) ? defaultValue : window.localStorage.getItem(name);
  }
    
  if (window.lsdb === undefined)
    window.lsdb = lsdb;
  else
    console.error('lsdb.js:', 'Failed to initialize. Duplicate variable exists.');
})();