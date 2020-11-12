/**
 * @project DXLAB Poetry In Motion
 * @author @axjxwright / http://axinteractive.com.au
 */

let RampShader = 
{
	uniforms: 
	{
		"tDiffuse1": { value: null },
		"tDiffuse2": { value: null },
		"innerRadius": { value: 0.0 },
		"outerRadius": { value: 1.0 },
		"rampPower": { value: 1.0 }
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
        "uniform float innerRadius;",
		"uniform float outerRadius;",
		"uniform float opacity;",
		"uniform float rampPower;",

		"uniform sampler2D tDiffuse1;",
		"uniform sampler2D tDiffuse2;",

		"varying vec2 vUv;",

		"void main() {",

        "  vec2 uv = vUv * 2.0 - 1.0;",
		"  float d = smoothstep ( innerRadius, outerRadius, length(uv) );",
		"  vec4 a = texture2D(tDiffuse1, vUv);",
		"  vec4 b = texture2D(tDiffuse2, vUv);",

		"  gl_FragColor = mix(a, b, d);",
        "}"
    
	].join( "\n" )
};

export { RampShader };
