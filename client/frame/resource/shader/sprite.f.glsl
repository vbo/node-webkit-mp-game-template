uniform sampler2D sampler;
uniform mediump float tex_size;
uniform mediump float tex_sprite_size;

varying mediump vec2 _tex_coord;
varying mediump vec2 _tex_uv;

void main(void) {
    mediump vec4 color = texture2D(sampler, (
        (_tex_coord + clamp(_tex_uv, 0.0001, 0.9999)) * tex_sprite_size
    ) / tex_size);
    if (color.a < 0.01) discard;
    gl_FragColor = color;
}

