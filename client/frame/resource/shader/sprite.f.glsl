uniform sampler2D sampler;
uniform mediump float tex_ratio;

varying mediump vec2 _tex_coord;

void main(void) {
    mediump vec4 color = texture2D(sampler, _tex_coord * tex_ratio);
    if (color.a < 0.01) discard;
    gl_FragColor = color;
}
