varying vec2 vUv;

void main() {
  // float strength = vUv.y;
  float strength = mod(vUv.y * 10.0, 1.0);
  strength = step(0.5, strength);
  gl_FragColor = vec4(vec3(strength), 1.0);
}
