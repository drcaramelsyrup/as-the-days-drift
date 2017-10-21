/*
 * DynamicTextElement
 * ==================
 *
 * Super UI element maintaining several text elements that wrap and perform dynamic events
 */

import UIElement from './UIElement'

export default class DynamicTextElement {

  constructor(game, ...args) {
    // Keeps track of text elements included
    this.textList = [];
    this.start = new Phaser.Point(0,0);
    this.end = new Phaser.Point(0,0);
    this._game = game;

  }

  textCutoff(textContext = {}, inWords = [], cutoffWidth = 0) {
    for (let idx = 0; idx < inWords.length; idx++) {
      let phrase = inWords.slice(0, idx+1).join(' ');

      let width = textContext.measureText(phrase).width;
      if (width > cutoffWidth)
        return idx;
    }
    return -1;
  }

  generate(textString = '',
    style = {}, 
    start = new Phaser.Point(0,0)) {

    this.start = start;
    let toMeasure = this._game.make.text(0,0, textString, style);

    let nextX = start.x;
    let nextY = start.y;

    if (style.wordWrapWidth <= 0)
      return;

    let words = toMeasure.text.split(' ');
    while (words.length > 0) {
      let idx = this.textCutoff(toMeasure.context, words, style.wordWrapWidth - start.x);
      let phrase = words.slice(0, idx+1).join(' ');
      // check: game.make might return void
      this.textList.push(
        new UIElement(nextX, nextY,
          this._game.make.text(0,0,phrase,style), null));
      
      words = words.slice(idx+1);
      if (words.length > 0) {
        nextX = 0;
        /* nextY += one line's height */
      }
    }

    let lastText = this.textList.at(this.textList.length - 1);
    this.end = new Phaser.Point(lastText.right.x, lastText.right.y);

  }


}
