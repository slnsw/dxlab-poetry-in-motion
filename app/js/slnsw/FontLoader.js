/**
 * @project DXLAB Poetry In Motion
 * @author @axjxwright / http://axinteractive.com.au
 */

import * as THREE from "../lib/three.module.js"

class MSDFFont
{
    constructor ( font )
    {
        this.font = font;
    }

    getGlyphById ( id )
    {
        var glyphIdx = this.findChar( id )
        if ( glyphIdx >= 0 ) return this.font.chars[glyphIdx];
        return null;
    }

    getXHeight ( )
    {
        for ( var i = 0; i < MSDFFont.X_HEIGHTS.length; i++ )
        {
            var id = MSDFFont.X_HEIGHTS[i].charCodeAt( 0 );
            var idx = this.findChar( id );
            if ( idx >= 0 ) return this.font.chars[idx].height;
        }
        return 0;
    }

    getMGlyph ( )
    {
        for ( var i = 0; i < MSDFFont.M_WIDTHS.length; i++ )
        {
            var id = MSDFFont.M_WIDTHS[i].charCodeAt( 0 );
            var idx = this.findChar( id );
            if ( idx >= 0 ) return this.font.chars[idx];
        }
        return 0;
    }

    getCapHeight ( )
    {
        for ( var i = 0; i < MSDFFont.CAP_HEIGHTS.length; i++ )
        {
            var id = MSDFFont.CAP_HEIGHTS[i].charCodeAt( 0 );
            var idx = this.findChar( id );
            if ( idx >= 0 ) return this.font.chars[idx].height;
        }
        return 0
    }

    getKerning ( left, right )
    {
        if ( !this.font.kernings || this.font.kernings.length === 0 )return 0;

        var table = this.font.kernings;
        for ( var i = 0; i < table.length; i++ )
        {
            var kern = table[i];
            if ( kern.first === left && kern.second === right ) return kern.amount;
        }

        return 0;
    }

    getAlignType ( align )
    {
        if ( align === 'center' )
        {
            return MSDFFont.ALIGN_CENTER;
        }else if ( align === 'right' )
        {
            return MSDFFont.ALIGN_RIGHT;
        }

        return MSDFFont.ALIGN_LEFT;
    }

    findChar ( value, start )
    {
        if ( !this.font.chars || this.font.chars.length === 0 ) return -1;

        start = start || 0;
        for ( var i = start; i < this.font.chars.length; i++ )
        {
            if ( this.font.chars[i].id === value ) return i;
        }
        return -1
    }

    getDefaultChar ( )
    {
        if ( !this.font.chars || this.font.chars.length === 0 ) return null;
        return this.font.chars[0];
    }
}

MSDFFont.TAB_ID = '\t'.charCodeAt( 0 );
MSDFFont.SPACE_ID = ' '.charCodeAt( 0 );

MSDFFont.X_HEIGHTS = ['x', 'e', 'a', 'o', 'n', 's', 'r', 'c', 'u', 'm', 'v', 'w', 'z'];
MSDFFont.M_WIDTHS = ['m', 'w'];
MSDFFont.CAP_HEIGHTS = ['H', 'I', 'N', 'E', 'F', 'K', 'L', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

MSDFFont.ALIGN_LEFT = 0;
MSDFFont.ALIGN_CENTER = 1;
MSDFFont.ALIGN_RIGHT = 2;

class FontLoader
{
    constructor ( manager, fontURL, textureURL )
    {
        var self = this;
        var file = new THREE.FileLoader( manager );
        file.load ( fontURL, function ( data )
        {
            self.font = JSON.parse(data);
            self.texture = null;
            self.msdf = new MSDFFont( self.font );
            new THREE.TextureLoader( manager ).load( textureURL, function ( texture )
            {
                texture.needsUpdate = true;
                texture.minFilter = THREE.LinearMipMapLinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.generateMipmaps = true;
                self.texture = texture;
            });
        } );
    }

    getUVSForGlyphs ( glyphs, flipY = false )
    {
        let uvs = new Float32Array( glyphs.length * 4 * 2 );
        let i = 0;

        glyphs.forEach( ( glyph ) =>
        {
            let uv = this.getUVSForGlyph(glyph, flipY);

            uvs[i++] = uv.u[0];
            uvs[i++] = uv.v[1];

            uvs[i++] = uv.u[0];
            uvs[i++] = uv.v[0];

            uvs[i++] = uv.u[1];
            uvs[i++] = uv.v[0];

            uvs[i++] = uv.u[1];
            uvs[i++] = uv.v[1];
        } );

        return uvs;
    }

    getUVSForGlyphIDs ( glyphIDs, flipY = false )
    {
        let glyphs = []
        glyphIDs.forEach ( (glyph) => glyphs.push ( this.msdf.getGlyphById(glyph) ) );
        return this.getUVSForGlyphs( glyphs, flipY );
    }

    getUVSForGlyphID ( glyphID, flipY = false )
    {
        let glyph = this.getUVSForGlyphIDs([glyphID], flipY );
        return glyph;
    }

    getUVSForGlyph ( glyph, flipY = false )
    {
        var texWidth = this.texture.image.width;
        var texHeight = this.texture.image.height;

        var bitmap = glyph.data ? glyph.data : glyph;
        var bw = (bitmap.x + bitmap.width);
        var bh = (bitmap.y + bitmap.height);

        var u0 = bitmap.x / texWidth;
        var v1 = bitmap.y / texHeight;
        var u1 = bw / texWidth;
        var v0 = bh / texHeight;

        if ( flipY )
        {
            v1 = (texHeight - bitmap.y) / texHeight;
            v0 = (texHeight - bh) / texHeight;
        }

        return { u : [ u0, u1 ], v : [ v0, v1 ] };
    }
}

export { FontLoader, MSDFFont };