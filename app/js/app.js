/**
 * @project DXLAB Poetry In Motion
 * @author @axjxwright / http://axinteractive.com.au
 * 
 * As will be abundantly clear by reading what follows, I am not a web programmer.
 * This project was originally a large scale physical installation but the coronavirus
 * had different ideas, forcing me to target the web instead. I don't know how people
 * write javascript all day, it is _truly_ an abomination. I'm looking forward to returning
 * to C++ where things make sense. ;)
 * 
 * - Andrew (@axjxwright)
 */

import * as THREE from './lib/three.module.js';
import * as Post from './lib/postprocessing/EffectComposer.js';
import Stats from './lib/stats.module.js';
import * as dat from './lib/dat.gui.module.js';

import { RenderPass } from './lib/postprocessing/RenderPass.js';
import { Pass } from './lib/postprocessing/Pass.js';
import { MultiPassRadialEdgeBlur } from './slnsw/postprocessing/MultiPassRadialEdgeBlur.js';
import { SceneManager } from './slnsw/scenes/SceneManager.js';
import { FontLoader } from './slnsw/FontLoader.js';
import { MeshBasicMaterial } from "./lib/three.module.js";
import { RendererStats } from "./lib/threex.rendererstats.js";
import "./lib/hammer.min.js"

const kDebugBuild = false;
var kStats = null;
var kRendererStats = null;

const camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = -4;
camera.lookAt(new THREE.Vector3());

const artCamera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.01, 1000 );
artCamera.position.z = -4;
artCamera.lookAt ( new THREE.Vector3() );

const renderer = new THREE.WebGLRenderer( { antialias: true, alpha : true, powerPreference : "high-performance" } );
renderer.setClearColor( 0xffffff, 0 );
renderer.setSize( getWindowSize()[0], getWindowSize()[1] );

var sceneNode = document.getElementById("scene");
sceneNode.appendChild( renderer.domElement );

const progressBar = document.querySelector( '#progress' );
const loadingOverlay = document.querySelector( '#loading-overlay' );

let percentComplete = 1;
let percentCompleteTarget = 1;
let frameID = null;

const updateAmount = 0.01;

const animateBar = () => 
{
    percentCompleteTarget += updateAmount;
    percentComplete = THREE.MathUtils.lerp(percentComplete, percentCompleteTarget, 0.2);
    progressBar.style.width = percentComplete + '%';
    frameID = requestAnimationFrame( animateBar );
}

animateBar();

let manager = new THREE.LoadingManager();
manager.onStart = function ( url, itemsLoaded, itemsTotal ) 
{
    if ( kDebugBuild ) console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );

    if ( frameID !== null ) return;
    animateBar();	
};

manager.onLoad = function ( ) 
{
    loadingOverlay.remove();
    sceneNode.classList.add("screen-change-in");

    cancelAnimationFrame( frameID );

    if ( kDebugBuild ) console.log( 'Loading complete!');
    OnReady();
};

manager.onProgress = function ( url, itemsLoaded, itemsTotal ) 
{
    percentCompleteTarget = (itemsLoaded/itemsTotal) * 100.0;
	if ( kDebugBuild ) console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
};

manager.onError = function ( url ) 
{
	if ( kDebugBuild ) console.log( 'There was an error loading ' + url );
};

var backgroundTexture = null;
var pageJSONData = null;

FontLoader.kDefaultFont = new FontLoader( manager, "assets/Nimbus-MSDF.json", "assets/Nimbus-MSDF.png" );
const backgroundLoader = new THREE.TextureLoader ( manager );
backgroundLoader.load( 'img/background-dark.jpg', function ( texture )
{
    backgroundTexture = texture;
} );

new THREE.FileLoader ( manager ).load ( "assets/pages.json", function ( data ) { pageJSONData = JSON.parse(data); } );

function loadBackground ( url )
{
    const backgroundLoader = new THREE.TextureLoader ( );
    backgroundLoader.load( url, function ( texture )
    {
        backgroundTexture = texture;
        sceneManager.documentLayer.scene.background = backgroundTexture;
    } );
}

function loadDarkBackground ( )
{
    loadBackground ( "img/background-dark.jpg" );
}

function loadLightBackground ( )
{
    loadBackground ( "img/background-light.jpg" );
}

let themeColors = 
{
    "Theme Colour" : "#FFFFFF",
    "Spiral Is Black" : false,
    "load_dark" : loadDarkBackground,
    "load_light" : loadLightBackground,
};

var sceneManager;

function getWindowSize ( )
{
    return [ document.documentElement.clientWidth, document.documentElement.clientHeight ];
}

function OnReady ()
{
    let info = document.getElementById("info_btn");
    info.addEventListener ( "click", function ( e )
    {
        let popup = document.getElementById("takeover");
        popup.classList.add("active");
    } );

    let infoClose = document.getElementById("popup_content");
    infoClose.addEventListener ( "click", function ( e )
    {
        let popup = document.getElementById("takeover");
        popup.classList.remove("active");
    } );

    const datGui = new dat.GUI( { autoPlace: kDebugBuild } );
    sceneManager = new SceneManager( null, camera, kDebugBuild ? datGui : null, pageJSONData, renderer.domElement );
    sceneManager.documentLayer.scene.background = backgroundTexture;

    datGui.addColor(themeColors, "Theme Colour").listen().onChange(() => { sceneManager.documentLayer.setThemeColor(themeColors["Theme Colour"]); } );
    datGui.add(themeColors, "Spiral Is Black").listen().onChange(() => 
    { 
        artBlit.material.blending = themeColors["Spiral Is Black"] ? THREE.SubtractiveBlending : THREE.AdditiveBlending;
    } );

    datGui.add ( themeColors, "load_dark").name("Dark BG");
    datGui.add ( themeColors, "load_light").name("Light BG");
    
    renderer.domElement.addEventListener("wheel", (event) => 
    { 
        event.preventDefault();
        sceneManager.onScroll(event.deltaY) 
    }, true);
    
    var input = new Hammer(renderer.domElement);

    input.get('pan').set({ direction: Hammer.DIRECTION_ALL });
    input.get('pinch').set({ enable: true });
    input.on('pan', (ev) => { sceneManager.pan ( ev.velocityX, ev.velocityY ); } );
    input.on('pinch' , (ev) => 
    { 
        ev.preventDefault();
        sceneManager.zoom ( Math.pow(ev.scale, 0.1) ); 
    } );

    input.get("tap").set({ enable : true, taps : 2, interval : 600 } )
    input.on("tap", (ev) => { sceneManager.onDoubleTap(ev); } );

    if ( kDebugBuild )
    {
        kStats = new Stats();
        kStats.showPanel( 0 );
        document.body.appendChild( kStats.dom );

        kRendererStats = new RendererStats();
        kRendererStats.domElement.style.position = 'absolute'
        kRendererStats.domElement.style.left = '0px'
        kRendererStats.domElement.style.bottom = '0px'
        document.getElementById("scene").appendChild ( kRendererStats.domElement );
    }

    const artComposer = new Post.EffectComposer( renderer );
    const artPass = new RenderPass( sceneManager.artPhaseLayer.scene, artCamera, null, 0xFFFFFF, 0.0 );
    artComposer.renderToScreen = false;
    artComposer.addPass(artPass);
    const artBlur = new MultiPassRadialEdgeBlur( artComposer, datGui, 2 );

    sceneManager.artPhaseLayer.camera = artCamera;
    const docComposer = new Post.EffectComposer( renderer );
    const docPass = new RenderPass( sceneManager.documentLayer.scene, camera, null, 0x000000, 1.0  );
    docComposer.renderToScreen = false;
    docComposer.addPass( docPass );
    sceneManager.documentLayer.blur = new MultiPassRadialEdgeBlur( docComposer, datGui, 2 );

    window.addEventListener( 'resize', function ()
    {
        let size = getWindowSize();

        renderer.setSize( size[0], size[1] );
        docComposer.setSize( size[0], size[1] );
        artComposer.setSize( size[0], size[1] );
        camera.aspect = size[0] / size[1];
        camera.updateProjectionMatrix();

        artCamera.aspect = size[0] / size[1];
        artCamera.updateProjectionMatrix();
    } );

    let docBlit = new Pass.FullScreenQuad( new MeshBasicMaterial ( { transparent : false, map : docComposer.renderTarget2.texture } ) );
    let artBlit = new Pass.FullScreenQuad( new MeshBasicMaterial ( { transparent : true, premultipliedAlpha : false, blending : THREE.AdditiveBlending, map : artComposer.renderTarget2.texture } ) );

    renderer.autoClear = false;
    renderer.info.autoReset = false;

    const animate = function ()
    {
        renderer.info.reset();
        requestAnimationFrame( animate );

        let inner = THREE.Math.lerp( 0.0, 0.2, sceneManager.crossfade );
        let outer = THREE.Math.lerp( 0.0, 1.2, sceneManager.crossfade );

        artBlur.setBlur ( inner, outer, 0.1 );

        if ( kStats ) kStats.begin();

        sceneManager.update();

        docComposer.render();
        artComposer.render();

        docBlit.render( renderer );
        artBlit.render( renderer );

        if ( kStats ) kStats.end();
        if ( kRendererStats ) kRendererStats.update ( renderer );

    };

    animate();
}
