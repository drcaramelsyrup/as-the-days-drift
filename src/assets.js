/*
 * `assets` module
 * ===============
 *
 * Declares static asset packs to be loaded using the `Phaser.Loader#pack`
 * method. Use this module to declare game assets.
 */

export default {
  // -- Splash screen assets used by the Preloader.
  boot: [{
    key: 'splash-screen',
    type: 'image'
  }, {
    key: 'progress-bar',
    type: 'image'
  }],

  // -- General assets used throughout the game.
  game: [{
    key: 'phaser',
    type: 'image'
  }],

  // -- UI assets.
  ui: [{
    key: 'dialogue-panel',
    type: 'image',
    url: 'ui/dialogue-panel.png'
  }, {
    key: 'dialogue-choice-button',
    type: 'image',
    url: 'ui/dialogue-choice-button.png'
  }],

  // -- Avatars.
  avatars: [{
    key: 'invisible',
    type: 'image',
    url: 'avatars/invisible.png'
  }],

  // -- JSON data conversations.
  conversations: [{
    key: 'prologue01',
    type: 'json',
    url: 'conversations/prologue01.json'
  }, {
    key: 'bacon',
    type: 'json',
    url: 'conversations/bacon.json'
  }]
};
