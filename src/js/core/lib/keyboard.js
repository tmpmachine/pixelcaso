/*
  v0.035x.1 -- 20 Dec 2021 -- pass shortcut param isBlocked
  v0.035 -- 11 Nov 2020 -- add isBlocked method
  v0.034 -- 31 July 2020 -- fix false self reference to keytrapper object
  v0.033 -- 26 July 2020 -- fix null undefined keyboard reference
  v0.0322 -- remove unnecessary comments
  v0.0321 -- store alt, control, shift state on keyboard object
  v0.032 -- store shift, control, alt pressed state
  v0.031 -- 7 -- include all alphabet
  v0.03 -- 5 -- detect shift for double keys (example: . and >)
  v0.0213 -- 1 April, fix false shortcut
  v0.0212 -- 29 + shortcut
  v0.0211 -- 27 march more shortcut, keylogger will log keyCode
  v0.021 -- more shortcut
  v0.02 - 26 march -- added keylogger
  v0.01 - 10 jan 2020
*/

(function () {
  
  let keyboardShortcut = [];
    
  let alfa = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  let keys = ['[',']','}','{','-','+',',','.','<','>','Escape','Delete','Enter','Backspace','Right','Left','Up','Down','Space'];
  let keyCode = [219,221,221,219,189,187,188,190,188,190,27,46,13,8,39,37,38,40,32];
  for (let char of alfa) {
    keys.push(char);
    keyCode.push(char.charCodeAt(0));
  }
  
  const KeyTrapper = function() {
    let self = {
      keylogger: false,
      Alt: false,
      Shift: false,
      Control: false,
      isBlocked: function() { return false },
      listen: function (shortcut, eventType = 'keydown', isPreventDefault = false) {
        initKeyboardShortcut(shortcut, eventType, isPreventDefault);
      },
      isPressed: function(keyCode) {
        return keyboard[keyCode];
      }
    };
    
    window.addEventListener('keydown', (event) => keyHandle(event, self));
    window.addEventListener('keyup', (event) => keyHandle(event, self));
    window.addEventListener('blur', (event) => keyHandle(event, self));
    
    return self;
  };
  
  function callback(eventType, e, self) {
    for (let shortcut of keyboardShortcut) {
      if (shortcut && shortcut.keyCode == e.keyCode && shortcut.Alt == self.Alt && shortcut.Control == self.Control && shortcut.Shift == self.Shift) {
        if (shortcut.isPreventDefault)
          e.preventDefault();
        if (shortcut.eventType == eventType && shortcut.callback) {
          if (!self.isBlocked(shortcut, e)) {
            shortcut.callback(e);
          }
        }
        break;
      }
    }
  }
  
  function keyUpHandler(e, self) {
    if ([16,17,18].includes(e.keyCode))
  	  self[e.key] = false;
  	else
  	  self[e.keyCode] = false;
    callback('keyup', e, self);
  }
  
  function keyDownHandler(e, self) {
    if (self.keylogger)
      console.log(e.keyCode, e);
	  if ([16,17,18].includes(e.keyCode))
  	  self[e.key] = true;
  	else
  	  self[e.keyCode] = true;
    callback('keydown', e, self);
  }
  
  function keyCodeOf(key) {
    return keyCode[keys.indexOf(key)];
  }
  
  function initKeyboardShortcut(shortcuts, eventType, isPreventDefault) {
    for (let i in shortcuts) {

      let shortcut = {
        eventType,
        Alt: i.includes('Alt+'),
        Control: i.includes('Ctrl+'),
        Shift: i.includes('Shift+'),
        callback: null,
      };

      shortcut.key = i;
      shortcut.keyCode = keyCodeOf(i.replace(/Alt\+|Ctrl\+|Shift\+/g,''));
      shortcut.callback = shortcuts[i];
      if ('<>{}'.includes(i))
        shortcut.Shift = true;
      shortcut.isPreventDefault = isPreventDefault;
      
      keyboardShortcut.push(shortcut);
    }
  }
  
  function keyHandle(event, self) {
  	if (event.type == 'blur') {
  	  self.Shift = false;
  	  self.Control = false;
  	  self.Alt = false;
  	} else if (event.type == 'keyup') {
  	  keyUpHandler(event, self);
  	} else if (event.type == 'keydown') {
  	  keyDownHandler(event, self);
  	}
  }
  
  if (window.KeyTrapper === undefined)
    window.KeyTrapper = KeyTrapper;
  else
    console.error('keyboard.js:', 'Failed to initialize. Duplicate variable exists.');
})();