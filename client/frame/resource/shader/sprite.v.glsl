uniform mat4 projection;

attribute vec3 position;
attribute vec4 tex_coord;

varying mediump vec2 _tex_coord;
varying mediump vec2 _tex_uv;

void main(void) {
    gl_Position = projection * vec4(position, 1.0);
    _tex_coord = tex_coord.st;
    _tex_uv = tex_coord.pq;
}

