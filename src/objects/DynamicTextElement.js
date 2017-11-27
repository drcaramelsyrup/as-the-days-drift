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
    this.hoverColor = '#ffff00';
    this.style = style;

    this.generate(textString, this.style, this.start);
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
      }
    }

    let lastText = this.textList[this.textList.length - 1];
    this.end = new Phaser.Point(lastText.x + lastText.element.right, lastText.y);

    if (this.textList.length <= 0 || this.callback == null)
      return;

    this.addClickEvent(() => {
      this.callback(this.getColor());
    });

    const startColor = this.getColor();
    const hoverInterp = (source, target) => {
      this.colorTimer.stop(true /* clear events */);
      let currentStep = 0;
      this.colorTimer.loop(Constants.DYN_TEXT_TWEENTIME/Constants.DYN_TEXT_TWEENSTEPS,
      () => {
        const rgbColor = Phaser.Color.valueToColor(
          Phaser.Color.interpolateColor(
            Phaser.Color.hexToRGB(source), 
            Phaser.Color.hexToRGB(target), 
            Constants.DYN_TEXT_TWEENSTEPS, currentStep
          )
        );
        const rgbString = Phaser.Color.RGBtoString(
          rgbColor.r, rgbColor.g, rgbColor.b);
        this.setColor(rgbString);

        currentStep++;
        if (currentStep > Constants.DYN_TEXT_TWEENSTEPS)
          this.colorTimer.stop(true);
      });
      this.colorTimer.start();
    };

    this.addHoverEvent(() => {
      // over
      hoverInterp(this.getColor(), this.hoverColor);
    }, () => {
      // out
      hoverInterp(this.getColor(), startColor);
    });
  }

  getColor() {
    const firstElement = this.textList[0].element;
    return firstElement.colors[0] == null
      ? this.style.fill : firstElement.colors[0];
  }

  setColor(colorString) {
    this.textList.forEach((textWrapper) => {
      const text = textWrapper.element;
      text.addColor(colorString, 0);
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
