
  uniform float uCurlAmount;
  uniform float uCurlTightness;
  uniform float uCurlOrigin;
  uniform float uCurlOriginEdge;
  uniform float uAspect;

  vec3 applyCurl(vec2 p) {
    float width = uAspect;
    float height = 1.0;
    float PI = 3.14159265359;
    float apexX = (uCurlOriginEdge > 0.5) ? (width * 0.5) : (-width * 0.5);
    float apexY = mix(height * 0.5, -height * 0.5, uCurlOrigin);
    float t = uCurlOrigin;
    float amountAbs = abs(uCurlAmount);
    float thetaFlat = PI * 0.5;
    float thetaTight = 0.05 + 0.2 * (1.0 - uCurlTightness);
    float theta = mix(thetaFlat, thetaTight, amountAbs);
    float sinTheta = max(sin(theta), 0.001);
    float viX_t = apexX - p.x;
    float viY_t = apexY - p.y;
    float R_t = max(sqrt(viX_t * viX_t + viY_t * viY_t), 0.0001);
    float r_t = R_t * sin(theta);
    float beta_t = asin(clamp(viX_t / R_t, -1.0, 1.0)) / sinTheta;
    vec3 curledTop = vec3(apexX - r_t * sin(beta_t), apexY - (R_t - r_t * (1.0 - cos(beta_t)) * sin(theta)), (uCurlAmount >= 0.0) ? -r_t * (1.0 - cos(beta_t)) * cos(theta) : r_t * (1.0 - cos(beta_t)) * cos(theta));
    float viX_b = p.x - apexX;
    float viY_b = p.y - apexY;
    float R_b = max(sqrt(viX_b * viX_b + viY_b * viY_b), 0.0001);
    float r_b = R_b * sin(theta);
    float beta_b = asin(clamp(viX_b / R_b, -1.0, 1.0)) / sinTheta;
    vec3 curledBot = vec3(apexX + r_b * sin(beta_b), apexY + (R_b - r_b * (1.0 - cos(beta_b)) * sin(theta)), (uCurlAmount >= 0.0) ? -r_b * (1.0 - cos(beta_b)) * cos(theta) : r_b * (1.0 - cos(beta_b)) * cos(theta));
    vec3 curled = mix(curledTop, curledBot, t);
    float R = mix(R_t, R_b, t);
    float maxDist = sqrt(width * width + height * height);
    float distFactor = smoothstep(0.0, maxDist * 0.6, R);
    float amountAtVertex = amountAbs * (0.5 + 0.5 * distFactor);
    return mix(vec3(p, 0.0), curled, min(1.0, amountAtVertex));
  }

  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec2 p = position.xy;
    vec3 pos = applyCurl(p);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
