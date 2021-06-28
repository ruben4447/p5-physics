import { EdgeMode } from './enums.js';

/**
 * A world is defined as a collection of bodies/areas
 */
export class World {
  constructor(x = 0, y = 0, w = 400, h = 400) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.background = null; // P5 color OR null
    this.borders = color(0); // P5 color OR null

    this.bodies = []; // Store array of bodies
    this.areas = []; // Store array of areas
    this.G = createVector(0, 0.1); // Gravity vector
    this.edgeMode = EdgeMode.None; // What to do when body encountered an edge?
  }

  /** Get number of bodies in this World */
  bodyCount() {
    return this.bodies.length;
  }

  /** Push a body to this world */
  addBody(body) {
    body._world = this;
    this.bodies.push(body);
    return this;
  }

  /**
   * Remove body from this world
   * @return {boolean} Removed?
   * */
  remove(body) {
    const i = this.bodies.indexOf(body);
    if (i !== -1) {
      this.bodies.splice(i, 1);
      return true;
    }
    return false;
  }

  /** Update everything in the world */
  update() {
    const edges = this.edgeMode !== EdgeMode.None;

    this.bodies.forEach(body => {
      // Apply gravity
      if (this.G) {
        let G = p5.Vector.mult(this.G, body.mass); // Gravoty is constant regardless of mass
        body.apply(G);
      }

      body.update();

      // Check edges
      if (edges) body.edges();
    });
  }

  /** Show everything in this beautiful world :) */
  show() {
    background(255); // "Clear" canvas
    if (this.background || this.borders) {
      if (this.background) fill(this.background); else noFill();
      if (this.borders) stroke(this.borders); else noStroke();
      strokeWeight(1);
      rect(this.x, this.y, this.w, this.h);
    }

    this.bodies.forEach(b => b.show());
    return this;
  }
}

export default World;