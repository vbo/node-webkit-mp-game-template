uniform mat4 projection;

attribute vec3 position;
attribute vec2 tex_coord;

varying mediump vec2 _tex_coord;

void main(void) {
    gl_Position = projection * vec4(position, 1.0);
    _tex_coord = tex_coord;
}
