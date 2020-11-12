/**
 * @project DXLAB Poetry In Motion
 * @author @axjxwright / http://axinteractive.com.au
 */

import * as THREE from "../../js/lib/three.module.js"
import { TextGeometry } from "./TextGeometry.js"
import { CreateMSDFShader } from "./shaders/MSDFShader.js"
import { MSDFFont } from "./FontLoader.js"
import { CreateBoxBufferGeometry } from "./Utils.js"
import { Object3D, Vector2, Vector3, MeshBasicMaterial, MathUtils } from "../../js/lib/three.module.js";

let kImpostorMaterial = null;
let kTitleShader = null;

class Document extends THREE.Object3D
{
    constructor(font, copy, meta, material, width)
    {
        super();

        if ( !kImpostorMaterial ) kImpostorMaterial = new MeshBasicMaterial( { side : THREE.BackSide, transparent : true, color : 0xFFFFFF })

        this._zoom = 0;
        var geom = new TextGeometry ( { font : font, text : copy, width : width } );
        geom.computeBoundingBox();

        this.metaMesh = this.createMetaMesh ( font, meta, new THREE.ShaderMaterial ( kTitleShader ), width );

        this.text = new THREE.Mesh ( geom, material );
        this.text.scale.multiplyScalar(0.5);
        this.text.position.x = -geom.layout.width / 2;
        this.text.position.y = geom.layout.height / 2;
        this.opacity = 1.0;
        this.titleOpacity = 0.0;

        this.scale.multiplyScalar(-0.005);
        this.add(this.text);

        this.paraBoxes = [];
        this.wordBoxes = [];
        this.lineBoxes = [];
        
        let paraBoxes = new Map();
        let wordBoxes = new Map();        
        let lineBoxes = new Map();

        for ( let i = 0; i < geom.layout.glyphs.length; i++ )
        {
            let glyph = geom.layout.glyphs[i];

            if ( glyph.id == MSDFFont.TAB_ID || glyph.id == MSDFFont.SPACE_ID ) continue;

            let paraIndex = glyph.paragraph;
            let wordIndex = glyph.word;
            let lineIndex = glyph.line;

            let posA = new THREE.Vector3(glyph.position[0], glyph.position[1], 0);
            let posB = new THREE.Vector3(glyph.position[0] + glyph.data.xadvance + glyph.data.width / 2, glyph.position[1]+glyph.data.height, 0);
            let posC = new THREE.Vector3(glyph.position[0] + glyph.data.xadvance + glyph.data.width / 2, glyph.position[1]+geom.layout._lineHeight*0.5, 0);
            
            if ( !paraBoxes.has ( paraIndex ) ) paraBoxes.set ( paraIndex, new THREE.Box3());
            if ( !wordBoxes.has ( wordIndex ) ) wordBoxes.set ( wordIndex, new THREE.Box3());
            if ( !lineBoxes.has ( lineIndex ) ) lineBoxes.set ( lineIndex, new THREE.Box3());
            
            paraBoxes.get(paraIndex).expandByPoint(posA);
            paraBoxes.get(paraIndex).expandByPoint(posB);

            wordBoxes.get(wordIndex).expandByPoint(posA);
            wordBoxes.get(wordIndex).expandByPoint(posB);

            lineBoxes.get(lineIndex).expandByPoint(posA);
            lineBoxes.get(lineIndex).expandByPoint(posC); // fixed height
        }

        for ( let box of paraBoxes.values() ) this.paraBoxes.push(box);
        for ( let box of wordBoxes.values() ) this.wordBoxes.push(box);
        for ( let box of lineBoxes.values() ) this.lineBoxes.push(box);

        this.impostor = new THREE.Mesh ( CreateBoxBufferGeometry ( this.lineBoxes ), kImpostorMaterial );
        this.impostor.geometry.computeBoundingBox();
        this.impostor.scale.multiplyScalar(0.5);
        this.impostor.position.x = -geom.layout.width / 2;
        this.impostor.position.y = geom.layout.height / 2;
        this.add ( this.impostor );

        this.copy = copy;
    }

    createMetaMesh ( font, meta, material, width )
    {
        var suffix = "";
        var maxChars = Math.min(32, meta.title.length);
        if ( maxChars == 32 ) suffix = "...";

        var copy = meta.title.substring(0, maxChars) + suffix;
        copy += "\n" + meta.author + "\n" + meta.year;

        var geom = new TextGeometry ( { font : font, text : copy, width : width } );
        geom.computeBoundingBox();

        var mesh = new THREE.Mesh ( geom, material );

        const scale = -0.0020;
        mesh.onBeforeRender = (renderer, scene, camera, geometry, material, group) =>
        {
            material.uniforms["opacity"].value = this.opacity * this.titleOpacity;
        };

        let holder = new THREE.Object3D();
        holder.scale.multiply ( new THREE.Vector3 ( scale, scale, 1 ) );
        holder.position.add ( new THREE.Vector3 ( 0, 0, -0.03 ) );

        mesh.position.x = 0;
        holder.add ( mesh );

        return holder;
    }

    getLetterAt ( index )
    {
        return this.copy.charAt(index % this.copy.length);
    }

    getMetaAtZoom ( zoom )
    {
        if ( this.zoom < 0.05 ) return this.meta;
        return null;
    }

    getMetaAlphaAtZoom ( block, zoom )
    {
        if ( block == this && this.zoom < 0.05 ) return 1.0;
        return 0.0;
    }

    setMetaAlphaForZoom ( block, zoom )
    {
        let o = this.getMetaAlphaAtZoom( block, zoom );
        this.titleOpacity = THREE.MathUtils.lerp ( this.titleOpacity, o, 0.1 );
    }

    set zoom ( zoom )
    {
        this._zoom = zoom;

        kImpostorMaterial.opacity = this.opacity * MathUtils.lerp(1, 0, MathUtils.smoothstep(zoom, 0.0, 0.05));
        this.impostor.visible = kImpostorMaterial.opacity > 0;

        this.text.material.uniforms["opacity"].value = 1.0 - kImpostorMaterial.opacity;
        this.text.visible = kImpostorMaterial.opacity < 0.5;
    }

    get zoom ( ) { return this._zoom; }

    get bounds ( )
    {
        let geom = this.children[0].geometry;
        geom.computeBoundingBox();

        let box = new THREE.Box3();
        box.copy( geom.boundingBox ).applyMatrix4( this.children[0].matrixWorld );

        return box;
    }

    getClosestTo ( array, camera )
    {
        let minDistance = 10000;
        let closest = new THREE.Box3();

        let world = new Vector3();

        for ( let i = 0; i < array.length; i++ )
        {
            let b = new THREE.Box3().copy(array[i]).applyMatrix4(this.children[0].matrixWorld);
            b.getCenter(world);
            world.project(camera);
            let length = world.length(); // Distance to (0, 0, 0);
            if ( length < minDistance )
            {
                minDistance = length;
                closest = b;
            }
        }
        return closest;
    }

    getBoxAtZoom ( zoom, camera )
    {
        if ( zoom < 0.05 ) 
        {
            return this.bounds;
        }else if ( zoom < 0.2 )
        {
            return this.getClosestTo ( this.paraBoxes, camera );
        }else
        {
            return this.getClosestTo ( this.wordBoxes, camera );
        }
    }
}

class DocumentGrid extends THREE.Object3D
{
    constructor(font, pages)
    {
        super();

        this.opacity = 1.0;

        this.zoomSpeed = 0.1;
        this._targetPosition = new Vector3();

        this._zoom = 0.01;
        this._targetZoom = this._zoom;

        this.pages = [];
        this.font = font;

        this.panHolder = new Object3D();
        this.zoomHolder = new Object3D();

        this.add(this.zoomHolder);
        this.zoomHolder.add(this.panHolder);

        this._inactiveFrames = 0;
        this._center = new Vector2();

        this.material = new THREE.ShaderMaterial ( CreateMSDFShader ( 
        {
            map: this.font.texture,
            side: THREE.BackSide,
            transparent: true,
            color: '#FFFFFF'
        }));

        kTitleShader = CreateMSDFShader ( 
        {
            map: this.font.texture,
            side: THREE.FrontSide,
            transparent: true,
            color: '#FFFFFF'
        });

        let xCtr = 0
        let yCtr = 0;
        let widthScale = 1.2;

        for ( let i = 0; i < pages.length; i++ )
        {
            var copy = [];
            for ( let j = 0; j < pages[i].page_data.blocks.length; j++ )
            {
                copy.push ( pages[i].page_data.blocks[j].text );
                copy.push ( "" );
            }

            while ( copy[copy.length-1].length == 0 ) copy.pop();

            let pageWidth = 2500.0;

            pages[i].meta.title = pages[i].meta.title;

            var block = new Document ( font, copy.join("\n"), pages[i].meta, this.material, pageWidth * widthScale );
            block.position.x = xCtr++ * -11.0 * widthScale;
            block.position.y = yCtr * -11.0;

            this._center.x += block.position.x;
            this._center.y += block.position.y;

            if ( xCtr > 5 )
            {
                xCtr = 0;
                yCtr++;
            }

            this.pages.push(block);
            this.panHolder.add(block);
        }    

        this._center.x /= this.pages.length;
        this._center.y /= this.pages.length;
    }

    panBy ( delta )
    {
        this._targetPosition.x += delta.x / this.zoomHolder.scale.x;
        this._targetPosition.y += delta.y / this.zoomHolder.scale.x;
        this._inactiveFrames = 0;
    }

    zoomByDelta ( delta )
    {
        const kMax = 10.0;
        let clamped = Math.sign(delta) * Math.min(Math.abs(delta), kMax);
        clamped = THREE.Math.mapLinear(clamped, -kMax, kMax, 1.2, 0.8);

        this.zoomByMultiplier(clamped);
    }

    zoomByMultiplier ( multiplier )
    {
        this.zoom *= multiplier;
        this._inactiveFrames = 0;
    }

    update ( )
    {
        this._zoom = THREE.Math.lerp ( this._zoom, this._targetZoom, this.zoomSpeed );
        let scale = THREE.Math.lerp ( 0.2, 3, this._zoom );
        this.zoomHolder.scale.set ( scale, scale, scale );
        this.panHolder.position.lerp ( this._targetPosition, 0.1 );
        this.pages.forEach ( (page) => { page.opacity = this.opacity; page.zoom = this._zoom; } );
        this.material.uniforms["opacity"].value = this.opacity;
    }

    setThemeColor ( color )
    {
        var c = new THREE.Color(color);
        this.material.uniforms["color"].value = c;
        kImpostorMaterial.color = c;
        kTitleShader.uniforms["color"].value = c;
    }

    set zoom ( zoom )
    {
        this._targetZoom = Math.max ( 0, Math.min ( zoom, 1 ) );
    }

    get zoom ( ) { return Math.max ( this._targetZoom, 0.0001); }

    getClosestToCenterInCamera ( camera )
    {
        let minDistance = 10000;
        let closest = 0;

        let world = new Vector3();

        for ( let i = 0; i < this.pages.length; i++ )
        {
            let b = this.pages[i].bounds;
            b.getCenter(world);
            world.project(camera);
            let length = world.length(); // Distance to (0, 0, 0);
            if ( length < minDistance )
            {
                minDistance = length;
                closest = i;
            }
        }

        return this.pages[closest];
    }
}

export { Document, DocumentGrid }