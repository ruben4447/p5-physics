// An edge is a boundary of a world/area
export const EdgeMode = Object.freeze({
  None: 0, // Ignore edge
  Hold: 1, // Hold body at edge
  Wrap: 2, // Wrap body to other edge
  Bounce: 3, // Bounds body off of edge
});

// DrawableBody modes
export const DrawableBodyMode = Object.freeze({
  Point: 1, // Single point with no width or height
  Ellipse: 2,
  Rectangle: 3,
  Path: 4, // Draw using points in this.path attribute
});