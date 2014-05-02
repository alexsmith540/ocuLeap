uniform vec3 color;
uniform sampler2D texture;
varying vec3 vColor;
void main() {
    gl_FragColor = /*outColor * */vec4( color * vColor.xyz, 1.0 );
}