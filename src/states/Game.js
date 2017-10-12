/*
 * Game state
 * ==========
 *
 * Main game state for visual novel.
 */

import ConversationManager from '../objects/ConversationManager';
import CustomActions from '../utils/CustomActions';
import DialoguePanel from '../objects/DialoguePanel';
import Player from '../objects/Player';

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

    this.game.player = new Player();

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
    // for all dialogue fragments, display
    // let { fragments, responses } = this.convoManager.getDialogue();

    // TODO: async
    this.dialoguePanel.clean();
    this.dialoguePanel.writeSpeakerText(this.convoManager.getSpeaker());

    // const text = this.dialoguePanel.display({
    //   speaker: this.convoManager.getSpeaker(),
    //   body: this.convoManager.getCurrentText(),
    //   // avatar: this.convoManager.getAvatar(),
    // });

    // await display finish
    // display responses
    this.dialoguePanel.displayResponses({
      text: this.dialoguePanel.writeBodyText(this.convoManager.getCurrentText()),
      responses: this.convoManager.getResponses(),
    });

    // then user acknowledgement will be conveyed through buttons
  }



}
