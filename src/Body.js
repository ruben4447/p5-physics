import { DrawableBodyMode, EdgeMode } from "./enums.js";

var __body_id = 0;

/** Base class for a body */
export class Body {
  constructor(x, y, w = 0, h = 0) {
    this._id = __body_id++;
    this._pos = createVector(x, y);
    this._vel = createVector(0, 0);
    this._acc = createVector(0, 0);
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
    this.cbChangePos = () => { };
    this.cbChangeVel = () => { };
    this.cbChangeAcc = () => { };
  }

  get ID() { return this._id; }
  get w() { return this._w; } // SHORTHAND
  get h() { return this._h; } // SHORTHAND

  /** Get/Set position vector (sets/returns a copy) */
  pos(vector = undefined) {
    if (vector === undefined) return this._pos.copy();
    this._pos = vector.copy();
    this.cbChangePos();
    return this;
  }

  posX(x = undefined) {
    if (x === undefined) return this._pos.x;
    this._pos.x = +x;
    this.cbChangePos();
    return this;
  }

  posY(y = undefined) {
    if (y === undefined) return this._pos.y;
    this._pos.y = +y;
    this.cbChangePos();
    return this;
  }

  /** Get/Set velocity vector (sets/returns a copy) */
  vel(vector = undefined) {
    if (vector === undefined) return this._vel.copy();
    this._vel = vector.copy();
    this.cbChangeVel();
    return this;
  }

  velX(x = undefined) {
    if (x === undefined) return this._vel.x;
    this._vel.x = +x;
    this.cbChangeVel();
    return this;
  }

  velY(y = undefined) {
    if (y === undefined) return this._vel.y;
    this._vel.y = +y;
    this.cbChangeVel();
    return this;
  }

  /** Get/Set acceleration vector (sets/returns a copy) */
  acc(vector = undefined) {
    if (vector === undefined) return this._acc.copy();
    this._acc = vector.copy();
    return this;
  }

  accX(x = undefined) {
    if (x === undefined) return this._acc.x;
    this._acc.x = +x;
    this.cbChangeAcc();
    return this;
  }

  accY(y = undefined) {
    if (y === undefined) return this._acc.y;
    this._acc.y = +y;
    this.cbChangeAcc();
    return this;
  }

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
      this.vel(this.vel().add(this.acc())); // Apply acceleration - change of velocity
      this.pos(this.pos().add(this.vel())); // Apply velocity - change of position
      this.acc(createVector(0, 0));
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
      this.acc(this.acc().add(f));
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
        if (this.posX() < W.x) this.posX(W.x);
        if (this.posX() > W.x + W.w) this.posX(W.x + W.w);
        if (this.posY() < W.y) this.posY(W.y);
        if (this.posY() > W.y + W.h) this.posY(W.y + W.h);
        break;
      case EdgeMode.Wrap:
        if (this.posX() < W.x) this.posX(W.x + W.w);
        else if (this.posX() > W.x + W.w) this.posX(W.x);
        if (this.posY() < W.y) this.posY(W.y + W.h);
        else if (this.posY() > W.y + W.h) this.posY(W.y);
        break;
      case EdgeMode.Bounce:
        if (this.posX() < W.x) {
          this.posX(W.x);
          this.velX(-this.velX());
        } else if (this.posX() > W.x + W.w) {
          this.posX(W.x + W.w);
          this.velX(-this.velX());
        }
        if (this.posY() < W.y) {
          this.posY(W.y);
          this.velY(-this.velY());
        } else if (this.posY() > W.y + W.h) {
          this.posY(W.y + W.h);
          this.velY(-this.velY());
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
        b.vel(b.vel().mult(-b.coefficientOfRestitution()));
        return;
      } else if (b.static) {
        b.vel(a.vel().mult(-a.coefficientOfRestitution()));
        return;
      }

      const a_m = a.mass(), b_m = b.mass();
      const a_mu = a.vel().mult(a_m); // a: mass * velocity
      const b_mu = b.vel().mult(b_m); // a: mass * velocity

      // v(a) = [Cr * m(b) * [u(b) - u(a)] + m(a) * u(a) + m(b) * u(b)] / [m(a) + m(b)]
      let velA = b.vel().sub(a.vel()).mult(b_m).mult(a.coefficientOfRestitution()).add(a_mu).add(b_mu).div(a_m + b_m);

      // v(b) = [Cr * m(a) * [u(a) - u(b)] + m(a) * u(a) + m(b) * u(b)] / [m(a) + m(b)]
      let velB = a.vel().sub(b.vel()).mult(a_m).mult(b.coefficientOfRestitution()).add(a_mu).add(b_mu).div(a_m + b_m);

      a.vel(velA);
      b.vel(velB);
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
    this._oPath = []; // Path vertices relative to this.pos
    this._path = []; // If mode=Path :: path to draw (relative to this.pos)
    this._pointMotion = false; // Point shape in direction of motion?
    this._bb = { pos: createVector(NaN, NaN), w: 0, h: 0 }; // BOUNDING BOX
    this._calcBoundingBox();

    this.cbChangePos = () => {
      if (this._mode === DrawableBodyMode.Path) {
        this._path = this._oPath.map(v => ([v[0] + this._pos.x, v[1] + this._pos.y]));
      }
    };
  }

  /** Calculate bounding box */
  _calcBoundingBox() {
    switch (this._mode) {
      case DrawableBodyMode.Point:
        this._bb.pos = this.pos();
        this._bb.w = 1;
        this._bb.h = 1;
        break;
      case DrawableBodyMode.Ellipse:
        this._bb.pos = createVector(this.posX() - this._w / 2, this.posY() - this._h / 2);
        this._bb.w = this._w;
        this._bb.h = this._h;
        break;
      case DrawableBodyMode.Rectangle:
        this._bb.pos = this.pos();
        this._bb.w = this._w;
        this._bb.h = this._h;
        break;
      case DrawableBodyMode.Path: {
        let topleft = [Infinity, Infinity], bottomright = [-Infinity, -Infinity];
        for (let vertex of this._path) {
          if (vertex[0] < topleft[0]) topleft[0] = vertex[0];
          if (vertex[1] < topleft[1]) topleft[1] = vertex[1];
          if (vertex[0] > bottomright[0]) bottomright[0] = vertex[0];
          if (vertex[1] > bottomright[1]) bottomright[1] = vertex[1];
        }
        this._bb.pos = createVector(...topleft);
        this._bb.w = bottomright[0] - topleft[0];
        this._bb.h = bottomright[1] - topleft[1];
        break;
      }
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
      this._oPath = vertices.map(v => ([v[0] - this._pos.x, v[1] - this._pos.y]));
      this._calcBoundingBox();
    }
    return this;
  }

  /** Create a triangle */
  setTriangle() {
    const w2 = this._w / 2, h2 = this._h / 2, pos = this.pos();
    return this.setPolygon([pos.x - w2, pos.y - h2], [pos.x - w2, pos.y + h2], [pos.x + w2, pos.y]);
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
        point(this.posX(), this.posY());
        break;
      case DrawableBodyMode.Ellipse:
        ellipse(this.posX(), this.posY(), this._w, this._h);
        break;
      case DrawableBodyMode.Rectangle:
        rect(this.posX(), this.posY(), this._w, this._h);
        break;
      case DrawableBodyMode.Path:
        beginShape();
        this._path.forEach(p => vertex(...p));
        endShape(CLOSE);
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
    let baseCollide = collideRectRect(a._bb.pos.x, a._bb.pos.y, a._bb.w, a._bb.h, b._bb.pos.x, b._bb.pos.y, b._bb.w, b._bb.h);
    if (baseCollide) {
      if (a._mode === DrawableBodyMode.Point && b._mode === DrawableBodyMode.Point) { // Point, Point
        return Math.floor(a._pos.x) === Math.floor(b._pos.x) && Math.floor(a._pos.y) === Math.floor(b._pos.y); // Points must be equal (to nearest pixel)
      } else if (a._mode === DrawableBodyMode.Ellipse && b._mode === DrawableBodyMode.Ellipse) { // Ellipse, Ellipse
        return collideCircleCircle(a._pos.x, a._pos.y, a.w, b._pos.x, b._pos.y, b.w);
      } else if (a._mode === DrawableBodyMode.Rectangle && b._mode === DrawableBodyMode.Rectangle) { // Rectangle, Rectangle
        return collideRectRect(a._pos.x, a._pos.y, a.w, a.h, b._pos.x, b._pos.y, b.w, b.h);
      } else if (a._mode === DrawableBodyMode.Rectangle && b._mode === DrawableBodyMode.Ellipse) { // Rectangle, Ellipse
        return collideRectCircle(a._pos.x, a._pos.y, a.w, a.h, b._pos.x, b._pos.y, b.w);
      } else if (a._mode === DrawableBodyMode.Ellipse && b._mode === DrawableBodyMode.Rectangle) { // Ellipse, Rectangle
        return collideRectCircle(b._pos.x, b._pos.y, b.w, b.h, a._pos.x, a._pos.y, a.w);
      } else if (a._mode === DrawableBodyMode.Point && b._mode === DrawableBodyMode.Ellipse) { // Point, Ellipse
        return collidePointEllipse(a._pos.x, a._pos.y, b._pos.x, b._pos.y, b.w, b.h);
      } else if (a._mode === DrawableBodyMode.Ellipse && b._mode === DrawableBodyMode.Point) { // Ellipse, Point
        return collidePointEllipse(b._pos.x, b._pos.y, a._pos.x, a._pos.y, a.w, a.h);
      } else if (a._mode === DrawableBodyMode.Point && b._mode === DrawableBodyMode.Rectangle) { // Point, Rectangle
        return collidePointRect(a._pos.x, a._pos.y, b._pos.x, b._pos.y, b.w, b.h);
      } else if (a._mode === DrawableBodyMode.Rectangle && b._mode === DrawableBodyMode.Point) { // Rectangle, Point
        return collidePointRect(b._pos.x, b._pos.y, a._pos.x, a._pos.y, a.w, a.h);
      } else if (a._mode === DrawableBodyMode.Point && b._mode === DrawableBodyMode.Path) { // Point, Path
        return collidePointPoly(a._pos.x, a._pos.y, b._path.map(a => createVector(...a)));
      } else if (a._mode === DrawableBodyMode.Path && b._mode === DrawableBodyMode.Point) { // Path, Point
        return collidePointPoly(b._pos.x, b._pos.y, a._path.map(a => createVector(...a)));
      } else if (a._mode === DrawableBodyMode.Ellipse && b._mode === DrawableBodyMode.Path) { // Ellipse, Path
        return collideCirclePoly(a._pos.x, a._pos.y, a.w, b._path.map(a => createVector(...a)), true);
      } else if (a._mode === DrawableBodyMode.Path && b._mode === DrawableBodyMode.Ellipse) { // Path, Ellipse
        return collideCirclePoly(b._pos.x, b._pos.y, b.w, a._path.map(a => createVector(...a)), true);
      } else if (a._mode === DrawableBodyMode.Rectangle && b._mode === DrawableBodyMode.Path) { // Rectangle, Path
        return collideRectPoly(a._pos.x, a._pos.y, a.w, a.h, b._path.map(a => createVector(...a)), true);
      } else if (a._mode === DrawableBodyMode.Path && b._mode === DrawableBodyMode.Rectangle) { // Path, Rectangle
        return collideRectPoly(b._pos.x, b._pos.y, b.w, b.h, a._path.map(a => createVector(...a)), true);
      } else if (a._mode === DrawableBodyMode.Path && b._mode === DrawableBodyMode.Path) { // Path, Path
        return collidePolyPoly(a._path.map(a => createVector(...a)), b._path.map(a => createVector(...a)), true);
      } else {
        if (a._world.logWarnings || b._world.logWarnings)
          console.warn(`collision(): Unable to determine colission between ${a} (${a._mode}) and ${b} (${b._mode})`);
        return false;
      }
    } else {
      return false;
    }
  }
}