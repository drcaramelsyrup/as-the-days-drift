/*
* TextElement
* ==============
*
* For keeping text phrase properties and making
* interactable phrases
* Responsible for displaying correctly in parent container
*/

// TODO: resample when resizing UI container
// TODO: add support for display groups
// TODO: add support for container dimensions
// TODO: add support for centering
import UIElement from './UIElement';

export default class TextElement extends UIElement {
  constructor(x, y, text, textstyle, container=null/*, ...args*/) {
    super(x, y, text, container);

    // get width of text
    // can we fit within the dialogue container?
    // xpos + width > container allowable text width, needs word wrap
    // keep drawing text onto the canvas, wrap around to the other side
    // 

    // should error if the text is larger than the window can fit

    // when handling input,
    // we should be able to assign a lambda
    // container should be able to extract appropriate text from data/manager
    // onhover: highlight
    // oninputdown/release: cycle through text actions
    // new Phaser.Signal() to broadcast to container
    // container should have new Phaser.Signal() for interested listeners to parse

    // PROPERTIES
    // PUBLIC
    // - text (game.make.text)
    // - length
    // - text container
  }

}
