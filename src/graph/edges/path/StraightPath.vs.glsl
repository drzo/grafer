#version 300 es

layout(location=0) in vec3 aVertex;
layout(location=1) in uint iPointA;
layout(location=2) in uint iPointB;
layout(location=3) in uint iColorA;
layout(location=4) in uint iColorB;
layout(location=5) in vec2 iColorMix;

uniform mat4 uViewMatrix;
uniform mat4 uSceneMatrix;
uniform mat4 uProjectionMatrix;
uniform vec2 uViewportSize;
uniform float uPixelRatio;
uniform sampler2D uGraphPoints;
uniform sampler2D uColorPalette;

uniform float uLineWidth;

flat out float fLineWidth;
out vec3 vColor;
out vec2 vProjectedPosition;
out float vProjectedW;

#pragma glslify: valueForIndex = require(../../../renderer/shaders/valueForIndex.glsl)

void main() {
    float multA = aVertex.y;
    float multB = 1.0 - aVertex.y;

    mat4 renderMatrix = uProjectionMatrix * uViewMatrix * uSceneMatrix;

    vec3 offsetA = valueForIndex(uGraphPoints, int(iPointA)).xyz;
    vec3 offsetB = valueForIndex(uGraphPoints, int(iPointB)).xyz;

    vec4 aProjected = renderMatrix * vec4(offsetA, 1.0);
    vec2 aScreen = aProjected.xy / aProjected.w * uViewportSize * 0.5;

    vec4 bProjected = renderMatrix * vec4(offsetB, 1.0);
    vec2 bScreen = bProjected.xy / bProjected.w * uViewportSize * 0.5;

    vec2 direction = normalize(bScreen - aScreen);
    vec2 perp = vec2(-direction.y, direction.x);

    fLineWidth = uLineWidth * uPixelRatio;
    float offsetWidth = fLineWidth + 0.5;
    vec4 position = aProjected * multA + bProjected * multB;
    vec4 offset = vec4(((aVertex.x * perp * offsetWidth) / uViewportSize) * position.w, 0.0, 0.0);
    gl_Position = position + offset;

    vProjectedPosition = position.xy;
    vProjectedW = position.w;

    // calculate the color
    vec4 colorA = valueForIndex(uColorPalette, int(iColorA));
    vec4 colorB = valueForIndex(uColorPalette, int(iColorB));
    vec3 mixColorA = mix(colorA.rgb, colorB.rgb, iColorMix[1]);
    vec3 mixColorB = mix(colorA.rgb, colorB.rgb, iColorMix[0]);
    vColor = mixColorA.rgb * multB + mixColorB.rgb * multA;
}