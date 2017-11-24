/*
* UIElement
* ==============
*
* Based loosely off of slickUI by @flaxis. Many thanks.
* https://github.com/Flaxis/slick-ui/
*/

import UIContainer from './UIContainer';

export default class UIElement {
  constructor(game, x, y, element, parent=null, width=-1, height=-1/*, ...args*/) {

    // PROPERTIES
    // - x
    // - y
    // - absX (readonly)
    // - absY (readonly)
    // - width
    // - height
    // - visible
    // - alpha

    // PUBLIC
    // - element
    // - parent

    this._game = game;

    this.element = element;
    this.parent = parent;

    this._xOffset = x;
    this._yOffset = y;
    this._width = width;
    this._height = height;

    let parentContainer = this.parent instanceof UIElement
      ? this.parent.container
      : null;
    
    this.containedIn(parentContainer);

  }

  init(inX, inY, inWidth, inHeight) {
    this._x = inX;
    this._y = inY;
    this._width = inWidth;
    this._height = inHeight;

    if (this.element instanceof Phaser.Sprite
      || this.element instanceof Phaser.Text
      || this.element instanceof Phaser.Button) {
      this.element.fixedToCamera = true;
    }

    // Initialize contained element
    this.element.cameraOffset.x = this._x;
    this.element.cameraOffset.y = this._y;
    if (inWidth > 0)
      this.element.width = this.container.maxWidth;
    if (inHeight > 0)
      this.element.height = this.container.maxHeight;
  }

  add(newElement) {
    newElement.containedIn(this.container);
    return newElement;
  }
  
  remove(container) {
    let index = this.container.children.indexOf(container);
    if (index > -1)
    {
      this.container.children.splice(index, 1);
      this.container.displayGroup.remove(container.displayGroup);
    }
  }

  removeAll() {
    this.container.children.forEach((child) => {
      // child.destroy();
      if (child instanceof UIElement)
        child.removeFromParent();
    });
  }

  removeFromParent() {
    if (!(this.parent instanceof UIElement))
      return;
    if (this.container == null)
      return;
    this.parent.remove(this);
    this.parent = this.container.parent = this._game;
  } 

  containedIn(parentContainer) {
    this.removeFromParent();
    this.container = new UIContainer(
      this._game,
      this._xOffset, this._yOffset, 
      parentContainer, this._width, this._height
    );

    this.container.displayGroup.add(this.element);
    this.container.children.push(this);
    this.init(this.container.x, this.container.y,
      this.container.maxWidth, this.container.maxHeight);
  }

  destroy() {
    // mark Phaser element for destruction
    this.removeFromParent();
    this.element.destroy();
    this.container.displayGroup.destroy();
  }

  get x() {
    return this._xOffset;
  }
  set x(val) {
    this._x = val + this.container.parent.x;
    this._xOffset = val;
    this.container.displayGroup.x = val;
  }

  get absX() {
    return this._x;
  }

  get y() {
    return this._yOffset;
  }
  set y(val) {
    this._y = val + this.container.parent.y;
    this._yOffset = val;
    this.container.displayGroup.y = val;
  }

  get absY() {
    return this._y;
  }

  get width() {
    return this._width;
  }
  set width(val) {
    this._width = val;
    this.element.width = this._width;
  }

  get height() {
    return this._height;
  }
  set height(val) {
    this._height = val;
    this.element.height = this._height;
  }

  get visible() {
    return this.element.visible;
  }
  set visible(val) {
    this.element.visible = val;
  }

  get alpha() {
    return this.element.alpha;
  }
  set alpha(val) {
    this.element.alpha = val;
  }


}
