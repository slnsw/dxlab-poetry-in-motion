/**
 * @project DXLAB Poetry In Motion
 * @author @axjxwright / http://axinteractive.com.au
 */

import { SceneLayer } from "./SceneLayer.js";
import { DocumentGrid } from "../DocumentGrid.js";
import { FontLoader } from "../FontLoader.js";
import { Math, Vector2, MathUtils } from "../../lib/three.module.js";
import { Crosshair } from "../controls/Crosshair.js";

class DocumentGridSceneLayer extends SceneLayer
{
    constructor ( camera, pageData, events )
    {
        super ( "DocumentGridSceneLayer" );
        this.camera = camera;
        this.font = FontLoader.kDefaultFont;
        this.blur = null;
        this.letterOffset = 0;
        this.frames = 0;
        this.events = events;
        
        this.grid = new DocumentGrid ( this.font, pageData );
        this.grid.spiral = this.spiral;
        this.add(this.grid);
        this.add(this.crosshair = new Crosshair());
        this.events.attach ( this.crosshair );

        this.grid.pages.forEach(element => 
        {
            this.add ( element.metaMesh );
        });
    }

    initGUI ( gui )
    {
        let folder = super.initGUI ( gui );
        folder.add(this, "visibility", 0.0, 1.0, 0.01).listen();
        return folder;
    }

    setThemeColor ( color )
    {
        this.grid.setThemeColor ( color );
        this.crosshair.setThemeColor ( color );
    }

    update ( ) 
    {
        super.update ( );
        if ( this.grid && this.crosshair )
        {
            this.grid.update();
            this.crosshair.update ( this.grid.zoom, this.camera );

            let oldPage = this.crosshair.targetPage;
            if ( this.visibility > 0.7 || oldPage == null )
            {
                this.crosshair.targetPage = this.grid.getClosestToCenterInCamera(this.camera);
            }
            this.grid.pages.forEach ( page => { page.setMetaAlphaForZoom ( this.crosshair.targetPage, this.grid.zoom ); } ); 
            
            if ( this.crosshair.targetPage )
            {
                var pos = this.crosshair.position.clone();
                pos.x += 1.0;
                pos.y += this.crosshair.mesh.scale.y / 2.0;
                pos.y += 0.1;

                this.crosshair.targetPage.metaMesh.position.lerp ( pos, 0.1 );
            }

            if ( oldPage && this.crosshair.targetPage.id !== oldPage.id )
            {
                this.letterOffset = 0;
            }

            if ( this.frames++ % 12 == 0 )
            {
                let letter = this.crosshair.targetPage.getLetterAt ( this.letterOffset++ );
                this.spiral.addLetter ( letter );
            }

            if ( this.grid.zoom < 0.05 ) 
            {
                this.blur.setBlur(0.7, 1.6, 0.1);
            }else if ( this.grid.zoom < 0.2 )
            {
                let t = MathUtils.mapLinear(this.grid.zoom, 0.05, 0.2, 0.0, 1.0);
                let i = MathUtils.lerp(0.7, 0.2, t);
                let o = MathUtils.lerp(1.6, 1.4, t);
                this.blur.setBlur(i, o, 0.1);
            }else
            {
                let t = MathUtils.mapLinear(this.grid.zoom, 0.2, 1.0, 0.0, 1.0);
                let i = MathUtils.lerp(0.2, 0.0, t);
                let o = MathUtils.lerp(1.4, 0.42, t);
                this.blur.setBlur(i, o, 0.1);
            }
        }
    }

    pan ( deltaX, deltaY )
    {
        let delta = new Vector2(deltaX, deltaY);
        delta.multiplyScalar( -0.15 );
        this.grid.panBy( delta );
    }

    zoom ( multiplier )
    {
        this.grid.zoomByMultiplier ( multiplier );
    }

    onScroll ( delta )
    {
        this.grid.zoomByDelta ( delta );
    }

    onVisibilityChanged ( )
    {
        this.position.z = Math.lerp ( -4.0, 0.0, this.visibility );
        if ( this.grid ) this.grid.opacity = Math.lerp ( 0.0, 1.0, this.visibility );
    }
}

export { DocumentGridSceneLayer };