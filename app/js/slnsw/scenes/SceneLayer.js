/**
 * @project DXLAB Poetry In Motion
 * @author @axjxwright / http://axinteractive.com.au
 */

import { Scene, Object3D, MeshBasicMaterial } from "../../lib/three.module.js";

class SceneLayer extends Object3D
{
    constructor(name)
    {
        super();
        this.name = name;
        this._visibility = -1.0; // Force update first frame
        this._time = 0.0;

        this.scene = new Scene();
        this.scene.add(this);        
    }

    initGUI ( gui ) 
    { 
        return gui.addFolder(this.name);
    }

    update ( ) 
    { 
        this._time += 1.0 / 60.0;
    };

    onClick ( event ) { return false; }

    pan ( deltaX, deltaY ) { };
    zoom ( multiplier ) { };
    onScroll ( delta ) { };

    set visibility ( v )
    {
        this._visibility = v;
        this.onVisibilityChanged();
    }

    get visibility ( ) { return this._visibility };
    get time ( ) { return this._time; };

    onVisibilityChanged ( ) { };
}

export { SceneLayer }