/*
 * Game state
 * ==========
 *
 * Main game state for visual novel.
 */

import ConversationManager from '../objects/ConversationManager';
import CustomActions from '../utils/CustomActions';
import DialoguePanel from '../objects/DialoguePanel';

export default class Game extends Phaser.State {
  preload() {
    // preload all UI menu themes.
  }

  init(resumeGame) {
    if (!resumeGame) {
      localStorage.clear();
    }
  }

  create() {
    // custom actions for conversations
    let customActions = new CustomActions(this.game);
    // conversation manager
    this.convoManager = new ConversationManager(this.game, customActions);
    // convoManager.idx = this.game.player.convoIdx;
    // convoManager.shown = this.game.player.shownConvo;

    // dialogue window object
    this.dialoguePanel = new DialoguePanel(this.game, this.convoManager);

    const {centerX: x, centerY: y} = this.world;
    this.begin('prologue01');
  }

  begin(jsonConvo) {
    // if (this._game.areaTransitionWindow) {
    //   this._game.areaTransitionWindow.disable();
    // }
    if (jsonConvo) {
      this.convoManager.loadJSONConversation(jsonConvo);
      this.dialoguePanel.show();
    }
    this.updatePanel();
  }

  updatePanel() {
    this.convoManager.takeActions();
    this.dialoguePanel.show();
    this.dialoguePanel.display({
      speaker: this.convoManager.getSpeaker(),
      avatar: this.convoManager.getAvatar(),
      text: this.convoManager.getCurrentText(),
    });
    // this.dialogPanel.displayText(this.convoManager.getCurrentText());
  }



}
