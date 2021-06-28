import { DrawableBodyMode, EdgeMode } from "./enums.js";

var __body_id = 0;

/** Base class for a body */
export class Body {
  constructor(x, y, w = 0, h = 0) {
    this._id = __body_id++;
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.w = w;
    this.h = h;
    this.mass = 1;

    this._world = null;
    this.static = false; // Apply physics to said body?

    this.cbOnUpdate = () => true; // If returns false, update will halt
    this.cbOnApply = f => f; // NOTE - called before force is applied
  }

  /* Apply physics to said particle */
  update() {
    if (!this.static || this.cbOnUpdate() === false) {
      this.vel.add(this.acc); // Apply acceleration - change of velocity
      this.pos.add(this.vel); // Apply velocity - change of position
      this.acc.set(0, 0); // Cancel acceleration
    }
  }

  /**
   * Apply force to said particle, using F = ma
   * @param force P5 vector
   */
  apply(force) {
    if (!this.static) {
      let f = p5.Vector.div(force, this.mass);
      f = this.cbOnApply(f);
      this.acc.add(f);
    }
  }

  /** Take action if body is at edge of world, depending on World setup */
  edges() {
    const W = this._world;
    switch (W.edgeMode) {
      case EdgeMode.None:
        break;
      case EdgeMode.Hold:
        // Align self with world edge
        if (this.pos.x < W.x) this.pos.x = W.x;
        if (this.pos.x > W.x + W.w) this.pos.x = W.x + W.w;
        if (this.pos.y < W.y) this.pos.y = W.y;
        if (this.pos.y > W.y + W.h) this.pos.y = W.y + W.h;
        break;
      case EdgeMode.Wrap:
        if (this.pos.x < W.x) this.pos.x = W.x + W.w;
        else if (this.pos.x > W.x + W.w) this.pos.x = W.x;
        if (this.pos.y < W.y) this.pos.y = W.y + W.h;
        else if (this.pos.y > W.y + W.h) this.pos.y = W.y;
        break;
      case EdgeMode.Bounce:
        if (this.pos.x < W.x) {
          this.pos.x = W.x;
          this.vel.x *= -1;
        } else if (this.pos.x > W.x + W.w) {
          this.pos.x = W.x + W.w;
          this.vel.x *= -1;
        }
        if (this.pos.y < W.y) {
          this.pos.y = W.y;
          this.vel.y *= -1;
        } else if (this.pos.y > W.y + W.h) {
          this.pos.y = W.y + W.h;
          this.vel.y *= -1;
        }
        break;
      default:
        console.warn(`edges(): Unknown edge mode '${W.edgeMode}'`);
    }
  }

  show() {
    throw new Error(`#<Body> :: method show() requires overload`);
  }
}

/** Drawable body */
export class DrawableBody extends Body {
  constructor(x, y, w, h) {
    super(x, y, w, h);
    this.stroke = null; // P5 colour object OR null
    this.fill = color(0); // P5 colour object OR null
    this._mode = DrawableBodyMode.Rectange;
    this._path = []; // If mode=Path :: path to draw
    this._rectCentre = false; // If mode=Rectangle :: draw centre of rectangle at this.pos?
  }

  /** Set drawing mode */
  setDrawMode(mode) {
    this._mode = mode;
    return this;
  }

  /** Set path to draw */
  setPath(...path) {
    if (this._mode !== DrawableBodyMode.Path) throw new Error(`Cannot utilise method - drawing mode is not path`);
    this._path = path;
    return this;
  }

  /** SHould we draw the rectangle as centred? */
  setDrawCentredRect(bool) {
    if (this._mode !== DrawableBodyMode.Rectange) throw new Error(`Cannot utilise method - drawing mode is not rectangle`);
    this._rectCentre = !!bool;
    return this;
  }

  show() {
    if (this.stroke === null) noStroke(); else stroke(this.stroke);
    if (this.fill === null) noFill(); else fill(this.fill);

    switch (this._mode) {
      case DrawableBodyMode.Ellipse:
        ellipse(this.pos.x, this.pos.y, this.w, this.h);
        break;
      case DrawableBodyMode.Rectange:
        if (this._rectCentre) {
          rect(this.pos.x - this.w / 2, this.pos.y - this.h / 2, this.w, this.h);
        } else {
          rect(this.pos.x, this.pos.y, this.w, this.h);
        }
        break;
      case DrawableBodyMode.Path:
        beginShape();
        this._path.forEach(p => vertex(...p));
        endShape();
        break;
      default:
        point(this.pos.x, this.pos.y);
    }
    return this;
  }
}