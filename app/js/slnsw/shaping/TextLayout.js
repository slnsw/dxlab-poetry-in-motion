import { BufferAttribute } from "../../lib/three.module.js"
import { MSDFFont } from "../FontLoader.js"

var newline = /\n/
var newlineChar = '\n'
var whitespace = /\s/

var wordWrap = function ( text, opt )
{
    var lines = wordWrapLines( text, opt )
    return lines.map( function ( line )
    {
        return text.substring( line.start, line.end )
    } ).join( '\n' )
}

var wordWrapLines = function ( text, opt )
{
    opt = opt || {}

    //zero width results in nothing visible
    if ( opt.width === 0 && opt.mode !== 'nowrap' )
        return []

    text = text || ''
    var width = typeof opt.width === 'number' ? opt.width : Number.MAX_VALUE
    var start = Math.max( 0, opt.start || 0 )
    var end = typeof opt.end === 'number' ? opt.end : text.length
    var mode = opt.mode

    var measure = opt.measure || monospace
    if ( mode === 'pre' )
        return pre( measure, text, start, end, width )
    else
        return greedy( measure, text, start, end, width, mode )
}

function idxOf ( text, chr, start, end )
{
    var idx = text.indexOf( chr, start )
    if ( idx === -1 || idx > end )
        return end
    return idx
}

function isWhitespace ( chr )
{
    return whitespace.test( chr )
}

function pre ( measure, text, start, end, width )
{
    var lines = []
    var lineStart = start
    for ( var i = start; i < end && i < text.length; i++ )
    {
        var chr = text.charAt( i )
        var isNewline = newline.test( chr )

        //If we've reached a newline, then step down a line
        //Or if we've reached the EOF
        if ( isNewline || i === end - 1 )
        {
            var lineEnd = isNewline ? i : i + 1
            var measured = measure( text, lineStart, lineEnd, width )
            lines.push( measured )

            lineStart = i + 1
        }
    }
    return lines
}

function greedy ( measure, text, start, end, width, mode )
{
    //A greedy word wrapper based on LibGDX algorithm
    //https://github.com/libgdx/libgdx/blob/master/gdx/src/com/badlogic/gdx/graphics/g2d/BitmapFontCache.java

    var lines = []

    var testWidth = width
    //if 'nowrap' is specified, we only wrap on newline chars
    if ( mode === 'nowrap' )
        testWidth = Number.MAX_VALUE

    while ( start < end && start < text.length )
    {
        //get next newline position
        var newLine = idxOf( text, newlineChar, start, end )

        //eat whitespace at start of line
        while ( start < newLine )
        {
            if ( !isWhitespace( text.charAt( start ) ) )
                break
            start++
        }

        //determine visible # of glyphs for the available width
        var measured = measure( text, start, newLine, testWidth )

        var lineEnd = start + (measured.end - measured.start)
        var nextStart = lineEnd + newlineChar.length

        //if we had to cut the line before the next newline...
        if ( lineEnd < newLine )
        {
            //find char to break on
            while ( lineEnd > start )
            {
                if ( isWhitespace( text.charAt( lineEnd ) ) )
                    break
                lineEnd--
            }
            if ( lineEnd === start )
            {
                if ( nextStart > start + newlineChar.length ) nextStart--
                lineEnd = nextStart // If no characters to break, show all.
            } else
            {
                nextStart = lineEnd
                //eat whitespace at end of line
                while ( lineEnd > start )
                {
                    if ( !isWhitespace( text.charAt( lineEnd - newlineChar.length ) ) )
                        break
                    lineEnd--
                }
            }
        }
        if ( lineEnd >= start )
        {
            var result = measure( text, start, lineEnd, testWidth )
            lines.push( result )
        }
        start = nextStart
    }
    return lines
}

//determines the visible number of glyphs within a given width
function monospace ( text, start, end, width )
{
    var glyphs = Math.min( width, end - start )
    return {
        start: start,
        end: start + glyphs
    }
}

function number ( num, def )
{
    return typeof num === 'number'
        ? num
        : (typeof def === 'number' ? def : 0)
}

function TextLayout ( opt )
{
    this.glyphs = []
    this._measure = this.computeMetrics.bind( this );
    this._font = opt.font.msdf;
    this.update( opt )
}

TextLayout.prototype.update = function ( opt )
{
    opt = Object.assign( {
        measure: this._measure
    }, opt )
    this._opt = opt
    this._opt.tabSize = number( this._opt.tabSize, 4 )

    var glyphs = this.glyphs
    var text = opt.text || ''
    this._setupSpaceGlyphs( )

    var lines = wordWrapLines( text, opt )
    var minWidth = opt.width || 0

    //clear glyphs
    glyphs.length = 0

    //get max line width
    var maxLineWidth = lines.reduce( function ( prev, line )
    {
        return Math.max( prev, line.width, minWidth )
    }, 0 )

    //the pen position
    var x = 0
    var y = 0
    var lineHeight = number( opt.lineHeight, opt.font.font.common.lineHeight )
    var baseline = opt.font.font.common.base
    var descender = lineHeight - baseline
    var letterSpacing = opt.letterSpacing || 0
    var height = lineHeight * lines.length - descender
    var align = this._font.getAlignType( this._opt.align )

    //draw text along baseline
    y -= height

    //the metrics for this text layout
    this._width = maxLineWidth
    this._height = height
    this._descender = lineHeight - baseline
    this._baseline = baseline
    this._xHeight = this._font.getXHeight( )
    this._capHeight = this._font.getCapHeight()
    this._lineHeight = lineHeight
    this._ascender = lineHeight - descender - this._xHeight

    //layout each glyph
    var self = this
    var paragraphIndex = 0;
    var wordIndex = 0;
    lines.forEach( function ( line, lineIndex )
    {
        var start = line.start
        var end = line.end
        var lineWidth = line.width
        var lastGlyph

        //for each glyph in that line...
        for ( var i = start; i < end; i++ )
        {
            var id = text.charCodeAt( i )
            var glyph = self.getGlyph( id )
            if ( id == MSDFFont.TAB_ID || id == MSDFFont.SPACE_ID ) wordIndex++;           

            if ( glyph )
            {

                if ( lastGlyph )
                    x += self._font.getKerning( lastGlyph.id, glyph.id )

                var tx = x
                if ( align === MSDFFont.ALIGN_CENTER )
                    tx += (maxLineWidth - lineWidth) / 2
                else if ( align === MSDFFont.ALIGN_RIGHT )
                    tx += (maxLineWidth - lineWidth)

                glyphs.push( {
                    position: [tx, y],
                    data: glyph,
                    index: i,
                    line: lineIndex,
                    paragraph : paragraphIndex,
                    word : wordIndex
                } )

                //move pen forward
                x += glyph.xadvance + letterSpacing
                lastGlyph = glyph
            }
        }

        if ( end - start == 0 ) // empty block
        {
            paragraphIndex++;
        }

        //next line down
        y += lineHeight
        x = 0
        wordIndex++;
    } )
    this._linesTotal = lines.length;
}

TextLayout.prototype._setupSpaceGlyphs = function ( )
{
    //These are fallbacks, when the font doesn't include
    //' ' or '\t' glyphs
    this._fallbackSpaceGlyph = null
    this._fallbackTabGlyph = null

    //if ( !font.chars || font.chars.length === 0 )
    //    return

    //try to get space glyph
    //then fall back to the 'm' or 'w' glyphs
    //then fall back to the first glyph available
    var space = this._font.getGlyphById( MSDFFont.SPACE_ID )
        || this._font.getMGlyph( )
        || this._font.getDefaultChar();

    //and create a fallback for tab
    var tabWidth = this._opt.tabSize * space.xadvance
    this._fallbackSpaceGlyph = space

    // Javascript is disgusting
    var clone = JSON.parse( JSON.stringify( space ) );

    this._fallbackTabGlyph = Object.assign( clone, {
        x: 0, y: 0, xadvance: tabWidth, id: MSDFFont.TAB_ID,
        xoffset: 0, yoffset: 0, width: 0, height: 0
    } )
}

TextLayout.prototype.getGlyph = function ( id )
{
    var glyph = this._font.getGlyphById( id )
    if ( glyph )
        return glyph
    else if ( id === MSDFFont.TAB_ID )
        return this._fallbackTabGlyph
    else if ( id === MSDFFont.SPACE_ID )
        return this._fallbackSpaceGlyph
    return null
}

TextLayout.prototype.computeMetrics = function ( text, start, end, width )
{
    var letterSpacing = this._opt.letterSpacing || 0
    var curPen = 0
    var curWidth = 0
    var count = 0
    var glyph
    var lastGlyph

    {
        var font = this._opt.font.font;
        if ( !font.chars || font.chars.length === 0 )
        {
            return {
                start: start,
                end: start,
                width: 0
            }
        }
    }

    end = Math.min( text.length, end )
    for ( var i = start; i < end; i++ )
    {
        var id = text.charCodeAt( i )
        var glyph = this.getGlyph( id )

        if ( glyph )
        {
            //move pen forward
            var xoff = glyph.xoffset
            var kern = lastGlyph ? this._font.getKerning( lastGlyph.id, glyph.id ) : 0
            curPen += kern

            var nextPen = curPen + glyph.xadvance + letterSpacing
            var nextWidth = curPen + glyph.width

            //we've hit our limit; we can't move onto the next glyph
            if ( nextWidth >= width || nextPen >= width )
                break

            //otherwise continue along our line
            curPen = nextPen
            curWidth = nextWidth
            lastGlyph = glyph
        }
        count++
    }

    //make sure rightmost edge lines up with rendered glyphs
    if ( lastGlyph )
        curWidth += lastGlyph.xoffset

    return {
        start: start,
        end: start + count,
        width: curWidth
    }
}

//getters for the private vars
;['width', 'height',
    'descender', 'ascender',
    'xHeight', 'baseline',
    'capHeight',
    'lineHeight'].forEach( addGetter )

function addGetter ( name )
{
    Object.defineProperty( TextLayout.prototype, name, {
        get: wrapper( name ),
        configurable: true
    } )
}

//create lookups for private vars
function wrapper ( name )
{
    return (new Function( [
        'return function ' + name + '() {',
        '  return this._' + name,
        '}'
    ].join( '\n' ) ))()
}

///
/// Buffer stufff
///

function dtype ( type )
{
    switch ( type )
    {
        case 'int8':
            return Int8Array
        case 'int16':
            return Int16Array
        case 'int32':
            return Int32Array
        case 'uint8':
            return Uint8Array
        case 'uint16':
            return Uint16Array
        case 'uint32':
            return Uint32Array
        case 'float32':
            return Float32Array
        case 'float64':
            return Float64Array
        case 'array':
            return Array
        case 'uint8_clamped':
            return Uint8ClampedArray
    }
}

var warnedAboutFixedSizedBuffers = false;

//module.exports.attr = setAttribute
//module.exports.index = setIndex

var Buffer = { attr: setAttribute, index: setIndex };

function flattenVertexData ( data, output, offset )
{
    if ( !data ) throw new TypeError( 'must specify data as first parameter' )
    offset = +(offset || 0) | 0

    if ( Array.isArray( data ) && (data[0] && typeof data[0][0] === 'number') )
    {
        var dim = data[0].length
        var length = data.length * dim
        var i, j, k, l

        // no output specified, create a new typed array
        if ( !output || typeof output === 'string' )
        {
            output = new (dtype( output || 'float32' ))( length + offset )
        }

        var dstLength = output.length - offset
        if ( length !== dstLength )
        {
            throw new Error( 'source length ' + length + ' (' + dim + 'x' + data.length + ')' +
                ' does not match destination length ' + dstLength )
        }

        for ( i = 0, k = offset; i < data.length; i++ )
        {
            for ( j = 0; j < dim; j++ )
            {
                output[k++] = data[i][j] === null ? NaN : data[i][j]
            }
        }
    } else
    {
        if ( !output || typeof output === 'string' )
        {
            // no output, create a new one
            var Ctor = dtype( output || 'float32' )

            // handle arrays separately due to possible nulls
            if ( Array.isArray( data ) || output === 'array' )
            {
                output = new Ctor( data.length + offset )
                for ( i = 0, k = offset, l = output.length; k < l; k++, i++ )
                {
                    output[k] = data[i] === null ? NaN : data[i]
                }
            } else
            {
                if ( offset === 0 )
                {
                    output = new Ctor( data )
                } else
                {
                    output = new Ctor( data.length + offset )

                    output.set( data, offset )
                }
            }
        } else
        {
            // store output in existing array
            output.set( data, offset )
        }
    }

    return output
}


function setIndex ( geometry, data, itemSize, dtype )
{
    if ( typeof itemSize !== 'number' ) itemSize = 1
    if ( typeof dtype !== 'string' ) dtype = 'uint16'

    var isR69 = !geometry.index && typeof geometry.setIndex !== 'function'
    var attrib = isR69 ? geometry.getAttribute( 'index' ) : geometry.index
    var newAttrib = updateAttribute( attrib, data, itemSize, dtype )
    if ( newAttrib )
    {
        if ( isR69 ) geometry.setAttribute( 'index', newAttrib )
        else geometry.index = newAttrib
    }
}

function setAttribute ( geometry, key, data, itemSize, dtype )
{
    if ( typeof itemSize !== 'number' ) itemSize = 3
    if ( typeof dtype !== 'string' ) dtype = 'float32'
    if ( Array.isArray( data ) &&
        Array.isArray( data[0] ) &&
        data[0].length !== itemSize )
    {
        throw new Error( 'Nested vertex array has unexpected size; expected ' +
            itemSize + ' but found ' + data[0].length )
    }

    var attrib = geometry.getAttribute( key )
    var newAttrib = updateAttribute( attrib, data, itemSize, dtype )
    if ( newAttrib )
    {
        geometry.setAttribute( key, newAttrib )
    }
}

function updateAttribute ( attrib, data, itemSize, dtype )
{
    data = data || []
    if ( !attrib || rebuildAttribute( attrib, data, itemSize ) )
    {
        // create a new array with desired type
        data = flattenVertexData( data, dtype )

        var needsNewBuffer = attrib && typeof attrib.setArray !== 'function'
        if ( !attrib || needsNewBuffer )
        {
            // We are on an old version of ThreeJS which can't
            // support growing / shrinking buffers, so we need
            // to build a new buffer
            if ( needsNewBuffer && !warnedAboutFixedSizedBuffers )
            {
                warnedAboutFixedSizedBuffers = true
                console.warn( [
                    'A WebGL buffer is being updated with a new size or itemSize, ',
                    'however this version of ThreeJS only supports fixed-size buffers.',
                    '\nThe old buffer may still be kept in memory.\n',
                    'To avoid memory leaks, it is recommended that you dispose ',
                    'your geometries and create new ones, or update to ThreeJS r82 or newer.\n',
                    'See here for discussion:\n',
                    'https://github.com/mrdoob/three.js/pull/9631'
                ].join( '' ) )
            }

            // Build a new attribute
            attrib = new BufferAttribute( data, itemSize );
        }

        attrib.itemSize = itemSize
        attrib.needsUpdate = true

        return attrib
    } else
    {
        // copy data into the existing array
        flattenVertexData( data, attrib.array )
        attrib.needsUpdate = true
        return null
    }
}

// Test whether the attribute needs to be re-created,
// returns false if we can re-use it as-is.
function rebuildAttribute ( attrib, data, itemSize )
{
    if ( attrib.itemSize !== itemSize ) return true
    if ( !attrib.array ) return true
    var attribLength = attrib.array.length
    if ( Array.isArray( data ) && Array.isArray( data[0] ) )
    {
        // [ [ x, y, z ] ]
        return attribLength !== data.length * itemSize
    } else
    {
        // [ x, y, z ]
        return attribLength !== data.length
    }
    return false
}


export { TextLayout, Buffer };