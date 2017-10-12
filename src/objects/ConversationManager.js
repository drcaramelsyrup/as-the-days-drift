/*
 * ConversationManager
 * ===================
 *
 * Handles loading JSON assets for conversation and managing conversation state
 */

import npcs from '../../static/assets/conversations/npcs.json';

// TODO: We should be able to inherit from this class to create
// our own parsing symbols and grammar

export default class ConversationManager {
  constructor(game, customActions/*, ...args*/) {
    // PROPERTIES:
    // - conversation - json conversation

    this._game = game;
    this.customActions = customActions;

    this._conversation = null;
    this._idx = 0;
    this.shown = [];
  }

  /* Assumes JSON has already been loaded into cache!
   * Use game.load.json otherwise
   */
  loadJSONConversation(jsonKey) {
    const json = this._game.cache.getJSON(jsonKey);

    this._conversation = json;
    this._idx = 0;
    // the player object may want to initialize the start index of a conversation
  }

  getCurrentText() {
    if (this._conversation === null) {
      return '';
    }

    return this._conversation[this._idx]['text'];
  }

  getResponses() {
    if (!this._conversation === null) {
      return [''];
    }
    const responses = this._conversation[this._idx]['responses'];
    const ret = [];
    for (let i = 0; i < responses.length; i++) {
      //check showOnce of target node
      if (this.shown.indexOf(responses[i]['target']) > -1) {    // this node is marked "show once" and has already been shown
        continue;
      }
      //check conditions on response
      if ('conditions' in responses[i]) {
        let conditionsNeeded = 0;
        let conditionsMet = 0;
        for (const condition in responses[i]['conditions']) {
          if (this.checkCondition(this._game, condition, responses[i]['conditions'][condition])) {
            conditionsMet++;
          }
          conditionsNeeded++;
        }
        if (conditionsMet >= conditionsNeeded) {
          ret.push(responses[i]); //if all conditions are met, display response
        }
      } else {
        ret.push(responses[i]);   //no conditions on this response, display it
      }
    }

    return ret;
  }

  checkCondition(game, condition, value) {
    if (condition.startsWith('var')) {
      const variable = condition.substring(3);
      if (value.startsWith('!')) {
        if (!(variable in game.player.variables) || game.player.variables[variable] !== value.substring(1)) {
          return true;    //player does not have this variable set, or has it set to a different value
        }
      } else if (variable in game.player.variables && game.player.variables[variable] === value) {
        return true;      //player has this variable set to this value
      }
    } else if (condition.startsWith('inv')) {
      const item = condition.substring(3);
      if (value.startsWith('!')) {
        if (game.player.inventory.indexOf(item) === -1) {
          return true;    //player does not have this inventory item
        }
      } else if (game.player.inventory.indexOf(item) > -1) {
        return true;      //player has this inventory item
      }
    } else if (condition.startsWith('seen')) {
      const visited = value.split(' ');
      let visitedAll = true;
      for (let i = 0; i < visited.length; i++) {
        if (this.shown.indexOf(parseInt(visited[i])) === -1) {
          visitedAll = false;
        }
      }
      return visitedAll;
    }
    return false;
  }

  getSpeaker() {
    if (this._conversation === null) {
      return [''];
    }

    return npcs[this._conversation[this._idx]['speaker']]['name'];
  }

  getAvatar() {
    if (this._conversation === null) {
      return [''];
    }

    return npcs[this._conversation[this._idx]['speaker']]['avatar'];
  }

  getActions() {
    return this._conversation[this._idx]['actions'];
  }

  takeActions() {
    if (this._conversation === null) {
      return;
    }

    if (this._conversation[this._idx]['showOnce'] === 1 && !this.shown.includes(this._idx)) {
      //if save at this point keeps getting resaved.
      this.shown.push(this._idx);
    }

    if (this._conversation[this._idx]['actions'].length === 0) {
      return;
    }

    for (const action in this._conversation[this._idx]['actions']) {
      this.takeAction(this._game, action, this._conversation[this._idx]['actions'][action]);
    }
    return;
  }

  takeAction(game, action, value) {
    if (action.startsWith('var')) {
      const variable = action.substring(3);
      if (value.startsWith('!')) {
        delete game.player.variables[variable]; //remove variable from
      } else {
        game.player.variables[variable] = value;  //set variable on player
      }
    } else if (action.startsWith('inv')) {
      const item = action.substring(3);
      if (value.startsWith('!')) {
        if (!(item in game.player.inventory)) {
          const index = game.player.inventory.indexOf(item);
          if (index > -1) {
            game.player.inventory.splice(index, 1); //remove item from player inventory
          }
        }
      } else {
        game.player.inventory.push(item); //add item to player inventory
      }
    } else if (action === 'custom') {
      this.customActions.customAction(value);
    }
  }

  endConversation() {
    if (this._conversation === null) {
      return;
    }

    for (let i = 0; i < this._game.room.npcs.length; i++) {
      const npc = this._game.room.npcs[i];
      npc.show();
    }
      
    if ('onEnd' in this._conversation) {
      this.customActions.customAction(this._conversation['onEnd']);
    }

    this.shown = [];
    this._idx = 0;
    //think this is a cyclic ref. TODO: fix 
    this._game.dialogueWindow.convoFile = null;
    this._game.areaTransitionWindow.enable();
  }

  advanceToTarget(targetIdx) {
    this._idx = targetIdx;
    return true;  // returns whether should refresh display.
  }

}
