/**
 * @project DXLAB Poetry In Motion
 * @author @axjxwright / http://axinteractive.com.au
 */

import { DocumentGridSceneLayer } from "./DocumentGridSceneLayer.js";
import { ArtPhaseSceneLayer } from "./ArtPhaseSceneLayer.js";
import { EventsControls } from "../../lib/controls/EventsControls.js"
import { EasingFunctions } from "../Utils.js"
import * as THREE from "../../lib/three.module.js"

class SceneManager
{
    constructor( scene, camera, gui, pageData, domElement )
    {
        this.targetCrossfade = 0;
        this.events = new EventsControls( camera, domElement );
        this.events.attachEvent( 'mouseOver', function () 
        {
            this.container.style.cursor = 'pointer';
        });

        this.events.attachEvent( 'mouseOut', function () 
        {
            this.container.style.cursor = 'auto';
        });

        this.name = "SceneManager";

        this.documentLayer = new DocumentGridSceneLayer(camera, pageData, this.events);
        this.artPhaseLayer = new ArtPhaseSceneLayer(camera);

        this.documentLayer.spiral = this.artPhaseLayer.spiral;
        
        this._crossfade = 0.0;
        this.initGUI ( gui );

        this.crossfade = 1;
    }

    initGUI ( gui )
    {
        if ( !gui ) return;
        
        var folder = gui.addFolder ( this.name );
        folder.add ( this, "crossfade", 0.0, 1.0, 0.01 );
        this.documentLayer.initGUI ( folder );
        this.artPhaseLayer.initGUI ( folder );
    }

    pan ( deltaX, deltaY )
    {
        this.activeLayer.pan ( deltaX, deltaY );
    }

    zoom ( multiplier )
    {
        this.activeLayer.zoom ( multiplier );
    }

    onPointerDown ( position )
    {
        this.activeLayer.onPointerDown ( position );
    }

    onPointerDrag ( position )
    {
        if ( this.activeLayer.dragging )
        {
            this.activeLayer.onPointerDrag( position );
        }
    }

    onPointerUp ( position )
    {
        this.activeLayer.onPointerUp ( position );
    }

    onScroll ( delta )
    {
        this.activeLayer.onScroll ( delta );
    }

    onClick ( event )
    {
        return this.activeLayer.onClick(event);
    }

    onDoubleTap ( event )
    {
        if ( this.activeLayer == this.artPhaseLayer )
        {
            this.targetCrossfade = 0.0;
        }else
        {
            this.targetCrossfade = 1.0;
        }
    }

    get activeLayer ( )
    {
        return this.crossfade > 0.5 ? this.artPhaseLayer : this.documentLayer;
    }

    update ( )
    {
        this.crossfade = THREE.MathUtils.lerp ( this.crossfade, this.targetCrossfade, 0.025 );
        this.events.update ( );
        this.documentLayer.update ( );
        this.artPhaseLayer.update ( );
    }

    set crossfade ( v )
    {
        this._crossfade = v;

        v = EasingFunctions.easeInOutQuint ( v );

        this.documentLayer.visibility = 1.0 - v;
        this.artPhaseLayer.visibility = v;
    }

    get crossfade ( ) { return this._crossfade; };
}

export { SceneManager };