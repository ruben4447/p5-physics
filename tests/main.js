import { DrawableBody } from '../src/Body.js';
import { DrawableBodyMode, EdgeMode } from '../src/enums.js';
import World from '../src/World.js';

var world, plane;
const TWO_PI = 2 * Math.PI;

// This will be exposed to the global scope
globalThis.globals = {
  paused: false,
};

function createBody(x, y) {
  const b = new DrawableBody(x, y, 25, 25)
    .setPolygon(...createPolygonPath(x, y, 25, Math.floor(random(3, 10))))
    .fill(51)
    .stroke(255);
  // b.mass(Math.floor(random(1, 10)));
  return b;
}

// P5 function - executed when script is loaded
function setup() {
  createCanvas(700, 700); // Create a canvas to draw on
  world = new World(0, 0, width, height); // Create World covering entire canvas
  globals.world = world;

  world.debug = true;
  world.background = color(0);
  world.edgeMode = EdgeMode.Bounce;
  world.G.set(0, 0.1);

  plane = new DrawableBody(0, height - 25, width, 7)
    .coefficientOfFriction(0.9)
    .fill(89);
  plane.static = true;
  globals.plane = plane;
  world.addBody(plane);
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

const rotateCoords = (cx, cy, r, θ) => ([cx + r * Math.cos(θ), cy + r * Math.sin(θ)]);

function createPolygonPath(x, y, r, n) {
  const δθ = TWO_PI / n;
  return new Array(n).fill(0).map((_, i) => rotateCoords(x, y, r, i * δθ));
}