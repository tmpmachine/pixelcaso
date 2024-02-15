let compoToolbar = (function() {
  
  let SELF = {
    SetActive,
    GetActive,
  };
  
  let local = {
    activeToolName: 'pencil',
  };
  
  function SetActive(toolName) {
    local.activeToolName = toolName;
  }
  
  function GetActive() {
    return local.activeToolName;
  }
  
  
  return SELF;
  
})();