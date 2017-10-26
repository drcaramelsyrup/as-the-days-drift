/*
 * DynamicTextElement
 * ==================
 *
 * Super UI element maintaining several text elements that wrap and perform dynamic events
 */

import UIElement from './UIElement';

export default class DynamicTextElement {

  constructor(game, textString, style, x, y/*, ...args*/) {
    // Keeps track of text elements included
    this.textList = [];
    this.start = new Phaser.Point(x,y);
    this.end = new Phaser.Point(0,0);
    this._game = game;

    this.generate(textString, style, this.start);
  }

  textCutoff(textContext = {}, inWords = [], cutoffWidth = 0) {
    for (let idx = 0; idx < inWords.length; idx++) {
      let phrase = inWords.slice(0, idx+1).join(' ');

      let width = textContext.measureText(phrase).width;
      // We want to start a new line if the width exceeds the cutoff
      // If it's the first word, just return it anyway
      if (width > cutoffWidth && idx > 0)
        return idx - 1;
    }
    return inWords.length - 1;
  }

  generate(textString = '',
    style = {}, 
    start = new Phaser.Point(0,0)) {

    this.start = start;
    let toMeasure = this._game.make.text(0,0, textString, style);

    let nextX = start.x;
    let nextY = start.y;
    let fontHeight = parseInt(style.font) + toMeasure.padding.y;

    if (style.wordWrapWidth <= 0)
      return;

    let words = toMeasure.text.split(' ');
    while (words.length > 0) {
      let idx = this.textCutoff(toMeasure.context, words, style.wordWrapWidth - nextX);
      let phrase = words.slice(0, idx+1).join(' ');
      // check: game.make might return void
      this.textList.push(
        new UIElement(this._game, nextX, nextY,
          this._game.make.text(0,0,phrase,style), null));
      
      words = words.slice(idx+1);
      if (words.length > 0) {
        nextX = 0;
        nextY += fontHeight;
        /* nextY += one line's height */
      }
    }

    let lastText = this.textList[this.textList.length - 1];
    this.end = new Phaser.Point(lastText.x + lastText.element.right, lastText.y);

  }


}
