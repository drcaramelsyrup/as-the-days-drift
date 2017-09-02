/*
 * Custom Actions
 * ===================
 *
 * Stores code for custom actions to be taken during conversations.
 */

export default class CustomActions {
  constructor(game/*, ...args*/) {
    this._game = game;
  }

  customAction(action) {
    if (action.startsWith('fadeInAndOut')) {
      this.fadeInAndOut(parseInt(action.substring('fadeInAndOut'.length)));
    } else if (action === 'startConv:prologue02') {
      this._game.camera.fade('#000000', 2000);
      this._game.camera.onFadeComplete.addOnce(function() {
        this._game.camera.flash('#000000', 2000);
        this.startConversation('prologue02');
      }, this);
    } else if (action.startsWith('moveToArea:')) {
      this.moveToArea(action.substring('moveToArea:'.length));
    } else if (action === 'startBattle') {
      this.loadBattle();  
    } else if (action === 'loadMainGameState') {
      this._game.state.start('Game', true, false, this._game, false, true);
    } else if (action.startsWith('gameover')) {
      this._game.state.start('GameOver', true, false, this._game, action.substring('gameover'.length));
    } else if (action === 'credits') {
      this._game.state.start('Credits', true, false, this._game);
    }
  }

  loadBattle() {
    this._game.dialogueWindow.hide();
    this._game.state.start('Battleground', true, false);
  }

  startConversation(conv) {
    this._game.dialogueWindow.begin(conv);
  }

  moveToArea(area) {
    this._game.room.loadArea(area);
  }

  fadeInAndOut(duration) {
    this._game.camera.fade('#000000', duration/2);
    this._game.dialogueWindow.avatar.visible = false;
    this._game.dialogueWindow.dialogPanel.visible = false;
    this._game.camera.onFadeComplete.addOnce(function() {
      this._game.camera.flash('#000000', duration/2);
      this._game.dialogueWindow.avatar.visible = true;
      this._game.dialogueWindow.dialogPanel.visible = true;
    }, this);
  }
}