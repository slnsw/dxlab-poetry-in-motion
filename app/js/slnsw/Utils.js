/**
 * @project DXLAB Poetry In Motion
 * @author @axjxwright / http://axinteractive.com.au
 */

import { Quaternion, Vector3, Matrix4, BufferGeometry, Uint16BufferAttribute, Float32BufferAttribute } from "../lib/three.module.js";

async function LoadJSONFromURL ( url )
{
    try 
    {
        const response = await fetch(url);
        if( !response.ok ) throw new Error(response.statusText);
        const data = await response.json();
        return data;
    } catch ( error ) 
    {
        return error;
    }
}

let EasingFunctions = 
{
    // no easing, no acceleration
    linear: t => t,
    // accelerating from zero velocity
    easeInQuad: t => t*t,
    // decelerating to zero velocity
    easeOutQuad: t => t*(2-t),
    // acceleration until halfway, then deceleration
    easeInOutQuad: t => t<.5 ? 2*t*t : -1+(4-2*t)*t,
    // accelerating from zero velocity 
    easeInCubic: t => t*t*t,
    // decelerating to zero velocity 
    easeOutCubic: t => (--t)*t*t+1,
    // acceleration until halfway, then deceleration 
    easeInOutCubic: t => t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1,
    // accelerating from zero velocity 
    easeInQuart: t => t*t*t*t,
    // decelerating to zero velocity 
    easeOutQuart: t => 1-(--t)*t*t*t,
    // acceleration until halfway, then deceleration
    easeInOutQuart: t => t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t,
    // accelerating from zero velocity
    easeInQuint: t => t*t*t*t*t,
    // decelerating to zero velocity
    easeOutQuint: t => 1+(--t)*t*t*t*t,
    // acceleration until halfway, then deceleration 
    easeInOutQuint: t => t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t
}

const CW_WINDING = [0, 2, 3]
const CCW_WINDING = [2, 1, 3]

function CreateQuadIndices ( numQuads )
{
    var start = 0;
    
    var dir = CW_WINDING;
    var a = dir[0];
    var b = dir[1];
    var c = dir[2];

    var numIndices = numQuads * 6

    var indices = new Uint16Array(numIndices);
    for ( var i = 0, j = 0; i < numIndices; i += 6, j += 4 ) 
    {
        var x = i + start
        indices[x + 0] = j + 0
        indices[x + 1] = j + 1
        indices[x + 2] = j + 2
        indices[x + 3] = j + a
        indices[x + 4] = j + b
        indices[x + 5] = j + c
    }

    return indices;
}

function CreateBoxBufferGeometry ( arrayOfBox3s )
{
    var indices = CreateQuadIndices ( arrayOfBox3s.length );
    var positions = new Float32Array ( arrayOfBox3s.length * 4 * 3 );
    var i = 0;

    arrayOfBox3s.forEach ( (box3) => 
    {
        var x = Math.floor(box3.min.x);
        var y = Math.floor(box3.min.y);
  
        var w = Math.ceil(box3.max.x - box3.min.x);
        var h = Math.ceil(box3.max.y - box3.min.y);
  
        positions[i++] = x;
        positions[i++] = y;
        positions[i++] = 0;
    
        positions[i++] = x;
        positions[i++] = y + h;
        positions[i++] = 0;
      
        positions[i++] = x + w;
        positions[i++] = y + h;
        positions[i++] = 0;
      
        positions[i++] = x + w;
        positions[i++] = y;
        positions[i++] = 0;
    });

    var geometry = new BufferGeometry();
    geometry.setAttribute( "position", new Float32BufferAttribute( positions, 3 ) );
    geometry.setIndex ( new Uint16BufferAttribute ( indices, 1 ) );

    return geometry;
}

function ComputeExtents ( positions ) 
{
    var box = { min: [0, 0], max: [0, 0] };
    var count = positions.length / 2
    box.min[0] = positions[0]
    box.min[1] = positions[1]
    box.max[0] = positions[0]
    box.max[1] = positions[1]

    for ( var i = 0; i < count; i++ ) 
    {
        var x = positions[i * 2 + 0]
        var y = positions[i * 2 + 1]
        box.min[0] = Math.min(x, box.min[0])
        box.min[1] = Math.min(y, box.min[1])
        box.max[0] = Math.max(x, box.max[0])
        box.max[1] = Math.max(y, box.max[1])
    }

    return box;
}

function ComputeBoundingBox ( positions, outBox ) 
{
    var extents = ComputeExtents ( positions );
    outBox.min.set ( extents.min[0], extents.min[1], 0 );
    outBox.max.set ( extents.max[0], extents.max[1], 0 );
}

function ComputeBoundingSphere ( positions, outSphere ) 
{
    var extents = ComputeExtents( positions );
  
    var minX = extents.min[0];
    var minY = extents.min[1];
    var maxX = extents.max[0];
    var maxY = extents.max[1];

    var width = maxX - minX;
    var height = maxY - minY;
    var length = Math.sqrt ( width * width + height * height );
  
    outSphere.center.set(minX + width / 2, minY + height / 2, 0 );
    outSphere.radius = length / 2;
}

function MatrixLerp ( a, b, t )
{
    if ( t == 0.0 ) return a;
    if ( t == 1.0 ) return b;

    let posA = new Vector3();
    let rotA = new Quaternion();
    let sclA = new Vector3();

    a.decompose(posA, rotA, sclA);

    let posB = new Vector3();
    let rotB = new Quaternion();
    let sclB = new Vector3();

    b.decompose(posB, rotB, sclB);

    posA.lerp(posB, t);
    rotA.slerp(rotB, t);
    sclA.lerp(sclB, t);

    a.compose(posA, rotA, sclA);
}

function MatrixInvert ( mat )
{
    let result = new Matrix4();
    result.getInverse(mat);

    return result;
}


export { LoadJSONFromURL, ComputeBoundingBox, ComputeBoundingSphere, MatrixLerp, MatrixInvert, CreateBoxBufferGeometry, EasingFunctions, CreateQuadIndices };