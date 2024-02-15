  let data = [];
function EditorClipboard() {
  
  let isUseCachedCopy = false;
  let mode = '';
  let isListenHistoryChange = false;
  let historyOffset = 0;

  function listenHistoryChange() {
    isListenHistoryChange = true;
    isUseCachedCopy = false;
  }
  
  function reset() {
      isUseCachedCopy = false;
    mode = '';
    isListenHistoryChange = false;
    historyOffset = 0;
  }
  
  function setMode(_mode) {
    if (['cut', 'copy'].includes(_mode)) {
      mode = _mode;
    }
  }
  
  function disableCache() {
    isUseCachedCopy = false;
  }
  
  function get(index) {
    return data[index];
  }
  
  function store() {
    if (isUseCachedCopy) {
      return data.length-1;
    }
      
    let clipboard = app.drawing.frame.getClipboard();
    let c = app.drawing.frame.createDrawingContext(clipboard.width, clipboard.height);
    c.drawImage(clipboard, 0, 0);
    data.push(c.canvas);
    isUseCachedCopy = true;
    return data.length-1;
  }
  
  function unlistenHistoryChange() {
    isListenHistoryChange = false;
  }
  
  function addHistoryOffset(increment) {
    if (isListenHistoryChange)
      historyOffset += increment;
  }
  
  let self = {
    get,
    store,
    reset,
    listenHistoryChange,
    unlistenHistoryChange,
    addHistoryOffset,
    setMode,
    disableCache,
  };
  
  Object.defineProperty(self, 'historyOffset', {  get: () => historyOffset });
  Object.defineProperty(self, 'data', {  get: () => data });
  Object.defineProperty(self, 'mode', {  get: () => mode });
  
  return self;
}