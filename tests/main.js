import { DrawableBody } from '../src/Body.js';
import { DrawableBodyMode, EdgeMode } from '../src/enums.js';
import World from '../src/World.js';

var world, body;

// This will be exposed to the global scope
globalThis.globals = {};

// P5 function - executed when script is loaded
function setup() {
  createCanvas(700, 700); // Create a canvas to draw on
  world = new World(0, 0, width, height); // Create World covering entire canvas
  world.background = color(51);
  globals.world = world;

  body = new DrawableBody(world.w / 2, 100, 10, 10).setDrawMode(DrawableBodyMode.Rectange).setDrawCentredRect(true);
  world.addBody(body);
  world.edgeMode = EdgeMode.Bounce;
  colorMode(HSB);
}
globalThis.setup = setup;

// P5 function - executed at frameRate (initially, 60 fps)
function draw() {
  world.update(); // Update world
  let h = (body.pos.y / world.h) * 360;
  body.fill = color(h, 100, 100);
  world.show(); // Render the world to P5 canvas
}
globalThis.draw = draw;