/*
* Main Menu state
* ===============
*
* The player should be able to restart a saved game or start a new game.
*
*/

import textstyles from '../../static/assets/textstyles.json';

export default class MainMenu extends Phaser.State {

  create() {
    /**
     * SCREEN
     */

    const {centerX: x, centerY: y} = this.world;

    /**
     * TEXT
     */
     // TODO: grab text height and use to calc coordinates
    const titleTextY = this.world.centerY - 75;
    const newGameTextY = this.world.centerY;
    const continueTextY = this.world.centerY + 55;

    let titleText = this.add.text(
      this.world.centerX, 
      titleTextY, 
      'Menu', 
      textstyles['mainMenuTitle']
    );

    let newGameText = this.add.text(
      this.world.centerX, 
      newGameTextY, 
      'New Game', 
      textstyles['mainMenuH1']
    );

    let continueText = this.add.text(
      this.world.centerX, 
      continueTextY, 
      'Continue', 
      textstyles['mainMenuH1']
    ); 

    titleText.anchor.setTo(0.5, 0.5);
    continueText.anchor.setTo(0.5, 0.5);
    newGameText.anchor.setTo(0.5, 0.5);

    /**
     * INTERACTIVITY
     */
    continueText.inputEnabled = true;
    newGameText.inputEnabled = true;

    continueText.events.onInputOver.add(() => {
      continueText.fill = textstyles['mainMenuH1_over']['fill'];
    });
    newGameText.events.onInputOver.add(() => {
      newGameText.fill = textstyles['mainMenuH1_over']['fill'];
    });

    continueText.events.onInputOut.add(() => {
      continueText.fill = textstyles['mainMenuH1']['fill'];
    });
    newGameText.events.onInputOut.add(() => {
      newGameText.fill = textstyles['mainMenuH1']['fill'];
    });

    continueText.events.onInputDown.add(() => {
      let resumeGame = true;
      this.state.start('Game', true, false, this, resumeGame);
    });
    newGameText.events.onInputDown.add(() => {
      let resumeGame = false;
      this.state.start('Game', true, false, this, resumeGame);
    });
  }
}
