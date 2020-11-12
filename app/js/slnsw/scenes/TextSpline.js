/**
 * @project DXLAB Poetry In Motion
 * @author @axjxwright / http://axinteractive.com.au
 */

import * as THREE from '../../lib/three.module.js';
import { FontLoader } from "../FontLoader.js"
import { CreateMSDFShader } from "../shaders/MSDFShader.js";
import { kRawPoints } from "./SplinePoints.js"
import { EasingFunctions } from "../Utils.js"

class Letter extends THREE.Mesh
{
    constructor ( geometry, material )
    {
        super ( geometry, material );
        this.dying = false;
        this.dead = false;
        this.deathLerp = 0.0;
    }

    setTargets ( position, quaternion )
    {
        let rx = (Math.random() * 2.0 - 1.0) * 0.1;
        let ry = (Math.random() * 2.0 - 1.0) * 0.1;
        let rz = (Math.random() * 2.0 - 1.0) * 0.1;

        this.targetPosition = new THREE.Vector3().copy ( position );
        this.targetQuaternion = new THREE.Quaternion().copy ( quaternion );

        this.position.copy ( position.clone().add ( new THREE.Vector3( rx, ry, rz ) ) );
        this.quaternion.copy ( new THREE.Quaternion().setFromAxisAngle ( new THREE.Vector3 ( rx, ry, rz ).normalize(), Math.random() * Math.PI * 2.0 ) );
        this.scale.set ( 0, 0, 0 );
    }

    die ( )
    {
        let rx = (Math.random() * 2.0 - 1.0) * 0.01;
        let ry = (Math.random() * 2.0 - 1.0) * 0.01;
        let rz = (Math.random() * 2.0 - 1.0) * 0.01;

        this.basePosition = this.position.clone();
        this.baseScale = this.scale.clone();
        this.targetPosition.copy ( this.position.clone().add ( new THREE.Vector3( rx, ry, rz ) ) );
        this.dying = true;
    }

    update()
    {
        const kSpeed = 0.05;
        if ( !this.dying )
        {
            this.position.lerp ( this.targetPosition, kSpeed );
            this.quaternion.slerp ( this.targetQuaternion, kSpeed );
            this.scale.lerp ( new THREE.Vector3(-1, -1, 1), kSpeed );
        }else
        {
            this.deathLerp += 1.0 / 60.0;
            if ( this.deathLerp > 1.0 ) this.dead = true;
            
            let t = EasingFunctions.easeInQuint ( this.deathLerp );
            this.position.copy ( this.basePosition.clone().lerp ( this.targetPosition, t ) );
            this.scale.copy ( this.baseScale.clone().lerp ( new THREE.Vector3(0, 0, 0), t ) );            
        }
    }
}

let kGlyphCache = new Map();

function MakeQuadGeometry ( glyph, uvs, scale = 0.01 )
{
    if ( kGlyphCache.has ( glyph ) ) return kGlyphCache.get ( glyph );

    let bitmap = glyph.data ? glyph.data : glyph;

    let y = bitmap.yoffset * scale;
    let x = bitmap.xoffset * scale;

    let w = bitmap.width * scale;
    let h = bitmap.height * scale;
    
    let plane = new THREE.PlaneBufferGeometry();

    plane.attributes.position.setXY(0, y, x );
    plane.attributes.position.setXY(1, y + h, x );
    plane.attributes.position.setXY(2, y + h, x + w );
    plane.attributes.position.setXY(3, y, x + w );

    plane.attributes.uv.setXY(0, uvs[0], uvs[1]);
    plane.attributes.uv.setXY(1, uvs[2], uvs[3]);
    plane.attributes.uv.setXY(2, uvs[4], uvs[5]);
    plane.attributes.uv.setXY(3, uvs[6], uvs[7]);

    plane.index.setX(0, 0);
    plane.index.setX(1, 1);
    plane.index.setX(2, 2);
    plane.index.setX(3, 2);
    plane.index.setX(4, 3);
    plane.index.setX(5, 0);

    kGlyphCache.set ( glyph, plane );

    return plane;
}

const zUp = new THREE.Quaternion().setFromAxisAngle ( new THREE.Vector3(0, 1, 0), Math.PI * 2.0 );
const yUp = new THREE.Quaternion().setFromAxisAngle ( new THREE.Vector3(0, 0, 1), -Math.PI / 2.0 );

class TextSpline extends THREE.Object3D
{
    constructor ( )
    {
        super ( );

        this.distance = 1.0;

        this._time = 0.0;
        this._curve;
        this._targetCameraPos = new THREE.Vector3();
        this._targetCameraQuat = new THREE.Quaternion();
        this._quads = [];
        this._dyingQuads = [];
        this._lastGlyphID = -1;
        this._frame = 0;
        this._material;
        this._font;
        this._mGlyph;
        this._ctr = 0;
        this._curveLength = 0.0;

        this._font = FontLoader.kDefaultFont;
        this._mGlyph = this._font.msdf.getMGlyph();
        this._material = new THREE.ShaderMaterial( CreateMSDFShader ( { map: this._font.texture, side: THREE.DoubleSide, transparent: true, color: '#FFFFFF' } ) );

        let splinePoints = [];

        for ( let i = 0; i < kRawPoints.length; i++ )
        {
            let x = kRawPoints[i][0];
            let y = kRawPoints[i][1];
            let z = kRawPoints[i][2];
            
            splinePoints.push( new THREE.Vector3(x, y, z).multiplyScalar(0.8));
        }

        this._curve = new THREE.CatmullRomCurve3( splinePoints, true, "catmullrom", 0.1 );
        this._curveLength = this._curve.getLength();
    }

    setThemeColor ( color )
    { 
        this._material.uniforms["color"].value = new THREE.Color(color);
    }

    addLetter ( letter )
    {   
        let glyph = this._font.msdf.getGlyphById(letter.charCodeAt(0));
        if ( glyph == null ) return;

        const glyphScale = 0.00085;
        let uvs = this._font.getUVSForGlyphs( [glyph], true );

        let up = new THREE.Vector3( 0, 1, 0 );
        let axis = new THREE.Vector3( );
        let forward = new THREE.Vector3(0, 0, 0.35 * this.distance );

        let geom = MakeQuadGeometry ( glyph, uvs, glyphScale );

        let quad = new Letter ( geom, this._material );
        let pt = this._curve.getPoint( this._time );
        
        quad.position.set( pt.x, pt.y, pt.z );
        quad.scale.set(-1, -1, 1);
        
        let tangent = this._curve.getTangent( this._time ).normalize();
        axis.crossVectors( up, tangent ).normalize();

        let radians = Math.acos( up.dot( tangent ) );
        quad.quaternion.setFromAxisAngle( axis, radians );

        quad.updateMatrixWorld();
        forward.applyMatrix4 ( quad.matrixWorld );
        
        const xUp = new THREE.Quaternion().setFromAxisAngle ( new THREE.Vector3(0, 0, 1), Math.PI / 2 );
        xUp.multiply (new THREE.Quaternion().setFromAxisAngle ( new THREE.Vector3(0, 1, 0), Math.PI ));
        
        this._targetCameraPos .copy ( forward );
        this._targetCameraQuat.copy ( quad.quaternion.clone().multiply ( yUp ).multiply ( zUp ) );
        
        if ( letter != ' ' )
        {
            quad.setTargets ( pt, quad.quaternion );
            this.add(quad);
            this._quads.push ( quad );
            if ( this._quads.length > 160 )
            {
                let a = this._quads.shift();
                a.die();
                this._dyingQuads.push ( a );
            }
        }

        let kern = this._font.msdf.getKerning(this._lastGlyphID, glyph.id);
        if ( letter == ' ' ) 
        {
            glyph = this._mGlyph;
            kern = -40.0;
        }

        let xAdvance = (glyph.data ? glyph.data : glyph).width;
        const kFudge = 1.0;

        xAdvance += kern;
        xAdvance *= glyphScale * kFudge;
        
        this._lastGlyphID = glyph.id;
        this._time -= xAdvance / this._curveLength;

        if ( this._time >= 1.0 ) this._time -= 1.0;
        if ( this._time < 0.0 ) this._time += 1.0;
    }

    update ( )
    {
        this._quads.forEach ( (q) => { q.update(); } );
        this._dyingQuads.forEach ( (q) => 
        { 
            q.update(); 
            if ( q.dead ) q.parent.remove(q);
        } );
        this._dyingQuads = this._dyingQuads.filter ( q => { return !q.dead; } );
    }

    get targetCameraPos ( )
    {
        return this._targetCameraPos;
    }

    get targetCameraQuat ( )
    {
        return this._targetCameraQuat;
    }
}

export { TextSpline }