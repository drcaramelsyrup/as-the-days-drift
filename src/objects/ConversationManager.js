/*
 * ConversationManager
 * ===================
 *
 * Handles loading JSON assets for conversation and managing conversation state
 */

// TODO: We should be able to inherit from this class to create
// our own parsing symbols and grammar

export default class ConversationManager {
  constructor(game, customActions/*, ...args*/) {
    // PROPERTIES:
    // - conversation - json conversation

    // TODO: remove all members except for custom actions

    this._game = game;
    this.customActions = customActions;

    this._conversation = null;
    this._idx = 0;
  }

  // TODO: game should load JSON
  /* Assumes JSON has already been loaded into cache!
   * Use game.load.json otherwise
   */
  loadJSONConversation(jsonKey) {
    const json = this._game.cache.getJSON(jsonKey);

    this._conversation = json;
    this._idx = 0;
    return json;
    // the player object may want to initialize the start index of a conversation
  }

  getRawTextForNode(conversation = {}, index = 0) {
    return conversation[index]['text'];
  }

  getTextForNode(conversation = {}, index = 0, variables = {}) {
    const raw = this.getRawTextForNode(conversation, index);
    // '$' character denotes a variable
    return raw.replace(/\$\w+/, (match) => {
      if (match.length > 0 && variables.hasOwnProperty(match.slice(1)))
        return variables[match.slice(1)];
      return match;
    });
  }

  getResponsesForNode(conversation = {}, index = 0) {
    const responses = conversation[index]['responses'];
    return responses.filter((response) => {
      if (!('conditions' in response))
        return true;
      const condStatement = response['conditions'];
      for (const condition in condStatement) {
        const value = condStatement[condition];
        if (!this.checkCondition(this._game, condition, value)) {
          return false;
        }
      }
      return true;
    });
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

  getActions() {
    return this._conversation[this._idx]['actions'];
  }

  takeActions() {
    if (this._conversation === null) {
      return;
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

  getCyclingLinkIds(conversation = {}, index = 0) {
    return Object.keys(conversation[index]['cycles']);
  }

  startCyclingLinkMap(player = {}, conversation = {}, index = 0) {
    const map = {};
    this.getCyclingLinkIds(conversation, index).forEach((id) => {
      map[id] = this.nextValidCycleLinkIndex(player, conversation, index, id);
    });
    return map;
  }

  nextValidCycleLinkIndex(player = {}, conversation = {}, index = 0, id = '', startCycleIdx = -1) {
    const cycles = conversation[index]['cycles'][id];
    for (let i = startCycleIdx + 1; i < cycles.length; i++) {
      if (this.checkCycleCondition(cycles[i], player)) {
        return i;
      }
    }
    for (let j = 0; j < startCycleIdx; j++) {
      if (this.checkCycleCondition(cycles[j], player))
        return j;
    }
    return -1;
  }

  nextValidCycleLink(player = {}, conversation = {}, index = 0, id = '', startCycleIdx = -1) {
    const nextLinkIdx = this.nextValidCycleLinkIndex(player, conversation, index, id, startCycleIdx);
    return nextLinkIdx < 0 ? {} : conversation[index]['cycles'][id][nextLinkIdx];
  }

  checkCycleCondition(cycle = {}, player = {}) {
    if (!('conditions' in cycle))
      return true;
    const conditions = cycle['conditions'];
    for (const variable in conditions) {
      // parse type
      let isFulfilled = false;
      if (variable in player.variables) {
        const playerVal = player.variables[variable];
        const val = conditions[variable]['val'];
        const type = conditions[variable]['type'];
        switch (type) {
        case '>':
          isFulfilled = playerVal > val;
          break;
        case '<':
          isFulfilled = playerVal < val;
          break;
        case '>=':
          isFulfilled = playerVal >= val;
          break;
        case '<=':
          isFulfilled = playerVal <= val;
          break;
        case 'is':
        case '=':
        default:
          isFulfilled = playerVal === val;
        }
      }
      if (!isFulfilled)
        return false;
    }
    return true;
  }

  mergeQualities(first = {}, second = {}) {

    const merged = {};
    const merge = (ret, map) => {
      Object.keys(map).forEach((key) => {
        if (ret.hasOwnProperty(key)) {
          const asInt = parseInt(ret[key]);
          const dataAsInt = parseInt(map[key]);
          if (!isNaN(asInt) && !isNaN(dataAsInt)) {
            ret[key] = asInt + dataAsInt;
            return;
          }
        }
        ret[key] = map[key];
      });
    };
    merge(merged, first);
    merge(merged, second);
    return merged;

  }

  getDynamicTextElements(player = {}, conversation = {}, index = 0) {
    const elements = [];
    const links = {};
    const text = this.getTextForNode(conversation, index, player.variables);
    let textPos = 0;

    const cycles = conversation[index].cycles;
    Object.keys(cycles).forEach((cycleId) => {
      elements.push(text.substr(textPos, text.indexOf(cycleId) - textPos));
      textPos = text.indexOf(cycleId) + cycleId.length;
      const cycleIndex = player.cyclingLinks[cycleId];
      const phrase = cycles[cycleId][cycleIndex].text;
      elements.push(phrase);
      links[elements.length-1] = cycleId;
    });

    if (textPos < text.length)
      elements.push(text.substr(textPos));
    return { 'elements': elements, 'links': links };
  }

  getCyclingLinkText(conversation = {}, index = 0, linkId = '', linkIdx = 0) {
    return conversation[index].cycles[linkId][linkIdx].text;
  }

  getCyclingLinkActions(conversation = {}, index = 0, linkId = '', linkIdx = 0) {
    return conversation[index].cycles[linkId][linkIdx].actions;
  }

  getActionsForCyclingLinks(conversation = {}, index = 0, cyclingLinkMap = {}) {
    return Object.keys(cyclingLinkMap).reduce((acc, id) => {
      return this.mergeQualities(
        acc, this.getCyclingLinkActions(
          conversation, index, id, cyclingLinkMap[id]
        )
      );
    }, {});
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
