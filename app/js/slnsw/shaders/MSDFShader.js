/**
 * @project DXLAB Poetry In Motion
 * @author @axjxwright / http://axinteractive.com.au
 */
 
import { Texture, Color } from "../../lib/three.module.js"

function CreateMSDFShader ( opt ) 
{
    opt = opt || {};
    let opacity   = typeof opt.opacity === 'number' ? opt.opacity : 1;
    let alphaTest = typeof opt.alphaTest === 'number' ? opt.alphaTest : 0.0001;
    let precision = opt.precision || 'highp';
    let color     = opt.color;
    let map       = opt.map;
    let negate    = typeof opt.negate === 'boolean' ? opt.negate : true;

    // remove to satisfy r73
    delete opt.map;
    delete opt.color;
    delete opt.precision;
    delete opt.opacity;
    delete opt.negate;

    return Object.assign (
    {
        uniforms: 
        {
            opacity: { type: 'f', value: opacity },
            map: { type: 't', value: map || new Texture() },
            color: { type: 'c', value: new Color(color) }
        },

        vertexShader: 
        [
            'varying vec2 vUv;',
            'void main() {',
            'vUv = uv;',
            'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);',
            '}'
        ].join('\n'),

        fragmentShader: 
        [
            '#ifdef GL_OES_standard_derivatives',
            '#extension GL_OES_standard_derivatives : enable',
            '#endif',
            'precision ' + precision + ' float;',
            'uniform float opacity;',
            'uniform vec3 color;',
            'uniform sampler2D map;',
            'varying vec2 vUv;',

            'float median(float r, float g, float b) {',
            '  return max(min(r, g), min(max(r, g), b));',
            '}',

            'void main() {',
            '  vec3 sample = ' + (negate ? '1.0 - ' : '') + 'texture2D(map, vUv).rgb;',
            '  float sigDist = median(sample.r, sample.g, sample.b) - 0.5;',
            '  float alpha = clamp(sigDist/fwidth(sigDist) + 0.5, 0.0, 1.0);',
            '  gl_FragColor = vec4(color.xyz, alpha * opacity);',
              alphaTest === 0 ? '' : '  if (gl_FragColor.a < ' + alphaTest + ') discard;',
            '}'
        ].join('\n')
        
    }, opt);
};

export { CreateMSDFShader };
