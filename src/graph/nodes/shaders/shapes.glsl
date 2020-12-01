// most of these come from this excellent post:
// https://iquilezles.org/www/articles/distfunctions2d/distfunctions2d.htm

float opRound(in float d, in float r) {
    return d - r;
}

float opOnion(in float d, in float r) {
    return abs(d) - r;
}

float sdCircle(in vec2 p, in float r ) {
    return length(p) - r;
}

float sdEquilateralTriangle(in vec2 p, in float r) {
    const float k = sqrt(3.0);
    p.x = abs(p.x) - r;
    p.y = p.y + (r + 0.5) / k;
    if (p.x + k * p.y > 0.0) {
        p = vec2(p.x-k*p.y,-k*p.x-p.y) / 2.0;
    }
    p.x -= clamp(p.x, -2.0 * r, 0.0);
    return -length(p) * sign(p.y);
}

float sdPentagon(in vec2 p, in float r) {
    const vec3 k = vec3(0.809016994, 0.587785252, 0.726542528);
    p.y = -(p.y + 0.1) * 1.175;
    p.x = abs(p.x) * 1.175;
    p -= 2.0 * min(dot(vec2(-k.x, k.y), p), 0.0) * vec2(-k.x, k.y);
    p -= 2.0 * min(dot(vec2(k.x, k.y), p), 0.0) * vec2(k.x, k.y);
    p -= vec2(clamp(p.x, -r*k.z, r*k.z), r);
    return length(p) * sign(p.y);
}

float sdOctagon(in vec2 p, in float r) {
    // pi/8: cos, sin, tan.
    const vec3 k = vec3(
        -0.9238795325,   // sqrt(2+sqrt(2))/2
        0.3826834323,   // sqrt(2-sqrt(2))/2
        0.4142135623
    ); // sqrt(2)-1
    // reflections
    p = abs(p);
    p -= 2.0 * min(dot(vec2(k.x,k.y), p), 0.0) * vec2(k.x,k.y);
    p -= 2.0 * min(dot(vec2(-k.x,k.y), p), 0.0) * vec2(-k.x,k.y);
    // Polygon side.
    p -= vec2(clamp(p.x, -k.z*r, k.z*r), r);
    return length(p) * sign(p.y);
}
