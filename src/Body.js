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
    this._cr = 1; // Coefficient of restitution. 1 = perfectly elastic.

    this._world = null;
    this.static = false; // Apply physics to said body?
    this.solid = true; // Can we collide with this Body?

    this.cbOnUpdate = () => true; // If returns false, update will halt
    this.cbOnApply = f => f; // NOTE - called before force is applied
  }

  get ID() { return this._id; }

  /** Get/Set value for coefficient of restitution - will be used in collisions */
  coefficientOfRestitution(val = undefined) {
    if (val === undefined) return this._cr;

    if (val < 0) val = 0;
    else if (val > 1 || !isFinite(val) || isNaN(val)) val = 1;
    this._cr = val;
    return this;
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
  applyForce(force) {
    if (!this.static) {
      let f = p5.Vector.div(force, this.mass);
      f = this.cbOnApply(f);
      this.acc.add(f);
    }
    return this;
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

  /** <a, b> have collided... what now? */
  static collide(a, b) {
    if (a.solid && b.solid) {
      let a_mu = a.vel.copy().mult(a.mass); // a: mass * velocity
      let b_mu = b.vel.copy().mult(b.mass); // a: mass * velocity

      // v(a) = [Cr * m(b) * [u(b) - u(a)] + m(a) * u(a) + m(b) * u(b)] / [m(a) + m(b)]
      let velA = b.vel.copy().sub(a.vel).mult(b.mass).mult(a.coefficientOfRestitution()).add(a_mu).add(b_mu).div(a.mass + b.mass);

      // v(b) = [Cr * m(a) * [u(a) - u(b)] + m(a) * u(a) + m(b) * u(b)] / [m(a) + m(b)]
      let velB = a.vel.copy().sub(b.vel).mult(a.mass).mult(b.coefficientOfRestitution()).add(a_mu).add(b_mu).div(a.mass + b.mass);

      a.vel.set(velA.x, velA.y);
      b.vel.set(velB.x, velB.y);
    }
  }
}

/** Drawable body */
export class DrawableBody extends Body {
  constructor(x, y, w, h) {
    super(x, y, w, h);
    this._stroke = null; // P5 colour object OR null
    this._fill = color(0); // P5 colour object OR null
    this._mode = DrawableBodyMode.Rectange;
    this._path = []; // If mode=Path :: path to draw
    this._pointMotion = false; // Point shape in direction of motion?
  }

  /** Set drawing mode */
  setDrawMode(mode) {
    this._mode = mode;
    return this;
  }

  /** Set _pointMotion */
  pointInDirectionOfMotion(bool) {
    this._pointDir = !!bool;
    return this;
  }

  /** Set path to draw */
  setPath(...path) {
    if (this._mode !== DrawableBodyMode.Path) throw new Error(`Cannot utilise method - drawing mode is not path`);
    this._path = path;
    return this;
  }

  /** Set this._fill to color([arguments]) or NULL */
  fill(...args) {
    this._fill = args[0] === null ? null : color(...args);
    return this;
  }

  /** Set this._stroke to color([arguments]) or NULL */
  stroke(...args) {
    this._stroke = args[0] === null ? null : color(...args);
    return this;
  }

  show() {
    if (this._stroke === null) noStroke(); else stroke(this._stroke);
    if (this._fill === null) noFill(); else fill(this._fill);

    switch (this._mode) {
      case DrawableBodyMode.Point:
        point(this.pos.x, this.pos.y);
        break;
      case DrawableBodyMode.Ellipse:
        ellipse(this.pos.x, this.pos.y, this.w, this.h);
        break;
      case DrawableBodyMode.Rectange:
        rect(this.pos.x, this.pos.y, this.w, this.h);
        break;
      case DrawableBodyMode.Path:
        beginShape();
        this._path.forEach(p => vertex(...p));
        endShape();
        break;
      case DrawableBodyMode.Triangle: {
        let w2 = this.w / 2, h2 = this.h / 2;
        push();
        translate(this.pos.x, this.pos.y);
        if (this._pointDir) {
          let heading = this.vel.heading();
          rotate(heading);
        }
        triangle(-w2, -h2, -w2, h2, w2, 0);
        point(0, 0);
        pop();
      }
        break;
      default:
        throw new Error(`show(): Unknown draw mode ${this._mode}`);
    }
    return this;
  }

  /** Test - is there a collision between the two given DrawableBody objects? */
  static collision(a, b) {
    // TODO add collision supports for DrawableBodyMode.Path
    if (a._mode === DrawableBodyMode.Point && b._mode === DrawableBodyMode.Point) { // Point, Point
      return Math.floor(a.pos.x) === Math.floor(b.pos.x) && Math.floor(a.pos.y) === Math.floor(b.pos.y); // Points must be equal (to nearest pixel)
    } else if (a._mode === DrawableBodyMode.Ellipse && b._mode === DrawableBodyMode.Ellipse) { // Ellipse, Ellipse
      return collideCircleCircle(a.pos.x, a.pos.y, a.w, b.pos.x, b.pos.y, b.w);
    } else if (a._mode === DrawableBodyMode.Rectange && b._mode === DrawableBodyMode.Rectange) { // Rectangle, Rectangle
      return collideRectRect(a.pos.x, a.pos.y, a.w, a.h, b.pos.x, b.pos.y, b.w, b.h);
    } else if (a._mode === DrawableBodyMode.Rectange && b._mode === DrawableBodyMode.Ellipse) { // Rectangle, Ellipse
      return collideRectCircle(a.pos.x, a.pos.y, a.w, a.h, b.pos.x, b.pos.y, b.w);
    } else if (a._mode === DrawableBodyMode.Ellipse && b._mode === DrawableBodyMode.Rectangle) { // Ellipse, Rectangle
      return collideRectCircle(b.pos.x, b.pos.y, b.w, b.h, a.pos.x, a.pos.y, a.w);
    } else if (a._mode === DrawableBodyMode.Point && b._mode === DrawableBodyMode.Ellipse) { // Point, Ellipse
      return collidePointEllipse(a.pos.x, a.pos.y, b.pos.x, b.pos.y, b.w, b.h);
    } else if (a._mode === DrawableBodyMode.Ellipse && b._mode === DrawableBodyMode.Point) { // Ellipse, Point
      return collidePointEllipse(b.pos.x, b.pos.y, a.pos.x, a.pos.y, a.w, a.h);
    } else if (a._mode === DrawableBodyMode.Point && b._mode === DrawableBodyMode.Rectangle) { // Point, Rectangle
      return collidePointRect(a.pos.x, a.pos.y, b.pos.x, b.pos.y, b.w, b.h);
    } else if (a._mode === DrawableBodyMode.Rectangle && b._mode === DrawableBodyMode.Point) { // Rectangle, Point
      return collidePointRect(b.pos.x, b.pos.y, a.pos.x, a.pos.y, a.w, a.h);
    } else {
      console.warn(`collision(): Unable to determine colission between ${a} and ${b}`);
      return false;
    }
  }
}