/**
 * @project DXLAB Poetry In Motion
 * @author @axjxwright / http://axinteractive.com.au
 */

import * as THREE from "../../lib/three.module.js"
import { ShaderPass } from "../../lib/postprocessing/ShaderPass.js"
import { HorizontalRadialBlurShader, VerticalRadialBlurShader } from "../shaders/RadialTiltShiftShaders.js"

class MultiPassRadialEdgeBlur
{
    constructor ( composer, gui, passes = 3 )
    {
        this.composer = composer;

        this.hBlur = new ShaderPass( HorizontalRadialBlurShader );
        this.hBlur.uniforms.h.value = (1 / window.innerHeight);
        this.vBlur = new ShaderPass( VerticalRadialBlurShader );
        this.vBlur.uniforms.v.value = (1 / window.innerWidth);

        for ( var i = 0; i < passes; i++ )
        {
            this.composer.addPass( this.hBlur );
            this.composer.addPass( this.vBlur );
        }

        if ( gui != null )
        {
            var folder = gui.addFolder( "MultiPassRadialEdgeBlur_" + parseInt( Math.random() * 999 ) );
            folder.add( this.hBlur.uniforms.innerRadius, "value", 0.0, 2.0, 0.01 ).name( "Inner Radius" ).onChange( ( value ) => this.vBlur.uniforms.innerRadius.value = value ).listen();
            folder.add( this.hBlur.uniforms.outerRadius, "value", 0.0, 2.0, 0.01 ).name( "Outer Radius" ).onChange( ( value ) => this.vBlur.uniforms.outerRadius.value = value ).listen();
        }
    }

    setBlur ( inner, outer, damping = 1 )
    {
        this.hBlur.uniforms["innerRadius"].value = THREE.MathUtils.lerp(this.hBlur.uniforms["innerRadius"].value, inner, damping);
        this.hBlur.uniforms["outerRadius"].value = THREE.MathUtils.lerp(this.hBlur.uniforms["outerRadius"].value, outer, damping);

        this.vBlur.uniforms["innerRadius"].value = THREE.MathUtils.lerp(this.vBlur.uniforms["innerRadius"].value, inner, damping);
        this.vBlur.uniforms["outerRadius"].value = THREE.MathUtils.lerp(this.vBlur.uniforms["outerRadius"].value, outer, damping);
    }

}

export { MultiPassRadialEdgeBlur };