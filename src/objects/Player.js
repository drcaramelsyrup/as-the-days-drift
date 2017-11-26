/*
* Player
* ====
*
* The player object class.
* In ATDD, the Player should keep track of 
* - Cole's qualities (variables)
* - conversation idx
* 
*/

export default class Player {
  constructor() {
    // Both qualities and conditionals will be lumped in here
    this.variables = {};
    this.pending = {};
    this.convoIdx = 0;
    this.convoFile = null;
    // Cycling link map
    this.cyclingLinks = {};

  }

  serialize(game) {
    const fields = [
      'inventory',
      'variables'
    ];

    const obj = {};

    for (let i in fields){
      let field = fields[i];
      obj[field] = this[field];
    }
    obj['convoIdx'] = game.dialogueWindow.convoManager.idx;
    //since the convoFile is not stored in the game, we will just store it with the
    //player whenever a new file is started.
    //or we could store that also in the Dialogue manager??
    obj['convoFile'] = game.dialogueWindow.convoFile;
    return JSON.stringify(obj);
  }


}

Player.unserialize = (playerState, game) => {

  if (typeof playerState === 'string'){
    playerState = JSON.parse(playerState, (key, value) => {
      return value;     // return the unchanged property value.
    });
  }

  game.player = game.add.existing(new Player(game));

  for (let field in playerState){
    game.player[field] = playerState[field];
  }

};
