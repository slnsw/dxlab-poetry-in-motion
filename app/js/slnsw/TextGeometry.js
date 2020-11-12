/**
 * @project DXLAB Poetry In Motion
 * @author @axjxwright / http://axinteractive.com.au
 */

import * as THREE from "../../js/lib/three.module.js"
import { TextLayout, Buffer } from "./shaping/TextLayout.js"
import { ComputeBoundingBox, ComputeBoundingSphere, CreateQuadIndices } from "./Utils.js"

function GetPagesForGlyphs ( glyphs ) 
{
    var pages = new Float32Array(glyphs.length * 4 * 1);
    var i = 0;
    
    glyphs.forEach ( (glyph) =>
    {
        var id = glyph.data.page || 0;
        pages[i++] = id;
        pages[i++] = id;
        pages[i++] = id;
        pages[i++] = id;
    });

    return pages;
}
  
function GetPositionsForGlyphs ( glyphs ) 
{
    var positions = new Float32Array ( glyphs.length * 4 * 2 );
    var i = 0;
    
    glyphs.forEach (  (glyph) => 
    {
        var bitmap = glyph.data;
    
        var y = glyph.position[1] + bitmap.yoffset;
        var x = glyph.position[0] + bitmap.xoffset;
  
        var w = bitmap.width;
        var h = bitmap.height;
  
        positions[i++] = x;
        positions[i++] = y;
    
        positions[i++] = x;
        positions[i++] = y + h;
      
        positions[i++] = x + w;
        positions[i++] = y + h;
      
        positions[i++] = x + w;
        positions[i++] = y;
    });

    return positions;
}

class TextGeometry extends THREE.BufferGeometry
{
    constructor ( options )
    {
        super();
        this._options = Object.assign ( {}, options );
        if ( options ) this.update( options );
    }

    update ( options )
    {
        options = Object.assign ( {}, this._options, options );
        if ( !options.font ) throw new Error ("Font required");
        if ( !options.font.font ) throw new Error ("Font required");

        this.layout = new TextLayout ( options );
        var flipY = options.flipY !== false;
        var font = options.font.font;

        var glyphs = this.layout.glyphs.filter ( function (glyph) 
        {
            var bitmap = glyph.data;
            return bitmap.width * bitmap.height > 0;
        });

        this.visibleGlyphs = glyphs;
        var positions = GetPositionsForGlyphs ( glyphs );
        var uvs = options.font.getUVSForGlyphs ( glyphs, flipY );
        
        var indices = CreateQuadIndices ( glyphs.length );

        Buffer.index ( this, indices, 1, 'uint16' );
        Buffer.attr ( this, 'position', positions, 2 )
        Buffer.attr ( this, 'uv', uvs, 2 )

        if ( !options.multipage && 'page' in this.attributes ) 
        {
            this.removeAttribute('page')
        } else if ( options.multipage ) 
        {
            var pages = GetPagesForGlyphs ( glyphs );
            Buffer.attr ( this, 'page', pages, 1 )
        }
    }

    computeBoundingSphere ( ) /* override */
    {
        if ( this.boundingSphere === null ) { this.boundingSphere = new THREE.Sphere(); }
        
        var positions = this.attributes.position.array;
        var itemSize = this.attributes.position.itemSize;
        if ( !positions || !itemSize || positions.length < 2 ) 
        {
            this.boundingSphere.radius = 0;
            this.boundingSphere.center.set(0, 0, 0);
            return;
        }

        ComputeBoundingSphere ( positions, this.boundingSphere )
        if  ( isNaN ( this.boundingSphere.radius ) )  
        {   
            console.error('THREE.BufferGeometry.computeBoundingSphere(): ' + 'Computed radius is NaN. The ' + '"position" attribute is likely to have NaN values.');
        }
    }

    computeBoundingBox ( ) /* override */
    {
        if ( this.boundingBox === null ) { this.boundingBox = new THREE.Box3(); }
        
        var bbox = this.boundingBox;
        var positions = this.attributes.position.array;
        var itemSize = this.attributes.position.itemSize;
        
        if ( !positions || !itemSize || positions.length < 2 ) 
        {
            bbox.makeEmpty();
            return;
        }
        
        ComputeBoundingBox ( positions, bbox );
    }
}

export { TextGeometry };