/**
 * @project DXLAB Poetry In Motion
 * @author @axjxwright / http://axinteractive.com.au
 * @author alteredq / http://alteredqualia.com/
 */

const kGetRampFragment = [ "uniform float innerRadius;", 
                         "uniform float outerRadius;", 
                         "float GetRamp() { return smoothstep ( innerRadius, outerRadius, length(vUv * 2.0 - 1.0) ); }"].join("\n");

let VerticalRadialBlurShader = 
{
	uniforms: 
	{
		"tDiffuse": { value: null },
		"v": { value: 1.0 / 512.0 },
        "innerRadius" : { value : 0.7 },
        "outerRadius" : { value : 2.0 },
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
		"uniform float v;",
        "varying vec2 vUv;",
        kGetRampFragment,

		"void main() {",
        "   float r = GetRamp();",
		"	vec4 sum = vec4( 0.0 );",

		"	float vv = v * r; //abs( r - vUv.y );",

		"	sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 4.0 * vv ) ) * 0.051;",
		"	sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 3.0 * vv ) ) * 0.0918;",
		"	sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 2.0 * vv ) ) * 0.12245;",
		"	sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 1.0 * vv ) ) * 0.1531;",
		"	sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;",
		"	sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 1.0 * vv ) ) * 0.1531;",
		"	sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 2.0 * vv ) ) * 0.12245;",
		"	sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 3.0 * vv ) ) * 0.0918;",
		"	sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 4.0 * vv ) ) * 0.051;",

		"	gl_FragColor = sum;",

		"}"

	].join( "\n" )
};

let HorizontalRadialBlurShader = 
{
	uniforms: 
	{
		"tDiffuse": { value: null },
		"h": { value: 1.0 / 512.0 },
		"innerRadius" : { value : 0.7 },
        "outerRadius" : { value : 2.0 }
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
		"uniform float h;",
		
		"varying vec2 vUv;",
		kGetRampFragment,

		"void main() {",
        "   float r = GetRamp();",
		"	vec4 sum = vec4( 0.0 );",

		"	float hh = h * r; //abs( r - vUv.y );",

		"	sum += texture2D( tDiffuse, vec2( vUv.x - 4.0 * hh, vUv.y ) ) * 0.051;",
		"	sum += texture2D( tDiffuse, vec2( vUv.x - 3.0 * hh, vUv.y ) ) * 0.0918;",
		"	sum += texture2D( tDiffuse, vec2( vUv.x - 2.0 * hh, vUv.y ) ) * 0.12245;",
		"	sum += texture2D( tDiffuse, vec2( vUv.x - 1.0 * hh, vUv.y ) ) * 0.1531;",
		"	sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;",
		"	sum += texture2D( tDiffuse, vec2( vUv.x + 1.0 * hh, vUv.y ) ) * 0.1531;",
		"	sum += texture2D( tDiffuse, vec2( vUv.x + 2.0 * hh, vUv.y ) ) * 0.12245;",
		"	sum += texture2D( tDiffuse, vec2( vUv.x + 3.0 * hh, vUv.y ) ) * 0.0918;",
		"	sum += texture2D( tDiffuse, vec2( vUv.x + 4.0 * hh, vUv.y ) ) * 0.051;",

		"	gl_FragColor = sum;",

		"}"

	].join( "\n" )

};

export { HorizontalRadialBlurShader, VerticalRadialBlurShader };
