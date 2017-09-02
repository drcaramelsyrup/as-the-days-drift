/*
* UIElement
* ==============
*
* Based loosely off of slickUI by @flaxis
*/

// TODO: resample when resizing UI container
// TODO: add support for display groups
// TODO: add support for container dimensions
// TODO: add support for centering
export default class UIElement {
  constructor(x, y, element, parent=null, width=-1, height=-1/*, ...args*/) {

    // PROPERTIES
    // PUBLIC
    // - x
    // - y
    // - absX (readonly)
    // - absY (readonly)
    // - width
    // - height
    // - visible
    // - alpha

    // Parenting to get reference to game
    if (parent === null) {
      // this is an invalid object.
      return;
    }

    this._parent = parent;
    this.children = [];

    this.element = element;
    if (this.element instanceof Phaser.Sprite
      || this.element instanceof Phaser.Text) {
      this.element.fixedToCamera = true;
    }

    // Parent is either a UIElement or a Phaser Game
    if (parent instanceof UIElement) {
      this.game = parent.game;
      this._parentX = parent.absX;
      this._parentY = parent.absY;
      parent.add(this);
    } else {
      this.game = parent;
      this._parentX = 0;
      this._parentY = 0;
    }


    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;

    // Initialize contained element
    this.element.cameraOffset.x = this._parentX + x;
    this.element.cameraOffset.y = this._parentY + y;
    if (width > 0)
      this.element.width = width;
    if (height > 0)
      this.element.height = height;

    // TODO: something for z-order layering?

    // TODO: Create display group
    // Add element to game
    this.game.add.existing(this.element);
  }

  

  setParent(newParent) {
    this._parent = newParent;
    // our parent coordinates are absolute positions
    this._parentX = newParent ? newParent.absX : 0;
    this._parentY = newParent ? newParent.absY : 0;
    // TODO: this should really be the updateElementOrigin below
    // but it's called in the constructor
    this.element.cameraOffset.x = this.absX;
    this.element.cameraOffset.y = this.absY;
  }

  updateElementOrigin() {
    this.element.cameraOffset.x = this.absX;
    this.element.cameraOffset.y = this.absY;
  }

  add(newContainer) {
    this.children.push(newContainer);
    newContainer.setParent(this);

    return newContainer;
  }

  remove(container) {
    let index = this.children.indexOf(container);
    if (index > -1)
      this.children.splice(index, 1);
  }

  removeFromParent() {
    this._parent.remove(this);
    this.setParent(null);
  }

  destroy() {
    this.removeFromParent();
    // mark Phaser element for destruction
    this.element.destroy();
    for (let child in this.children) {
      child.destroy();
    }
  }

  // TODO: elements do not care about container dimensions

  get x() {
    return this._x;
  }
  set x(val) {
    this._x = val;
    this.updateElementOrigin();
    // TODO: find an ES6 way to do this?
    for (let child in this.children) {
      child.parentX = this.absX;
    }
  }

  get y() {
    return this._y;
  }
  set y(val) {
    this._y = val;
    this.updateElementOrigin();
    // TODO: find an ES6 way to do this?
    for (let child in this.children) {
      child.parentY = this.absY;
    }
  }

  get parentX() {
    return this._parentX;
  }
  get parentY() {
    return this._parentY;
  }

  get absX() {
    return this.parentX + this.x;
  }
  get absY() {
    return this.parentY + this.y;
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
