window.fileSave = (function () {
  
  // IndexedDB
  var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB,
      IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction,
      dbVersion = 7;
      
  let _dbName = 'pixelcasodb';
  let _objStoreName = 'projects';

  let SELF = {
    create: createProjectFile,
    save: saveProjectFile,
    // load: loadProjectFromIDB,
    deleteProject: deleteProject,
  };

  function saveProjectFile(project) {
    
    return new Promise(resolve => {
      
      var transaction = db.transaction([_objStoreName], "readwrite");
      let ob = {
        title: project.title,
        created: new Date(),
        thumbnailBlob: project.thumbnailBlob,
        projectBlob: project.blob,
      };
      var request = transaction.objectStore(_objStoreName).add(ob);
      request.onsuccess = function(event) {
        resolve(event.target.result);
      };
      
    });
  }
  
  
  function deleteProject(projectId) {
    
    return new Promise(resolve => {
      let request = db.transaction(_objStoreName, 'readwrite')
                        .objectStore(_objStoreName)
                        .delete(projectId);
  
      request.onsuccess = ()=> {
        resolve();
      };
  
      // request.onerror = (err)=> {
          // console.error(`Error to delete student: ${err}`)
      // }
    });
  }
  
  SELF.putProjectFile = function(blob, thumbnailBlob, projectId) {
    var transaction = db.transaction([_objStoreName], "readwrite");
    let ob = {
      id: projectId,
      title: 'Untitled project',
      created: new Date(),
      thumbnailBlob: thumbnailBlob,
      projectBlob: blob,
      activeLayerId: window.app.layer.activeLayerId
    };
      
    var put = transaction.objectStore(_objStoreName).put(ob);
  };


    // Create/open database
    let request = indexedDB.open(_dbName, dbVersion);
    let db;
    
    function createObjectStore(dataBase) {
        // Create an objectStore
        // console.log("Creating objectStore")
        dataBase.createObjectStore(_objStoreName);
    }

    request.onerror = function (event) {
        console.log("Error creating/accessing IndexedDB database");
    };

    request.onsuccess = function (event) {
        // console.log("Success creating/accessing IndexedDB database");
        db = request.result;

        db.onerror = function (event) {
            // console.log("Error creating/accessing IndexedDB database");
        };
        
        // Interim solution for Google Chrome to create an objectStore. Will be deprecated
        if (db.setVersion) {
            if (db.version != dbVersion) {
                var setVersion = db.setVersion(dbVersion);
                setVersion.onsuccess = function () {
                    createObjectStore(db);
                    // getImageFile();
                };
            }
            else {
                // getImageFile();
            }
        }
        else {
            // getImageFile();
        }
    };
    
    request.onupgradeneeded = function (e) {
      let db = e.target.result;
      // db.deleteObjectStore(_objStoreName);
      db.createObjectStore(_objStoreName, {keyPath:'id', autoIncrement: true});
    };
    
  function loadProjectFromIDB(id) {
    return new Promise(resolve => {
    	let trans = db.transaction([_objStoreName], 'readonly');
    	let req = trans.objectStore(_objStoreName).get(id);
    	req.onsuccess = function(e) {
    		let record = e.target.result;
    		resolve(record);
    	};
    });
  }
  
  SELF.listProjectFiles = function(elListProject) {
    const transaction = db.transaction([_objStoreName], "readonly");
    const objectStore = transaction.objectStore(_objStoreName);
  
    if (elListProject === undefined) {
      elListProject = $I('.file-save-container');
    }
    let container = document.createDocumentFragment();

    objectStore.openCursor().onsuccess = function(event) {
      const cursor = event.target.result;
      if(cursor) {
        let item = cursor.value;
        
        let thumbEl = elListProject.qf('#project-thumb-' + item.id);
        if (thumbEl) {
          refreshThumb(thumbEl, item);
        } else {
          appendThumb(container, item);
        }
        
        cursor.continue();
      } else {
        elListProject.append(container);
      }
      
    };
  };
  
  function refreshThumb(thumbEl, item) {
    thumbEl.src = URL.createObjectURL(item.thumbnailBlob);
  }
  
  function appendThumb(container, item) {
    let tmp = window.template.clone('#tmp-file-thumb');
    tmp.getChild('.filename')[0].textContent = item.title;
    let thumbEl = document.createElement('img');
    thumbEl.src = URL.createObjectURL(item.thumbnailBlob);
    thumbEl.setAttribute('id', 'project-thumb-' + item.id);
    tmp.getChild('.thumbnail')[0].append(thumbEl);
    tmp.getChild('.thumbnail')[0].dataset.id = item.id;
    // tmp.getChild('.thumbnail')[0].addEventListener('click', openIDBFile);
    tmp.getChild('.__remove-btn')[0].dataset.id = item.id;
    // tmp.getChild('.__remove-btn')[0].addEventListener('click', ui.confirmDeleteProject);
    if (container.firstElementChild) {
      container.insertBefore(tmp, container.firstElementChild);
    } else {
      container.append(tmp);
    }
  }
  
  SELF.openProject = function(id) {
    if (typeof id !== 'number') throw 0;
    loadProjectFromIDB(Number(id)).then(item => {
      let title = (item.title === undefined) ? 'Untitled project' : item.title;
      window.app.openProjectIDB(item.projectBlob, item.thumbnailBlob, title, item.id, item.activeLayerId);
    });
  };
  
  function createProjectFile(project) {
    SELF.save(project).then(projectId => {

      SELF.load(projectId).then(item => {
        let title = (item.title === undefined) ? 'Untitled project' : item.title;
        app.openProjectIDB(item.projectBlob, item.thumbnailBlob, title, item.id);
      });

    });
  }
  
  SELF.saveToFileHandle = async function(fileContent) {
    let fileHandle = window.app.getActiveFileHandle();
    if (fileHandle === null) {
      return;
    }
    let writable = await fileHandle.createWritable();
    await writable.write(fileContent);
    await writable.close();
  };
    
  return SELF;
})();