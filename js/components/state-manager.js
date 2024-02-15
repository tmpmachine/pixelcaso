"use strict";

window.stateManager = (function() {

  // global var
  let $ = window.$;
  let app = window.app;

  // local properties
  const SELF = {
    states: [],
  };
  
	function getState(stateNumber) {
		let state = '';
		switch (stateNumber) {
			case 0: state = 'modal-window'; break;
		}
		return state;
	}

	SELF.pushState = function(_states) {
		for (let state of _states) {
			state = getState(state);
			let index = SELF.states.indexOf(state);
			if (index < 0)
				SELF.states.push(state);	
		}
	};

	SELF.popState = function(_states) {
		for (let state of _states) {
			state = getState(state);
			let index = SELF.states.indexOf(state);
			if (index >= 0)
				SELF.states.splice(index,1);
		}
	};

	function hasState(_states, isOnlyState = false) {
		if (isOnlyState && (_states.length != SELF.states.length))
			return false;

		for (let state of _states) {
			state = getState(state);
			let index = SELF.states.indexOf(state);
			if (index < 0)
				return false;
		}
		return true;
	}

	SELF.isState = function(stateId) {
		let result = false;
		switch (stateId) {
			case 0:
				result = hasState([1], true);
			break;
			case 1:
				result = hasState([0]);
			break;
		}
		return result;
	}

  return SELF;
  
})();