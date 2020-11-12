/**
 * @project DXLAB Poetry In Motion
 * @author @axjxwright / http://axinteractive.com.au
 */
 
let NinePatchShader = 
{
    uniforms: 
    {
        "tDiffuse": { value: null },
        "size" : { value : [0, 0] },
        "cornerRadius" : { value : 0 },
        "color" : { value : [ 1, 1, 1 ] }
    },

    vertexShader: 
    [
        "varying vec2 vUv;",
        "void main() {",

        "	vUv = uv;",
        "	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

        "}"

    ].join( "\n" ),

    fragmentShader: 
    [
        "uniform sampler2D tDiffuse;",
        "uniform vec2 size;",
        "uniform float cornerRadius;",
        "uniform vec3 color;",

        "varying vec2 vUv;",

        "float Map ( float value, float originalMin, float originalMax, float newMin, float newMax ) ",
        "{",
        "    return ( value - originalMin ) / ( originalMax - originalMin ) * ( newMax - newMin ) + newMin;",
        "} ",
        "",
        "float ProcessAxis ( float coord, float textureBorder, float windowBorder, out vec4 color ) ",
        "{",
        "    if ( coord < windowBorder )",
        "    {",
        "        color = vec4 ( 1, 0, 0, 1 );",
        "        return Map ( coord, 0.0, windowBorder, 0.0, textureBorder );",
        "    }",
        "",
        "    if ( coord < 1.0 - windowBorder )",
        "    { ",
        "        color = vec4 ( 0, 1, 0, 1 );",
        "        return Map ( coord,  windowBorder, 1.0 - windowBorder, textureBorder, 1.0 - textureBorder );",
        "    }",
        "",
        "    color = vec4 ( 0, 0, 1, 1 );",
        "    return Map ( coord, 1.0 - windowBorder, 1.0, 1.0 - textureBorder, 1.0 );",
        "} ",
        "",
        "void main ( )",
        "{",
        "    vec2 borders = vec2 ( cornerRadius ) / (size * 256.0); // uSize.xx?",
        "",
        "    vec4 color0;",
        "    vec4 color1;",
        "",
        "    vec2 newUV = vec2 ",
        "    (",
        "        ProcessAxis ( vUv.x, cornerRadius / 256.0, borders.x, color0 ),",
        "        ProcessAxis ( vUv.y, cornerRadius / 256.0, borders.y, color1 )",
        "    );",
        "    ",
        "    gl_FragColor = texture2D ( tDiffuse, newUV );",
        "    gl_FragColor.rgb *= color;",
        "}",

    ].join( "\n" )
};

export { NinePatchShader };