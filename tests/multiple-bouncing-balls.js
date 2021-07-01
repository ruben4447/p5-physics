import { DrawableBody } from '../src/Body.js';
import { DrawableBodyMode, EdgeMode } from '../src/enums.js';
import World from '../src/World.js';

var world;

// This will be exposed to the global scope
globalThis.globals = {
  paused: false,
};

function createBody(x, y) {
  const b = new DrawableBody(x, y, 25, 25)
    .setDrawMode(DrawableBodyMode.Ellipse)
    .fill(51)
    .coefficientOfRestitution(0.7)
    .stroke(255);
  // b.mass = Math.floor(random(1, 10));
  return b;
}

// P5 function - executed when script is loaded
function setup() {
  createCanvas(700, 700); // Create a canvas to draw on
  world = new World(0, 0, width, height); // Create World covering entire canvas
  globals.world = world;

  world.background = color(0);
  world.edgeMode = EdgeMode.Bounce;
  world.G.set(0, 0.1);
}
globalThis.setup = setup;

// P5 function - executed at frameRate (initially, 60 fps)
function draw() {
  if (!globals.paused) {
    world.update(); // Update world
  }

  world.show(); // Render the world to P5 canvas
}
globalThis.draw = draw;

function mousePressed() {
  let b = createBody(mouseX, mouseY);
  // b.applyForce(p5.Vector.random2D().mult(4));
  world.addBody(b);
}
globalThis.mousePressed = mousePressed;