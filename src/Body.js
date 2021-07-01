import { DrawableBodyMode, EdgeMode } from "./enums.js";

var __body_id = 0;

/** Base class for a body */
export class Body {
  constructor(x, y, w = 0, h = 0) {
    this._id = __body_id++;
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this._w = w;
    this._h = h;
    this._mass = 1;
    this._cr = 1; // Coefficient of restitution. 1 = perfectly elastic.
    this.μ = 0; // Roughness - coefficient of friction. 0 = smooth.

    this._world = null;
    this.static = false; // Apply physics to said body?
    this.solid = true; // Can we collide with this Body?

    this.cbOnUpdate = () => true; // If returns false, update will halt
    this.cbOnApply = f => f; // NOTE - called before force is applied
  }

  get ID() { return this._id; }
  get w() { return this._w; } // SHORTHAND
  get h() { return this._h; } // SHORTHAND

  /** Get/Set width */
  width(value = undefined) {
    if (typeof value === 'number') {
      this._w = value;
      return this;
    }
    return this._w;
  }

  /** Get/Set height */
  height(value = undefined) {
    if (typeof value === 'number') {
      this._h = value;
      return this;
    }
    return this._h;
  }

  /** Get/set mass */
  mass(value = undefined) {
    if (typeof value === 'number') {
      this._mass = value;
      return this;
    }
    return this._mass;
  }

  /** Get/Set value for coefficient of restitution - will be used in collisions */
  coefficientOfRestitution(val = undefined) {
    if (val === undefined) return this._cr;
    if (val < 0) val = 0;
    else if (val > 1 || !isFinite(val) || isNaN(val)) val = 1;
    this._cr = val;
    return this;
  }

  /** Get/Set value for coefficient of friction */
  coefficientOfFriction(val = undefined) {
    if (val === undefined) return this.μ;
    if (val < 0) val = 0;
    else if (val > 1 || !isFinite(val) || isNaN(val)) val = 1;
    this.μ = val;
    return this;
  }

  /* Apply physics to said particle */
  update() {
    if (!this.static || this.cbOnUpdate() === false) {
      this.vel.add(this.acc); // Apply acceleration - change of velocity
      this.pos.add(this.vel); // Apply velocity - change of position
      this.acc.set(0, 0); // Cancel acceleration
      return true;
    }
    return false;
  }

  /**
   * Apply force to said particle, using F = ma
   * @param force P5 vector
   */
  applyForce(force) {
    if (!this.static) {
      let f = p5.Vector.div(force, this._mass);
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

  /** Given a body, calculate the response friction force to apply to said body */
  friction(body) {
    // Fr = -1 * μ * N * norm(i)
    let Fr = body.vel.copy().normalize().setMag(-1 * this.μ * body.mass());
    return Fr;
  }

  /** <a, b> have collided... what now? */
  static collide(a, b) {
    if (a.solid && b.solid) {
      // For static bodies: disregard mass
      if (a.static) {
        b.vel.mult(-b.coefficientOfRestitution());
        return;
      } else if (b.static) {
        console.log("Static!");
        a.vel.mult(-a.coefficientOfRestitution());
        return;
      }

      const a_m = a.mass(), b_m = b.mass();
      const a_mu = a.vel.copy().mult(a_m); // a: mass * velocity
      const b_mu = b.vel.copy().mult(b_m); // a: mass * velocity

      // v(a) = [Cr * m(b) * [u(b) - u(a)] + m(a) * u(a) + m(b) * u(b)] / [m(a) + m(b)]
      let velA = b.vel.copy().sub(a.vel).mult(b_m).mult(a.coefficientOfRestitution()).add(a_mu).add(b_mu).div(a_m + b_m);

      // v(b) = [Cr * m(a) * [u(a) - u(b)] + m(a) * u(a) + m(b) * u(b)] / [m(a) + m(b)]
      let velB = a.vel.copy().sub(b.vel).mult(a_m).mult(b.coefficientOfRestitution()).add(a_mu).add(b_mu).div(a_m + b_m);

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
    this._mode = DrawableBodyMode.Rectangle;
    this._path = []; // If mode=Path :: path to draw
    this._pointMotion = false; // Point shape in direction of motion?
    this._bb = { pos: createVector(NaN, NaN), w: 0, h: 0 }; // BOUNDING BOX
    this._calcBoundingBox();
  }

  /** Calculate bounding box */
  _calcBoundingBox() {
    switch (this._mode) {
      case DrawableBodyMode.Point:
        this._bb.pos = this.pos.copy();
        this._bb.w = 1;
        this._bb.h = 1;
        break;
      case DrawableBodyMode.Ellipse:
        this._bb.pos = createVector(this.pos.x - this._w / 2, this.pos.y - this._h / 2);
        this._bb.w = this._w;
        this._bb.h = this._h;
        break;
      case DrawableBodyMode.Rectangle:
        this._bb.pos = createVector(this.pos.x, this.pos.y);
        this._bb.w = this._w;
        this._bb.h = this._h;
        break;
      case DrawableBodyMode.Triangle:
        this._bb.pos = createVector(this.pos.x - this._w / 2, this.pos.y - this._h / 2);
        this._bb.w = this._w;
        this._bb.h = this._h;
        break;
      case DrawableBodyMode.Path:
        // TODO
        if (this._world === null || this._world.logWarnings) console.warn(`Bounding box support for path not implemented`);
        this._bb.pos = this.pos.copy();
        this._bb.w = 1;
        this._bb.h = 1;
        break;
      default:
        throw new Error(`_calcBoundingBox(): Cannot create bounding box for DrawableBody of mode ${this._mode}`);
    }
  }

  /** Get/Set width */
  width(value = undefined) {
    const v = super.width(value);
    if (typeof value === 'number') this._calcBoundingBox();
    return v;
  }

  /** Get/Set height */
  height(value = undefined) {
    const v = super.height(value);
    if (typeof value === 'number') this._calcBoundingBox();
    return v;
  }

  /** Set drawing mode */
  setDrawMode(mode) {
    this._mode = mode;
    this._calcBoundingBox();
    return this;
  }

  /** Set _pointMotion */
  pointInDirectionOfMotion(bool) {
    this._pointDir = !!bool;
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

  /** Set draw mode to Path */
  setPolygon(...vertices) {
    this._mode = DrawableBodyMode.Path;
    if (vertices[0] !== null) {
      this._path = vertices;
      this._calcBoundingBox();
    }
    return this;
  }

  update() {
    const a = super.update();
    if (a) this._calcBoundingBox();
  }

  show() {
    if (this._stroke === null) noStroke(); else stroke(this._stroke);
    if (this._fill === null) noFill(); else fill(this._fill);

    switch (this._mode) {
      case DrawableBodyMode.Point:
        point(this.pos.x, this.pos.y);
        break;
      case DrawableBodyMode.Ellipse:
        ellipse(this.pos.x, this.pos.y, this._w, this._h);
        break;
      case DrawableBodyMode.Rectangle:
        rect(this.pos.x, this.pos.y, this._w, this._h);
        break;
      case DrawableBodyMode.Path:
        beginShape();
        this._path.forEach(p => vertex(...p));
        endShape();
        break;
      case DrawableBodyMode.Triangle: {
        let w2 = this._w / 2, h2 = this._h / 2;
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

    if (this._world && this._world.debug) {
      // Bounding Box
      noFill();
      stroke(0, 0, 250);
      rect(this._bb.pos.x, this._bb.pos.y, this._bb.w, this._bb.h);
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
    } else if (a._mode === DrawableBodyMode.Rectangle && b._mode === DrawableBodyMode.Rectangle) { // Rectangle, Rectangle
      return collideRectRect(a.pos.x, a.pos.y, a.w, a.h, b.pos.x, b.pos.y, b.w, b.h);
    } else if (a._mode === DrawableBodyMode.Rectangle && b._mode === DrawableBodyMode.Ellipse) { // Rectangle, Ellipse
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
      if (a._world.logWarnings || b._world.logWarnings)
        console.warn(`collision(): Unable to determine colission between ${a} (${a._mode}) and ${b} (${b._mode})`);
      return false;
    }
  }
}