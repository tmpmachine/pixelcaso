window.appFileReader = (function() {
  
  'use strict';
  
  let SELF = {};
  
  // function getDroppedFile(event) {
  //   event.preventDefault();
  //   let url = event.dataTransfer.getData('url');
  //   if (url) {
  //     openImage(url, true);
  //   } else {
  //     let file = event.dataTransfer.files[0];
  //     let name = file.name.split('.').pop();
  //     if (name === 'pxcaso') {
  //       app.openProject(file);
  //     } else {
  //       openImage(event.dataTransfer);
  //     }
  //   }
  // }
  
	const handlerType = {
		'notSet': -1,
		'default': 0, // all browsers, file only
		'webkitGetAsEntry': 1, // firefox, supports directory
		'getAsFileSystemHandle': 2, // chrome, supports directory
		defaultType: -1,
	};
	
	
  
  SELF.getDroppedFile = function(e) {
    
    let url = event.dataTransfer.getData('url');
    if (url) {
      openImage(url, true);
    } else {
      let file = event.dataTransfer.files[0];
      let name = file.name.split('.').pop();
      if (name === 'pxcaso') {
        // window.app.openProject(file);
        readTransferItems(e.dataTransfer.items);
      } else {
        SELF.openImage(event.dataTransfer);
      }
    }
    
  };
  
  SELF.openImage = function(self, isUrl = false) {
    let url = isUrl ? self : URL.createObjectURL(self.files[0]);
    let img = new Image();
    img.src = url;
    img.onload = () => window.app.drawing.frame.fromImage(img);
  }
  
	
	function getHandlerType() {
	  return handlerType.defaultType;
	}
	
	function setHandlerType(type) {
	  if (handlerType[type] === undefined)
			console.log('HANDLER_TYPE not defined');
		else
			handlerType.defaultType = handlerType[type];
	}
	
	function getFileRef(entry) {
		return new Promise(resolve => {
			if (getHandlerType() == 1)
				entry.file(resolve);
			else if (getHandlerType() == 2)
				entry.getFile().then(resolve);
		});
	}
  
  function getHandler() {
		let handler = getAsDropItems;
		switch (getHandlerType()) {
	  		case 1: handler = getAsEntry; break;
	  		case 2: handler = getAsFileSystemHandle; break;
	  	}
	  	return handler;
	}

  function preventDefault(e) {
  	e.preventDefault();
  }
  
	function readTransferItems(items, dropTarget, isPressedCtrlKey) {
		if (items[0].kind != 'file')
			return;

  	setSupportedFileHandler(items).then(type => {
  		if (type !== undefined) {
			  setHandlerType(type);
  		}
  		let handler = getHandler();
  		let queue;
  		handler(items, openOnEditor, null, queue, null);
		});
	}
	
	function getFileContent(item, parentId, queue, isDataTransferItem = true) {
  	return new Promise(async resolve => {
  		let entry = item;
  		if (isDataTransferItem) {
	  		entry = await item.getAsFileSystemHandle();
  		}
			resolve({
				queue,
				parentId,
				entry,
	 			name: entry.name,
				type: entry.kind,
				isPressedCtrlKey: item.isPressedCtrlKey,
			});	
  	})
	}
	
	function getAsDropItems() {
		aww.pop('No supported file handler at the moment');
	}
	
	function getAsFileSystemHandle(items, callback, parentId, queue, isPressedCtrlKey) {
		for (let item of items) {
			if (item.kind == 'file') {
				item.isPressedCtrlKey = isPressedCtrlKey;
		  		getFileContent(item, parentId, queue).then(callback);
		  	}
		}
	}
	
	
	function setSupportedFileHandler(items) {
		return new Promise(resolve => {
		  if (getHandlerType() === -1) {
		  	checkFileSystemHandleSupport(items[0])
		  	.then(resolve)
		  	.catch(() => {
			  	checkGetAsEntrySupport(items[0])
			  	.then(resolve)
			  	.catch(resolve);
		  	});
		  } else {
		  	resolve();
		  }
		});
	}
  
  function checkFileSystemHandleSupport(item) {
		return new Promise(resolve => {
			if ('getAsFileSystemHandle' in item) {
				resolve('getAsFileSystemHandle');
			} else {
				reject('default');
			}
		});
	}
	
	function checkGetAsEntrySupport(item) {
		return new Promise((resolve, reject) => {

			function resolver() {
		 		resolve('webkitGetAsEntry');
			}

			function errorHandler() {
	    		reject('default');
			}

			if ('webkitGetAsEntry' in item) {
				entry = item.webkitGetAsEntry();
				if (entry.isDirectory) {
				    let directoryReader = entry.createReader();
					directoryReader.readEntries(resolver, errorHandler);
			 	} else {
			 		entry.file(resolver, errorHandler);
				}
			} else {
				errorHandler();
			}
		});
	}
	
	async function openOnEditor(data) {
		let fileRef = await getFileRef(data.entry);
		window.app.setOpenedFileHandle(data.entry);
    window.app.openProject(fileRef);
	}
  
  return SELF;
  
})();