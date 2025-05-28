uniform float uPointSize;
attribute float aOpacity;
varying float vOpacity;
varying vec3  vColor;

void main() {
  vColor   = color;
  vOpacity = aOpacity;

  // bring into view space:
  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPos;

  // simple perspective scale: adjust the 300.0 to taste
  float scale = 300.0 / -mvPos.z;
  gl_PointSize = uPointSize * scale;
}