/*
* DialoguePanel
* ==============
*
* Handles displaying dialogue (conversation data) to screen
*/

import textstyles from '../../static/assets/textstyles.json';
import UIElement from './UIElement';
import Constants from '../utils/Constants';

export default class DialoguePanel extends Phaser.Group {
  constructor(game, convoManager/*, ...args*/) {
    super(game/*, ...args*/);

    // PROPERTIES
    // PUBLIC
    // - dialogPanel
    // - speakerText
    // - dialogText
    // - convoManager (passed in ConversationManager)
    // - dialogWidth
    // - dialogHeight
    // - buttons
    // PRIVATE
    // - _game (passed in Game)
    // - _dialogTextOriginX
    // - _dialogTextOriginY
    // - _dialogPadding

    this.convoManager = convoManager;
    // messy, but useful if we need a reference to the game
    this._game = game;

    /* SIGNALS */
    this.onTextFinished = new Phaser.Signal(); // when the char-by-char display finishes

    this.panel = this.createPanel(game);
    this.responsePanel = this.createResponsePanel(game);

    /**
     * Interactables
     */
    // for removing player choice buttons
    this.buttons = [];
    this.buttonTweens = [];

    // will track the conversation file, so that save checkpoints will
    // go to the correct area in the conversation
    this.convoFile = null;

    // for rendering lines character by character
    this.charTimer = null;
  }

  createPanel(game) {
    // window coordinates
    const panelHeight = game.height * Constants.DPANEL_GAME_HEIGHT;
    const panelWidth = game.width * Constants.DPANEL_GAME_WIDTH;

    const panelSprite = game.make.sprite(0,0,'invisible');
    panelSprite.anchor = new Phaser.Point(0.5, 0.5);

    const panel = new UIElement(game,
      game.height/2 - panelHeight/2, game.width/2 - panelWidth/2,
      panelSprite,
      game, panelWidth, panelHeight
    );

    // dialog text dimensions (private)
    // TODO: these dimensions aren't modular / don't make sense!
    // this._textHeight = panelHeight - Constants.DPANEL_TEXT_ORIGIN.y - 18;
    // this._textWidth = panelWidth - 185;

    /**
     * Text styles
     */
    // TODO: body text is monolithic Phaser.Text object
    // const bodyStyle = textstyles['dialogueBody'];
    // bodyStyle.wordWrapWidth = panelWidth;
    // let textContent = game.make.text(0, 0, '', bodyStyle);
    // textContent.lineSpacing = 0;
    // this.bodyText = new UIElement(game,
    //   Math.round(Constants.DPANEL_TEXT_ORIGIN.x), Constants.DPANEL_TEXT_ORIGIN.y,
    //   textContent,
    //   /*this.panel*/null
    // );

    panel.alpha = 0.8;
    return panel;
  }

  createResponsePanel(game) {
    // private members specifying margin and padding
    const panelHeight = game.height * Constants.DPANEL_GAME_HEIGHT;
    const panelWidth = game.width * Constants.DPANEL_GAME_WIDTH;

    const panelSprite = game.make.sprite(0,0,'invisible');
    panelSprite.anchor = new Phaser.Point(0.5, 0.5);

    const panel = new UIElement(game,
      game.width/2 - panelWidth/2, game.height/2 + panelHeight/2,
      panelSprite,
      game, panelWidth, panelHeight
    );

    panel.alpha = 0.8;
    return panel;
  }

  clean() {
    this.panel.destroy();
    this.panel = this.createPanel(this._game);
    this.responsePanel.destroy();
    this.responsePanel = this.createResponsePanel(this._game);
  }

  displayAvatar() {
    const speaker = this.convoManager.getAvatar();
    const fadeOut = 200;
    const fadeIn = 200;

    // if avatar needs to change, fade out the current one and fade in the new one
    if (speaker !== this.avatarName) {
      const fadeInTween = this._game.add.tween(this.avatar);
      fadeInTween.to({alpha: 0}, fadeOut, Phaser.Easing.Linear.None, true);
      fadeInTween.onComplete.add(() => {
        this.avatar.displayObject.loadTexture(speaker);
        this._game.add.tween(this.avatar).to({alpha: 1}, fadeIn, Phaser.Easing.Linear.None, true);
      });
      this.avatarName = speaker;
    }
  }

  show() {
    this.panel.visible = true;
  }

  // display({ body='No Body' }) {
  //   this.clean();
  //   // this.displayAvatar(fragment.avatar);
  //   this.displayText({ body });
  // }

  displayWrappables(wrappables = []) {
    for (let i = 0; i < wrappables.length; i++) {
      let wrappable = wrappables[i];
      for (let j = 0; j < wrappable.textList.length; j++) {
        this.panel.add(wrappable.textList[j]);
      }
    }
  }

  // displayText({ body }) {

  //   return this.writeBodyText(body);

  //   // if (displaysInstant) {
  //   //   this.bodyText.element.text = fragment.body;
  //   //   if (this.charTimer != null) {
  //   //     this._game.time.events.remove(this.charTimer);  // stop characters from rendering one by one, if they are currently rendering
  //   //   }
  //   //   this._onDialogTextFinished.dispatch();
  //   //   return;
  //   // }

  //   // // character-by-character display
  //   // this.displayCurrentLine();

  // }

  // writeBodyText(body) {
  //   this.bodyText.element.text = body;
  //   return this.bodyText;
  // }

  displayResponses(responses = [], callback = null) {
    let y = 0;
    responses.forEach((response) => {
      const { text, target } = response;
      const labelButton = this.createButton(
        0, y, text, target, [], callback
      );
      y += labelButton.height;
    });
  }

  createButton(x = 0, y = 0, responseText = '', responseTarget = 0, responseParams = [], callback) {
    // display text
    const buttonTextStyle = textstyles['choiceButton'];
    const panelWidth = this._game.width * Constants.DPANEL_GAME_WIDTH;
    buttonTextStyle.wordWrapWidth = panelWidth;

    const buttonText = this._game.make.text(0, 0, responseText, buttonTextStyle);

    // add to sized button
    const choiceButton = this._game.make.button(0,0, 'invisible'); 
    this.responsePanel.add(new UIElement(this._game, x, y, choiceButton, null, panelWidth, buttonText.height))
      .add(new UIElement(this._game, Math.round(panelWidth/2 - buttonText.width/2), 0, buttonText, null));

    // end of conversation. action deletes window
    if (responseTarget < 0) {
      choiceButton.events.onInputUp.add(() => {
        this.convoManager.endConversation();  // take any actions that trigger when this conversation ends
      });
    }

    choiceButton.events.onInputUp.add(() => {
      callback(responseTarget, responseParams);
    });

    return choiceButton;

  }

//   hide() {
//     this.cleanWindow();
//     this.dialogPanel.visible = false;
//     this.hideAvatar(); //hide avatar
//   }

//   displayCurrentLine() {

//     const line = this.convoManager.getCurrentText();
//     this.dialogText.displayObject.text = '';

//     //  Split the current line on characters, so one char per array element
//     const split = line.split('');

//     //  Reset the word index to zero (the first word in the line)
//     this._cIndex = 0;

//     // Add an option to skip the text on clicking down.
//     this.dialogPanel.displayObject.inputEnabled = true;
//     this.dialogPanel.events.onInputDown.add(this.skipText, this);

//     const nextChar = () => {
//       // TODO: make this a selectable option
//       let delay = 3;
      
//       this.dialogText.displayObject.text =
//         this.dialogText.displayObject.text.concat(split[this._cIndex]);
//       if (split[this._cIndex] === ',') {
//         delay = 200;    // brief pause on commas
//       } else if (['.', '?', '!'].indexOf(split[this._cIndex]) > -1) {
//         delay = 300;    // longer pause after each sentence
//       }
//       this._cIndex++;
//       if (this._cIndex == split.length) {
//         // Tell the window when we're done
//         this._onDialogTextFinished.dispatch();
//         this.charTimer = null;
//       } else {
//         // Add the next event in the chain
//         this.charTimer = this._game.time.events.add(delay, nextChar, this);
//       }
//     };

//     //  Call the 'nextChar' function and chain until it reaches the end of the line
//     this.charTimer = this._game.time.events.add(0, nextChar, this);

//   }

//   skipText() {
//     this._game.time.removeAll();
//     this.displayText(true);
//     this.dialogPanel.events.onInputDown.removeAll();
//   }
// 
}
