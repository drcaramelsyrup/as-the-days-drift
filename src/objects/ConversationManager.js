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
    // the player object may want to initialize the start index of a conversation
  }

  // TODO: this could be modified by cycling links.
  getTextForNode(conversation = {}, index = 0) {
    return conversation[index]['text'];
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

  // getCurrentText() {
  //   if (this._conversation === null) {
  //     return '';
  //   }

  //   return this._conversation[this._idx]['text'];
  // }

  // getResponses() {
  //   if (!this._conversation === null) {
  //     return [''];
  //   }
  //   const responses = this._conversation[this._idx]['responses'];
  //   const ret = [];
  //   for (let i = 0; i < responses.length; i++) {
  //     //check showOnce of target node
  //     if (this.shown.indexOf(responses[i]['target']) > -1) {    // this node is marked "show once" and has already been shown
  //       continue;
  //     }
  //     //check conditions on response
  //     if ('conditions' in responses[i]) {
  //       let conditionsNeeded = 0;
  //       let conditionsMet = 0;
  //       for (const condition in responses[i]['conditions']) {
  //         if (this.checkCondition(this._game, condition, responses[i]['conditions'][condition])) {
  //           conditionsMet++;
  //         }
  //         conditionsNeeded++;
  //       }
  //       if (conditionsMet >= conditionsNeeded) {
  //         ret.push(responses[i]); //if all conditions are met, display response
  //       }
  //     } else {
  //       ret.push(responses[i]);   //no conditions on this response, display it
  //     }
  //   }

  //   return ret;
  // }

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

  // getSpeaker() {
  //   if (this._conversation === null) {
  //     return [''];
  //   }

  //   return npcs[this._conversation[this._idx]['speaker']]['name'];
  // }

  // getAvatar() {
  //   if (this._conversation === null) {
  //     return [''];
  //   }

  //   return npcs[this._conversation[this._idx]['speaker']]['avatar'];
  // }

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

  // 1. nab text
  // 2. hey, are there any cycling links?
  // 3. replace text
  // 4. submit -> goes to check cycling links for their variables
  // ^ so we need to store cycling links in the player... like an immutable temporary cache
  // { 'id': index of link, 'nextId': index of link }
  // ^^ we need to store them /every time/ a cycling link changes to update the UI

  getCyclingLinkIds(conversation = {}, index = 0) {
    return conversation[index]['cycles'].keys();
  }

  nextValidCycleLink(player = {}, conversation = {}, index = 0, id = '', startCycleIdx = 0) {
    const cycles = conversation['cycles'][id];
    for (let i = startCycleIdx + 1; i < cycles.length; i++) {
      if (this.checkCycleCondition(cycles[i], player)) {
        return cycles[i];
      }
    }
    for (let j = 0; j < startCycleIdx; j++) {
      if (this.checkCycleCondition(cycles[j], player))
        return cycles[j];
    }
    return {}; 
  }

  checkCycleCondition(cycle = {}, player = {}) {
    if (!('conditions' in cycle))
      return true;
    const conditions = cycle['conditions'];
    for (const variable in conditions) {
      // parse type
      if (variable in player.variables) {
        const playerVal = player.variables[variable];
        const val = conditions[variable]['val'];
        const type = conditions[variable]['type'];
        let isFulfilled = false;
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
        if (isFulfilled)
          continue;
        return false;
      }
    }
    return true;
  }

  getCyclingLinkActionList(cyclingLinkMap = {}, conversation = {}, index = 0) {
    let actions = [];
    for (const cycleId in cyclingLinkMap) {
      actions.push(conversation[index][cycleId]['actions']);
    }
    return actions;
  }

  actionsToQualityMap(actions = []) {
    let condensed = {};
    for (let i = 0; i < actions.length; i++) {
      for (const variable in actions[i]) {
        const val = actions[i][variable];
        const asInt = parseInt(val);
        if (!isNaN(asInt)) {
          if (!(variable in condensed))
            condensed[variable] = asInt;
          else
            condensed[variable] += asInt;
          continue;
        }
        condensed[variable] = val;
      }
    }
    return condensed;
  }

  // the second quality map replaces qualities of the first if not numeric
  mergeQualityMaps(first = {}, second = {}) {
    let ret = {};
    for (const variable in first) {
      ret[variable] = first[variable];
    }
    for (const variable in second) {
      const val = second[variable];
      if (typeof val === 'number') {
        if (variable in ret) {
          ret[variable] += val;
          continue;
        }
      }
      ret[variable] = val;
    }
    return ret;
  }

  addCyclingLinksToQualityMap(qualities = {}, cyclingLinkMap = {}, conversation = {}, index = 0) {
    const condensedMap = this.actionsToQualityMap(
      this.getCyclingLinkActionList(cyclingLinkMap, conversation, index));

    return this.mergeQualityMaps(qualities, condensedMap);
  }

  replaceTextWithCyclingLinks(text = '', cyclingLinkMap = {}, conversation = {}, index = 0) {
    let newText = text;
    for (const cycleId in cyclingLinkMap) {
      const cycleIndex = cyclingLinkMap[cycleId];
      newText = newText.replace(cycleId, conversation[index]['cycles'][cycleId][cycleIndex]);
    }
    return newText;
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
