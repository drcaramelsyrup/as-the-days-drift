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
import textstyles from '../../static/assets/textstyles.json';
import DynamicTextElement from '../objects/DynamicTextElement';
import Constants from '../utils/Constants';

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

    const player = new Player();

    const {centerX: x, centerY: y} = this.world;
    const conversation = this.convoManager.loadJSONConversation('output_cyclinglink');
    player.cyclingLinks = this.convoManager.startCyclingLinkMap(this.game.player, conversation, 0);

    this.convoManager.takeActions();
    this.dialoguePanel.show();

    const display = (game, player, conversation, index) => {
      this.dialoguePanel.clean();
      this.dialoguePanel.displayWrappables(
        makeWrappables(game, player, conversation, index, player.cyclingLinks)
      );
      this.dialoguePanel.displayResponses(
        this.convoManager.getResponsesForNode(conversation, index),
        (target) => {
          display(game, player, conversation, target);
        }
      );
    };

    const makeWrappables = (game, player, conversation, index, cyclingLinks) => {

      const dynamicText = this.convoManager.getDynamicTextElements(conversation, index, cyclingLinks);
      let start = new Phaser.Point(0,0);
      let end = new Phaser.Point(0,0);
      const textstyle = textstyles['dialogueBody'];
      textstyle.wordWrapWidth = game.width * Constants.DPANEL_GAME_WIDTH;
      const wrappables = [];
      dynamicText.elements.forEach((elem, idx) => {
        start = end;
        const callback = dynamicText.links.hasOwnProperty(idx)
          ? () => {
            const cycleId = dynamicText.links[idx];
            const cycleIdx = player.cyclingLinks[cycleId];
            player.cyclingLinks[cycleId] = this.convoManager.nextValidCycleLinkIndex(
              player, conversation, index, cycleId, cycleIdx);
            display(game, player, conversation, index);
          } 
          : null;
        const newText = new DynamicTextElement(
          game, elem, textstyle, start.x, start.y, callback
        );
        end = newText.end;
        wrappables.push(newText);
      });

      return wrappables;

    };

    display(this.game, player, conversation, 0);

    

    // for all dialogue fragments, display
    // let { fragments, responses } = this.convoManager.getDialogue();

    // TODO: async
    // this.dialoguePanel.clean();

    // await display finish
    // display responses
    // this.dialoguePanel.displayResponses({
      // text: this.dialoguePanel.writeBodyText(
        // this.convoManager.getCurrentText()),
      // responses: this.convoManager.getResponses(),
    // });

    // then user acknowledgement will be conveyed through buttons

  }



}
