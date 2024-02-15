function Timeline() {
  
  let wrapper = $('#timeline');
  
  function list() {
    
    wrapper.innerHTML = '';
    for (let frame of app.drawing.frame.frames) {
      
      wrapper.append(frame.layers[0].c.canvas);
    }
    
  }
    
  let self = {
    list
  };
  
  return self;
}