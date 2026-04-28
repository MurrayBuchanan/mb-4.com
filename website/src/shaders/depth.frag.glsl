
  uniform sampler2D map;
  varying vec2 vUv;

  void main() {
    vec4 texColor = texture2D(map, vUv);
    if (texColor.a < 0.01) discard;
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  }
