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

    // dialogue window object
    this.dialoguePanel = new DialoguePanel(this.game, this.convoManager);

    this.game.player = new Player();

    const {centerX: x, centerY: y} = this.world;
    this.convoManager.loadJSONConversation('prologue01');

    this.convoManager.takeActions();
    this.dialoguePanel.show();
    // for all dialogue fragments, display
    // let { fragments, responses } = this.convoManager.getDialogue();

    // TODO: async
    this.dialoguePanel.clean();

    // await display finish
    // display responses
    this.dialoguePanel.displayResponses({
      text: this.dialoguePanel.writeBodyText(
        this.convoManager.getCurrentText()),
      responses: this.convoManager.getResponses(),
    });

    // then user acknowledgement will be conveyed through buttons

  }



}
