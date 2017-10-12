/*
* UIContainer
* ==============
*
* Based loosely off of slickUI by @flaxis. Many thanks.
* See https://github.com/Flaxis/slick-ui/
*/

// TODO: resample when resizing UI container
// TODO: add support for centering
export default class UIContainer {
  constructor(game, x, y, parent=null, width=-1, height=-1/*, ...args*/) {

    // PROPERTIES
    // - maxWidth
    // - maxHeight

    // PUBLIC
    // - parent
    // - children
    // - x
    // - y
    // - displayGroup

    if (parent == null) {
      parent = game;
    }

    this.parent = parent;
    this.children = [];

    this.displayGroup = game.add.group();

    let parentLoc = new Phaser.Point(0,0);
    if (parent instanceof UIContainer) {
      parentLoc.x = parent.x;
      parentLoc.y = parent.y;
      parent.displayGroup.add(this.displayGroup);
    }

    this.x = x + parentLoc.x;
    this._xOffset = x;
    this.y = y + parentLoc.y;
    this._yOffset = y;
    this._width = width;
    this._height = height;
    // TODO: something for z-order layering?
  }

  get maxWidth() {
    let parentWidth = this.parent instanceof UIContainer
      ? this.parent.maxWidth
      : this.parent.width;
    return Math.min(
      parentWidth - this._xOffset,
      this._width);
  }

  get maxHeight() {
    let parentHeight = this.parent instanceof UIContainer
      ? this.parent.maxHeight
      : this.parent.height;
    return Math.min(
      parentHeight - this._yOffset,
      this._height);
  }

}
