/**
 * @project DXLAB Poetry In Motion
 * @author @axjxwright / http://axinteractive.com.au
 */

import { SceneLayer } from "./SceneLayer.js";
import * as THREE from "../../lib/three.module.js"
import { Object3D } from "../../lib/three.module.js";
import { TextSpline } from "./TextSpline.js"

class ArtPhaseSceneLayer extends SceneLayer
{
    constructor ( camera )
    {
        super( "ArtPhaseSceneLayer" );

        this.camera = camera;

        this.holder = new Object3D();
        this.holder.add( this.spiral = new TextSpline());
        this.spiralDistanceMin = 1.0;
        
        this.add(this.holder);
        
    }

    initGUI ( gui )
    {
        let folder = super.initGUI( gui );
        folder.add( this, "visibility", 0.0, 1.0, 0.01 ).listen();
        folder.add( this, "spiralDistanceMin", 0.2, 3.0, 0.01 ).listen();
        
        return folder;
    }

    setThemeColor ( color )
    {
        this.spiral.setThemeColor ( color );
    }

    update ()
    {
        super.update();
        this.spiral.update();
        const kSpeed = 0.01;

        this.camera.position.lerp ( this.spiral.targetCameraPos, kSpeed );
        this.camera.quaternion.slerp ( this.spiral.targetCameraQuat, kSpeed );
    }

    onVisibilityChanged ()
    {
        let s = THREE.Math.lerp( 3.0, this.spiralDistanceMin, this.visibility );
        this.spiral.distance = s;
    }
}

export { ArtPhaseSceneLayer };