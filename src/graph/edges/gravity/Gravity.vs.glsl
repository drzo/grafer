#version 300 es

layout(location=0) in vec3 aVertex;
layout(location=1) in vec3 iOffsetA;
layout(location=2) in vec3 iOffsetB;
layout(location=3) in uvec3 iColorA;
layout(location=4) in uvec3 iColorB;

uniform mat4 uViewMatrix;
uniform mat4 uSceneMatrix;
uniform mat4 uProjectionMatrix;
uniform vec2 uViewportSize;
uniform float uPixelRatio;
uniform float uGravity;

out vec3 vColor;

void main() {
    float multA = aVertex.x;
    float multB = 1.0 - aVertex.x;

    vColor = (vec3(iColorA) / 255.0) * multA + (vec3(iColorB) / 255.0) * multB;

    vec3 direction = iOffsetB - iOffsetA;
    vec3 middle = iOffsetA + direction * 0.5;
    float distance = length(direction);

    float toCenter = length(middle);
    vec3 towardsCenter = (middle * -1.0) / toCenter;

    vec3 gravity = middle + towardsCenter * min(toCenter, distance * uGravity);
    vec3 position = gravity + pow(multB, 2.0) * (iOffsetB - gravity) + pow(multA, 2.0) * (iOffsetA - gravity);

    mat4 renderMatrix = uProjectionMatrix * uViewMatrix * uSceneMatrix;
    gl_Position = renderMatrix * vec4(position, 1.0);
}