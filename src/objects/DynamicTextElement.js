/*
 * DynamicTextElement
 * ==================
 *
 * Super UI element maintaining several text elements that wrap and perform dynamic events
 */

import UIElement from './UIElement';
import Constants from '../utils/Constants';

export default class DynamicTextElement {

  constructor(game, textString, style, x, y, callback = null/*, ...args*/) {
    this._game = game;
    // Keeps track of text elements included
    this.textList = [];
    this.start = new Phaser.Point(x,y);
    this.end = new Phaser.Point(0,0);
    this.colorTimer = game.time.create(false /* no autodestroy */);
    this.callback = callback;

    this.generate(textString, style, this.start);
  }

  textCutoff(textContext = {}, inWords = [], cutoffWidth = 0) {
    for (let idx = 0; idx < inWords.length; idx++) {
      if (inWords[idx].includes('\n'))
        return idx;
      if (inWords[idx].includes(' '))
        continue;

      let phrase = inWords.slice(0, idx+1).join('');

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

    let words = toMeasure.text.split(/(\n| )/);
    while (words.length > 0) {
      let idx = this.textCutoff(toMeasure.context, words, style.wordWrapWidth - nextX);
      let phrase = words.slice(0, idx+1).join('');
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

    if (this.textList.length <= 0 || this.callback == null)
      return;

    this.addClickEvent(() => {
      // TODO: in the future, this sends a signal to advance
      // the cycling link index for this element and regenerate the text
      this.callback();
    });

    const firstElement = this.textList[0].element;
    const startColor = firstElement.colors[0] == null 
      ? style.fill : firstElement.colors[0];

    const hoverInterp = (source, target) => {
      this.colorTimer.stop(true /* clear events */);
      let currentStep = 0;
      this.colorTimer.loop(Constants.DYN_TEXT_TWEENTIME/Constants.DYN_TEXT_TWEENSTEPS,
      () => {
        this.textList.forEach((textWrapper) => {
          const element = textWrapper.element;
          const rgbColor = Phaser.Color.valueToColor(
            Phaser.Color.interpolateColor(
              Phaser.Color.hexToRGB(source), 
              Phaser.Color.hexToRGB(target), 
              Constants.DYN_TEXT_TWEENSTEPS, currentStep
            )
          );
          element.addColor(Phaser.Color.RGBtoString(
            rgbColor.r, rgbColor.g, rgbColor.b), 0);
        });
        currentStep++;
        if (currentStep > Constants.DYN_TEXT_TWEENSTEPS)
          this.colorTimer.stop(true);
      });
      this.colorTimer.start();
    };

    this.addHoverEvent(() => {
      // over
      hoverInterp(startColor, '#ffff00');
    }, () => {
      // out
      const currentColor = firstElement.colors[0] == null
        ? style.fill : firstElement.colors[0]; 
      hoverInterp(currentColor, startColor);
    });
  }

  addClickEvent(event) {
    this.textList.forEach((textElement) => {
      textElement.element.inputEnabled = true;
      textElement.element.events.onInputDown.add(event);
    });
  }

  addHoverEvent(overEvent, outEvent) {
    this.textList.forEach((textElement) => {
      textElement.element.inputEnabled = true;
      textElement.element.events.onInputOver.add(overEvent);
      textElement.element.events.onInputOut.add(outEvent);
    });
  }


}
