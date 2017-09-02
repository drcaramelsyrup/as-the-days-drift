/*
* DialoguePanel
* ==============
*
* Handles displaying dialogue (conversation data) to screen
*/

import textstyles from '../../static/assets/textstyles.json';
import UIElement from './UIElement';

// TODO: define body text dimensions
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

    // private members specifying margin and padding
    const textOriginX = 96;
    const textOriginY = 60;
    const padding = 32;

    // window coordinates
    const panelX = padding / 2;
    const panelY = game.height * 5 / 8;  /* 5/8 down */

    const panelHeight = game.height * 3 / 8 /* 3/8 height */ - padding / 2;
    const panelWidth = game.width - padding;

    // speaker avatar display
    this.avatar = new UIElement(
      400, 100, 
      game.make.sprite(0,0,'invisible'),
      game, 400, 500);

    this.panel = new UIElement(
      panelX, panelY,
      game.make.sprite(0,0,'dialogue-panel'),
      game, panelWidth, panelHeight
    );

    // dialog text dimensions (private)
    this._textHeight = panelHeight - textOriginY - 18;
    this._textWidth = panelWidth - 185;

    // actual window contents
    const speakerX = padding + 64;
    const speakerY = padding / 4;
    this.speakerText = new UIElement(
      Math.round(speakerX), speakerY,
      game.make.text(0,0,'Speaker', textstyles['speaker']),
      this.panel
    );

    /**
     * Text styles
     */
    // TODO: body text is monolithic Phaser.Text object
    const bodyStyle = textstyles['dialogueBody'];
    bodyStyle.wordWrapWidth = this._dialogTextWidth;
    let textContent = game.make.text(0, 0, 'placeholder text', bodyStyle);
    textContent.lineSpacing = 0;
    this.bodyText = new UIElement(
      textOriginX, textOriginY,
      textContent,
      this.panel);

    this.panel.alpha = 0.8;

    /**
     * Interactables
     */
    // for removing player choice buttons
    this.buttons = [];
    this.buttonTweens = [];
    //for keeping track of whether the avatar needs to be updated (performance intensive)
    this.avatarName = 'invisible';

    // will track the conversation file, so that save checkpoints will
    // go to the correct area in the conversation
    this.convoFile = null;

    // for rendering lines character by character
    this.charTimer = null;


  }

  clean() {
    // stop all button tweens
    for (let i = 0; i < this.buttonTweens.length; i++) {
      this.buttonTweens[i].stop();
    }

    // remove all buttons
    for (let j = 0; j < this.buttons.length; j++) {
      let button = this.buttons[j];
      // TODO: destroy buttons using UIElement
      // button.container.displayGroup.removeAll(true);
      // button.container.displayGroup.destroy();
      // button.container.children = [];
      // button.container = undefined;
      // button.sprite = undefined;
    }
    this.buttons = [];

    this.bodyText.y = this._textOriginY;
    // this.dialogText.displayObject.inputEnabled = false;
    // this.dialogText.displayObject.events.onInputOver.removeAll();
    // this.dialogText.displayObject.events.onInputOut.removeAll();
    // this._game.input.mouse.mouseWheelCallback = null;
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

  // display(
  //   displaysInstant = false /* by default, not set to display text instantly */
  // ) {
  //   this.clean();
  //   if (this.convoFile && this.convoManager) {
  //     this.takeActions();
  //     this.displayAvatar();

  //     // On finishing the dialog text display, display our responses
  //     // Added before our actual display call in case we display instantly
  //     // TODO: set this up with async await
  //     // this._onDialogTextFinished.add(() => {
  //     //   this.displayResponses();
  //     //   this._onDialogTextFinished.removeAll();
  //     // });
  //     // this.displayText(displaysIns
  //   }
  // }

  display(fragment) {
    this.clean();
    // this.displayAvatar(fragment.avatar);
    this.displayText({
      speaker: fragment.speaker,
      body: fragment.text,
    });
  }

  displayText({ speaker, body }) {
    this.speakerText.element.text = speaker;
    this.bodyText.element.text = body;

    // if (displaysInstant) {
    //   this.bodyText.element.text = fragment.body;
    //   if (this.charTimer != null) {
    //     this._game.time.events.remove(this.charTimer);  // stop characters from rendering one by one, if they are currently rendering
    //   }
    //   this._onDialogTextFinished.dispatch();
    //   return;
    // }

    // // character-by-character display
    // this.displayCurrentLine();

  }


  get textOrigin() {
    return Phaser.Point(this._textOriginX, this._textOriginY);
  }
  set textOrigin(position) {
    this._textOriginX = position.x;
    this._textOriginY = position.y;
  }


//   displayResponses() {
//     // start rendering buttons at the bottom of dialogue
//     const responses = this.convoManager.getResponses(this._game);

//     const textBottom = this._dialogTextOriginY + this.dialogText.displayObject.getBounds().height;
//     this.nextButtonY = textBottom;

//     if (responses.length === 0) {
//       // no responses - waiting on player to do something to progress
//       const waitButton = this.addChoiceButton(this._dialogTextOriginX, this.nextButtonY,
//         'END', null);
//       waitButton.visible = false;
//       this.buttons.push(waitButton);
//     }

//     this.buttonTweens = [];

//     for (let i = 0; i < responses.length; i++) {
//       // pass along special parameters, if any
//       let params = [];
//       if ('params' in responses[i]) {
//         params = responses[i]['params'];
//       }

//       // keep track of buttons to be deleted
//       const responseDelay = 250;
//       const button = this.addChoiceButton(
//         this._dialogTextOriginX, this.nextButtonY,
//         responses[i]['text'], responses[i]['target'], params);
//       button.alpha = 0;
//       const tween = this._game.add.tween(button).to({alpha: 1}, responseDelay, Phaser.Easing.Linear.None, true, responseDelay * i);
//       this.buttonTweens.push(tween);  // for deletion later
//       this.buttons.push(button);
//       this._buttonsY.push(button.y);
//       this.nextButtonY += button.sprite.height;
//     }

//     // last element is bottom of content
//     this._buttonsY.push(this.nextButtonY);
//   }

//   addChoiceButton(x, y, responseTextField, responseTarget, responseParams = []) {
//     // display text
//     const buttonSidePadding = 32;
//     const buttonTextStyle = textstyles['choiceButton'];
//     buttonTextStyle.wordWrapWidth = this._dialogTextWidth - buttonSidePadding;
//     const responseText = this._game.make.text(0, 0, responseTextField, buttonTextStyle);
//     const buttonText = new SlickUI.Element.DisplayObject(
//       Math.round(this._dialogTextWidth / 2 - responseText.width / 2),0, /* center text */
//       responseText);

//     // add to sized button
//     let choiceButton;
//     this.dialogPanel.add(choiceButton = new SlickUI.Element.DisplayObject(
//       x, y,
//       this._game.make.button(0,0, 'dialogue-choice-button'),
//       this.dialogWidth, responseText.height));
//     choiceButton.add(buttonText);
//     choiceButton.sprite.width = this._dialogTextWidth;
//     choiceButton.sprite.height = responseText.height;

//     // end of conversation. action deletes window
//     if (responseTarget < 0) {
//       choiceButton.events.onInputUp.add(() => {
//         this.hide();
//         this.convoManager.endConversation();  // take any actions that trigger when this conversation ends
//       });
//     }

//     choiceButton.events.onInputUp.add(() => {
//       this._game.sound.play('tap');
//       const shouldRefresh = this.convoManager.advanceToTarget(
//         this.responseTarget, responseParams);
//       if (shouldRefresh)
//         this.display();
//     });
//     // add mask
//     choiceButton.sprite.mask = this._scrollMask;
//     buttonText.displayObject.mask = this._scrollMask;

//     return choiceButton;
//   }


//   hideAvatar() {
//     const fadeOutTween = this._game.add.tween(this.avatar);
//     const fadeOut = 200;
//     fadeOutTween.to({alpha: 0}, fadeOut, Phaser.Easing.Linear.None, true);
//   }


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
