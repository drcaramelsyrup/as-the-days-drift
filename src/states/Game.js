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
    const game = this.game;

    // custom actions for conversations
    let customActions = new CustomActions(game);
    // conversation manager
    const convoManager = new ConversationManager(game, customActions);

    // dialogue window object
    const dialoguePanel = new DialoguePanel(game, convoManager);

    const player = new Player();

    const conversation = convoManager.loadJSONConversation('output_cyclinglink');
    player.cyclingLinks = convoManager.startCyclingLinkMap(player, conversation, 0);

    convoManager.takeActions(player);
    dialoguePanel.show();

    const display = (game, player, conversation, index, colorMap = {}) => {
      dialoguePanel.clean();
      dialoguePanel.displayWrappables(
        makeWrappables(game, player, conversation, index, colorMap)
      );
      dialoguePanel.displayResponses(
        convoManager.getResponsesForNode(conversation, index),
        (target) => {
          player.variables = convoManager.mergeQualities(player.variables, player.pending);
          display(game, player, conversation, target);
        }
      );
    };

    const makeWrappables = (game, player, conversation, index, colorMap = {}) => {

      const dynamicText = convoManager.getDynamicTextElements(player, conversation, index);
      let start = new Phaser.Point(0,0);
      let end = new Phaser.Point(0,0);
      const textstyle = textstyles['dialogueBody'];
      textstyle.wordWrapWidth = game.width * Constants.DPANEL_GAME_WIDTH;
      const wrappables = [];
      dynamicText.elements.forEach((elem, idx) => {

        start = end;
        const cycleId = dynamicText.links[idx];
        const cycleIdx = player.cyclingLinks[cycleId];
        const isInteractable = dynamicText.links.hasOwnProperty(idx)
          && convoManager.nextValidCycleLinkIndex(player, conversation, index, cycleId, cycleIdx) !== -1;

        const callback = isInteractable
          ? (color) => {
            player.cyclingLinks[cycleId] = convoManager.nextValidCycleLinkIndex(
              player, conversation, index, cycleId, cycleIdx);
            player.pending = convoManager.getActionsForCyclingLinks(
              conversation, index, player.cyclingLinks);
            const colorOnClick = {};
            colorOnClick[cycleId] = color;
            display(game, player, conversation, index, colorOnClick);
          } 
          : null;

        const newText = new DynamicTextElement(
          game, elem, textstyle, start.x, start.y, callback
        );
        if (colorMap.hasOwnProperty(cycleId))
          newText.setColor(colorMap[cycleId]);

        end = newText.end;
        wrappables.push(newText);

      });

      return wrappables;

    };

    display(game, player, conversation, 0);

    

    // for all dialogue fragments, display
    // let { fragments, responses } = convoManager.getDialogue();

    // TODO: async
    // dialoguePanel.clean();

    // await display finish
    // display responses
    // dialoguePanel.displayResponses({
      // text: dialoguePanel.writeBodyText(
        // convoManager.getCurrentText()),
      // responses: convoManager.getResponses(),
    // });

    // then user acknowledgement will be conveyed through buttons

  }



}
