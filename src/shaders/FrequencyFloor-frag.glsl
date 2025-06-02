precision mediump float;
uniform sampler2D uSprite;
varying vec3 vColor;
varying float vOpacity;

void main() {
  vec4 sprite = texture2D(uSprite, gl_PointCoord);
  if (sprite.a < 0.01) discard;
  gl_FragColor = vec4(vColor, vOpacity) * sprite;
}