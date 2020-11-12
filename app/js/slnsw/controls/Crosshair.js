/**
 * @project DXLAB Poetry In Motion
 * @author @axjxwright / http://axinteractive.com.au
 */

import * as THREE from "../../lib/three.module.js";
import { NinePatchShader } from "../shaders/NinePatchShader.js";

class Crosshair extends THREE.Object3D
{
    constructor()
    {
        super();

        this.targetPage = null;

        let tex = new THREE.Texture(),
            img = new Image();

        img.onload      = ()=> { tex.needsUpdate = true; };
        img.src         = "img/crosshair.png";
        tex.image       = img;
        tex.minFilter   = THREE.LinearFilter;
        tex.magFilter   = THREE.LinearFilter;

        this.shader = NinePatchShader;
        this.shader.uniforms["tDiffuse"].value = tex;
        this.shader.uniforms["size"].value = [1, 1];
        this.shader.uniforms["cornerRadius"].value = 32.0;
        this.shader.side = THREE.BackSide;
        this.shader.transparent = true;

        let geom = new THREE.PlaneBufferGeometry ( 1, 1 );
        let mat = new THREE.ShaderMaterial( this.shader );

        this.clock = new THREE.Clock();
        this.mesh = new THREE.Mesh( geom, mat );
        let self = this;

        this.frustumCulled = false;
        this.add ( this.mesh );
    }

    setThemeColor ( color )
    {
        this.shader.uniforms["color"].value = new THREE.Color(color);
    }

    update( zoom, camera )
    {
        if ( this.targetPage != null )
        {
            let pulse = Math.sin ( this.clock.getElapsedTime() * 6.0 ) * 0.5 + 0.5;
            pulse = THREE.Math.lerp ( 0.9, 1.1, pulse );

            let c = new THREE.Vector3();
            let b = this.targetPage.getBoxAtZoom(zoom, camera);
            b.getCenter(c);

            let s = new THREE.Vector3();
            b.getSize(s);

            let margin = 0.1 * pulse * 2;
            
            this.position.lerp(c, 0.1);
            this.mesh.scale.lerp( new THREE.Vector3 ( s.x + margin, s.y + margin, 1 ), 0.1 );
            this.shader.uniforms["size"].value = [this.mesh.scale.x, this.mesh.scale.y];
        }

    };
}

export { Crosshair };