import css from './style.css';
var contentData = "./assets/Content.json";

//import * as PIXI from 'pixi.js'
import { Application, Container, Graphics, Loader, Sprite, Texture, Text } from 'pixi.js'


//import { BasisLoader } from '@pixi/basis';
//import { Loader } from '@pixi/loaders';

//Loader.registerPlugin(BasisLoader);
// Use this if you to use the default
//BasisLoader.loadTranscoder('./assets/js/basis_transcoder.js', './assets/js/basis_transcoder.wasm');

import { DataReportMode, IRDataType, IRSensitivity } from "./wiimote-webhid/src/const.js";
import WIIMote from './wiimote-webhid/src/wiimote.js'

// const controller = new Controller();
let performance = {}
performance.start = new Date().getTime();
performance.loaded = null;
performance.result = null;

let loadingEl = null;
let loadingElMsg = null;

let wapp = {};
wapp.W = $(window).width();
wapp.H = $(window).height();
let w = window;

const cols_blue1 = 0x132CAD
const cols_grey = 0x5c5c5c


const flipSpeed = 0.01;
let flipKey = 0;
let flipActions = {
    "UP": {
        state: false
    },
    "DOWN": {
        state: false
    },
    "LEFT": {
        state: false
    },
    "RIGHT": {
        state: false
    }
}
w.flipActions = flipActions;



const selectorSpeed = 0.01;
let selectorKey = 0;

let mC
let canvasItems = []
let paintingArea
let vBrush
let sBrush


let scale1 = 0.24

let selected;
let selectedGraphic = 0;

let selectedTool = 0;
let selectedToolGraphic = 0;

let editToolSelection;
let editToolSelectionData;

let paintTool;

var device = null; //bluetooth connection
var wiimote = null; //wiimote

let wiimotes = [];
window.wiimotes = wiimotes;

var buttonState = {
    A: false,
    B: false,
    MINUS: false,
    DPAD_LEFT: false,
    DPAD_RIGHT: false
}

var dtwTest = null;
var app = null;
let ledK = 0;

let textures = []

function circleLed() {
    setInterval(function() {
        ledK++;
        if (ledK >= 4) {
            ledK = 0;
        }
        for (var i = 0; i < 4; i++) {
            if (i == ledK) {
                wiimotes[wiipos].toggleLed(ledK)
            }
        }
    }, 500)
}


function enableControls() {

    console.log("enableControls", wiimotes.length)

    // //wiimotes[wiipos].toggleLed(2)
    // circleLed()

    let wiipos = wiimotes.length-1;

    wiimotes[wiipos].initiateIR()

    wiimotes[wiipos].toggleLed(wiipos)

    // wiimotes[wiipos].BtnListener = function(buttons) {

    //     /* buttons

    //         A: false
    //         B: false
    //         DPAD_DOWN: false
    //         DPAD_LEFT: false
    //         DPAD_RIGHT: false
    //         DPAD_UP: false
    //         HOME: false
    //         MINUS: false
    //         ONE: false
    //         PLUS: false
    //         TWO: false

    //     */


    wiimotes[wiipos].BtnListener = (buttons) => {

        var buttonJSON = JSON.stringify(buttons, null, 2);


        const { x, y } = vBrush

        if (buttons.MINUS == true) {
            if (buttonState.MINUS == false) {
                buttonState.MINUS = true
            }
        }

        if (buttons.MINUS == false && buttonState.MINUS == true) {
            var a = app.renderer.plugins.interaction.hitTest({ x: x, y: y })

            if (a != undefined) {
                a.alpha = 0.5
                // a.destroy();
            }
            buttonState.MINUS = false
        }


        // B is in the belly of the controller
        //
        if (buttons.B == true) {

            var a = app.renderer.plugins.interaction.hitTest({ x: x, y: y })

            if (buttonState.B == false) {

                a.emit("pointertap")
                a.emit("mousedown")

                buttonState.B = true
            }

            a.emit("mousemove")
        }

        if (buttons.B == false && buttonState.B == true) {
            var a = app.renderer.plugins.interaction.hitTest({ x: x, y: y })

            buttonState.B = false
            a.emit("mouseup")

        }


        if (buttons.HOME == true) {
            clearAllCanvas();
        }

        if (buttons.A == true) {
            leftRightSelector(1)
        }


        if (buttons.ONE == true) {
            app.playing = true;
        }

        if (buttons.TWO == true) {
            app.playing = false;
        }




        if (buttons.MINUS == true) {
            textureScale(-1);
        }

        if (buttons.PLUS == true) {
            textureScale(1);
        }


        // flippin
        if (buttons.DPAD_UP == true) {
            flipScale("UP");
        }
        if (buttons.DPAD_DOWN == true) {
            flipScale("DOWN");
        }
        if (buttons.DPAD_LEFT == true) {
            flipScale("LEFT");
        }
        if (buttons.DPAD_RIGHT == true) {
            flipScale("RIGHT");
        }




        /*        if (buttons && buttons.DPAD_RIGHT == true) {
                    leftRightSelector(1)
                }*/



        /*        if(document.getElementById('buttons').innerHTML != buttonJSON){
                  document.getElementById('buttons').innerHTML = buttonJSON
                }*/



    }

    wiimotes[wiipos].AccListener = (x, y, z) => {

        if (vBrush) {
            vBrush.angle = (x * -1 + 120) * -1;
            let angles = String(vBrush.angle).substr(0, 4)

            document.getElementById('accA').innerHTML = angles
        }

        //document.getElementById('accX').innerHTML = x
        //document.getElementById('accY').innerHTML = y
        //document.getElementById('accZ').innerHTML = z

        document.getElementById('accXYZ').innerHTML = x + " " + y + " " + z;


    }

    wiimotes[wiipos].IrListener = (pos) => {

        if (pos.length < 1) {
            return
        }

        var _sW = 1366; //app.stage.width
        var pX = _sW - pos[0]["x"];

        if (pX >= 1365) {
            pX = 1365
        }

        vBrush.x = pX; //max 1016
        vBrush.y = pos[0]["y"] //max 760


        sBrush.x = vBrush.x;
        sBrush.y = vBrush.y;

        sBrush.angle = vBrush.angle * 5; //90*(Math.PI/180)



        //document.getElementById("IRdebug").innerHTML = JSON.stringify(pos, null, true)
        document.getElementById("IRdebug").innerHTML = pos[0]["x"] + " " + pos[0]["y"] + "_pX:" + pX + " _sW:" + _sW;
    }




}

window.enableControls = enableControls



function initController() {

    console.log("initController - buttonsW")

    var buttonsW = document.getElementById("buttonsW")

    var conBut = document.createElement("button");

    conBut.innerText = "+ CONNECT WiiMOTE";
    conBut.className = "bu";
    conBut.id = "request-hid-device"

    conBut.onclick = async function() { // Note this is a function
        // controller.newDevice(pop, _connected)

        try {

            const devices = await navigator.hid.requestDevice({
                filters: [{ vendorId: 0x057e }],
            });

            device = devices[0];
            
            const wiimote = new WIIMote(device)

            wiimotes.push(wiimote);


            window.wiimote = wiimotes[0];

            //console.log("devices array:", devices)
            //console.log("device", device)
            
            //document.getElementById("buttons").style.display = "none";
            loadingEl.style.display = "none";

        } catch (error) {
            console.log("An error occurred.", error);

        }

        if (!device) {
            console.log("No device was selected.");

        } else {

            console.log(`HID: ${device.productName}`);

            setTimeout(() => {

                // mC.removeChild(tempGUI)
                // mC.removeChild(tempLOGO)

                enableControls()
            }, 200);

        }
    }

    buttonsW.appendChild(conBut)


    /*    window.navigator.hid.addEventListener('connect', ({device}) => {
          console.log(`HID connected: ${device.productName}`);
        });   


        window.navigator.hid.addEventListener('disconnect', ({device}) => {
          console.log(`HID disconnected: ${device.productName}`);
        });     


        device.addEventListener("inputreport", event => {
          const { data, device, reportId } = event;

          // Handle only the Joy-Con Right device and a specific report ID.
          if (device.productId !== 0x2007 && reportId !== 0x3f) return;

          const value = data.getUint8(0);
          if (value === 0) return;

          const someButtons = { 1: "A", 2: "X", 4: "B", 8: "Y" };
          console.log(`User pressed button ${someButtons[value]}.`);
        });*/


    // let virtControl = document.createElement("button");

    //     virtControl.className = "bu";
    //     virtControl.innerText = "+ V";

    //     virtControl.onclick = function() { // Note this is a function
    //         console.log("Virtual controller connected")

    //         setTimeout(() => {
    //             mC.removeChild(tempGUI);
    //             mC.removeChild(tempLOGO)
    //         }, 2000);
    //     }

    // buttonsW.appendChild(virtControl)


    // var clearBtn = document.createElement("button");

    //     clearBtn.innerText = "CLEAR PAINTING";
    //     clearBtn.className = "bu";

    //     clearBtn.onclick = function() { // Note this is a function
    //         canvasItems.forEach(item => {
    //             item.destroy()
    //         });
    //         canvasItems = []
    //         // mC.destroy()
    //         // app.stage.destroy(true)
    //         // document.getElementsByTagName("canvas")[0].remove()
    //         // // mC = new Container();
    //         // initPixi()
    //         // app.stage.addChild(mC);
    //     };

    // buttonsW.appendChild(clearBtn)

}

async function test(d) {
    d.addEventListener("rawdata", function(data) {
        dtwTest.push(data)
    });

    await d.rawdata.start();
}

/* ----- NEW STUFF --------- */

// ATTACHED TO 'HOME' BUTTON

function clearAllCanvas() {

    canvasItems.forEach(item => {
        item.destroy()
    });
    canvasItems = []


}





/* --------- */

/*function gestureEvent(name) {

    const mouvements = {
        "up": 5,
        "down": 6,
        "swing": 8
    }

    const texture = Texture.from('./assets/GAM_WALL_EXP/GAM_svg/DE-MARIA_-0' + mouvements[name] + '.svg')
    const svg = new Sprite(texture);

    svg.anchor.set(0.5);
    //svg.scale.set(0.3,0.3)

    svg.x = Math.floor(Math.random() * (app.screen.width - 150)) + 50
    svg.y = Math.floor(Math.random() * (app.screen.height - 150)) + 50

    mC.addChild(svg);
}*/

// function _connected(d){
//     controller.rawDataListener(d.deviceID, test)
//     tempGUI.text = "Controller "+ d.device.name + " connected"

//     dtwTest = new dtw(gestureEvent)

//     test(d)

//     console.log("_connected: ", d)
//     setTimeout(() => {
//         mC.removeChild(tempGUI);
//         mC.removeChild(tempLOGO)
//     }, 2000);
// }

// function help() {
//     var a  = controller.currentDevices()
//     console.log(a)
// }

function initPixi() {

    let view = document.getElementById("screen")

    app = new Application({
        /*        width: wapp.W, 
                height: wapp.H, */
        backgroundColor: cols_blue1,
        resolution: window.devicePixelRatio || 1,
        resizeTo: window
    });

    app.playing = false;


    // app.renderer.plugins.interaction.cursorStyles.default = "url('./src/assets/cursor/1/cursor_96.png'), auto";
    // app.renderer.plugins.interaction.cursorStyles.hover = "url('./src/assets/cursor/1/cursor_96.png'), auto";
    // app.renderer.plugins.interaction.cursorStyles.pointer = "url('./src/assets/cursor/1/cursor_96.png'), auto";



    window.app = app

    view.appendChild(app.view);

    app.stage.addChild(mC);

    mC.addChild(vBrush)

    mC.addChild(sBrush)






    function pop(textureId, x, y) {

        var texture, svg;

        if (textureId == "random") {

            texture = textures[Math.floor(Math.random() * textures.length)]
            svg = new Sprite(texture);
            svg.x = Math.floor(Math.random() * (app.screen.width - 150)) + 50
            svg.y = Math.floor(Math.random() * (app.screen.height - 150)) + 50

        } else {


            texture = textures[textureId]

            svg = new Sprite(texture);
            svg.scale.set(scale1, scale1);
            svg.x = x
            svg.y = y

            svg.speedX = Math.random() * 3 - Math.random() * 3
            svg.speedY = Math.random() * 3 - Math.random() * 3

            svg.angle = vBrush.angle * 5;
            svg.scale.set(sBrush.scale.x, sBrush.scale.y);



        }

        svg.anchor.set(0.5);
        svg.zIndex = 1;

        // svg.buttonMode = true;

        mC.addChild(svg);

        console.log("pop(textureId, x, y)", textureId, x, y, "textures.length", textures.length)

        return svg
    }


    function leftRightSelector(dir) {

        // leftRightSelector

        if (dir < 1) {
            selectorKey -= selectorSpeed;
        } else {
            selectorKey += selectorSpeed;
        }


        let v = Math.floor(selectorKey);


        if (v >= textures.length) {
            v = 1;
            selectorKey = v;
        }

        if (v < 1) {
            v = textures.length;
            selectorKey = v;
        }

        selectedGraphic = v;

        sBrush.texture = textures[v]


        console.log("leftRightSelector(dir), selectedGraphic", dir, selectedGraphic)

    }

    w.leftRightSelector = leftRightSelector;



    function freeState(obj,arg) {
        for(let a in obj) {
             if(obj[arg].state == "pressed" && a != arg) {
                  obj[a].state = false;
             }
        }
    }
    w.freeState = freeState;

    function flipScale(d) {
        // console.log(d)
        if(flipActions[d].state == false) {
            flipActions[d].state = "pressed";
            if(d == "UP" || d == "DOWN") {
                sBrush.scale.y = - sBrush.scale.y;
            }
            if(d == "LEFT" || d == "RIGHT") {
                sBrush.scale.x = - sBrush.scale.x; 
            }
            freeState(flipActions,d);
        }
    }

    w.flipScale = flipScale;






    function textureScale(dir) {

        console.log("textureScale, dir", dir)


        sBrush.scale.x += dir * 0.001;


        // if(sBrush.scale.x < sBrush.maxScale){
        //     sBrush.scale.x += 0.01
        // } else {
        //     sBrush.scale.x = sBrush.maxScale            
        // }

        // if(sBrush.scale.x < sBrush.minScale) {
        //     sBrush.scale.x = sBrush.minScale;

        // }


        sBrush.scale.y = sBrush.scale.x;


        //sBrush.scale.set(nscale)

    }


    w.textureScale = textureScale;




    function _selected(textureId, x, y) {

        console.log("_selected: textureId, x, y", textureId, x, y)

        if (selected != null) {
            mC.removeChild(selected)
        }

        selected = new Graphics();
        selected.beginFill(0xFFC0CB, 0.4);
        selected.drawRect(x - 35, wapp.H - 80, 80, 80);
        selected.endFill();
        selected.zIndex = 10
        selectedGraphic = textureId

        mC.addChild(selected)
    }


    function changeTool(tool) {
        console.log("changeTool(tool)", tool)
        selectedTool = tool
    }
    w.changeTool = changeTool;


    function _toolSelect(tool, x, y) {

        console.log("_toolSelect(tool, x, y)", tool, x, y)

        if (selectedTool != null) {
            mC.removeChild(selectedToolGraphic)
        }

        selectedToolGraphic = new Graphics();
        selectedToolGraphic.beginFill(0xffffff, 0.4);
        selectedToolGraphic.drawRect(x, y, 80, 80);
        selectedToolGraphic.endFill();
        selectedToolGraphic.zIndex = 10
        selectedTool = tool;

        mC.addChild(selectedToolGraphic)
    }

    function resetEditTool() {

        console.log("resetEditTool")

        editToolSelection = null
        canvasItems.map((x) => {
            x.alpha = 1
            x.interactive = false
            x.removeAllListeners();
        })
    }

    function loadTools() {

        console.log("loadTools")

        const graphics = new Graphics();
        graphics.beginFill(cols_grey);
        graphics.drawRect(0, 0, 80, wapp.H);
        graphics.endFill();

        graphics.zIndex = 10

        //mC.addChild(graphics)


        paintTool = new Text("Paint", { fontFamily: 'Arial', fontSize: 24, fill: 0xffffff, align: 'center' })
        paintTool.x = 12
        paintTool.y = 25
        paintTool.interactive = true
        paintTool.zIndex = 11


        paintTool.on("pointertap", () => {

            _toolSelect("paint", 0, 0)
            resetEditTool()
        })

        //mC.addChild(paintTool)


        const editTool = new Text("Edit", { fontFamily: 'Arial', fontSize: 24, fill: 0xffffff, align: 'center' })
        editTool.x = 18
        editTool.y = 25 * 4
        editTool.interactive = true
        editTool.zIndex = 11

        editTool.on("pointertap", () => {

            _toolSelect("edit", 0, 75)

            canvasItems.forEach(item => {

                item.interactive = true
                item.alpha = 0.2

                item.on("pointertap", () => {

                    canvasItems.map(x => x.alpha = 0.2)

                    // if(editToolSelection != null){
                    //     editToolSelection.removeAllListeners();
                    // }

                    editToolSelection = item;
                    item.alpha = 1

                    item
                        .on('mousedown', (event) => {
                            if (editToolSelection == item) {
                                editToolSelectionData = vBrush
                            }
                        })

                        .on('touchstart', (event) => {

                        })

                        .on('mouseup', onDragEnd)
                        .on('mouseupoutside', onDragEnd)
                        .on('touchend', onDragEnd)
                        .on('touchendoutside', onDragEnd)
                        .on('mousemove', onDragMove)
                        .on('touchmove', onDragMove);


                })
            });
        })

        //mC.addChild(editTool)


    }


    function onDragEnd() {
        editToolSelectionData = null
    }

    function onDragMove() {
        if (editToolSelectionData != null) {
            editToolSelection.x = editToolSelectionData.x
            editToolSelection.y = editToolSelectionData.y
        }
    }

    function loadTextures() {

        const bottomBackgroundTool = new Graphics();
        bottomBackgroundTool.beginFill(cols_grey);
        bottomBackgroundTool.drawRect(0, wapp.H - 80, wapp.W, 100);
        bottomBackgroundTool.endFill();
        bottomBackgroundTool.zIndex = 10
        //mC.addChild(bottomBackgroundTool)

        const list = [0, 1, 3, 5, 7, 8, 11, 14, 15]

        // list.forEach((item, index) => {


        //     const x = 50+(index * 110)
        //     const y = 560

        //     const svgItem = pop(item, x, y)

        //     svgItem.scale.set(0.6, 0.6)
        //     svgItem.interactive = true
        //     svgItem.zIndex = 11


        //     // svgItem.on('pointertap', () => {
        //     //     // alert(textureId, x, y)
        //     //     _selected(item, x, y)
        //     // });


        // });
    }


    loadTools()

    loadTextures()

    window.pop = pop


    changeTool("paint");


    app.ticker.add((delta) => {

        if (app.playing) {

            canvasItems.forEach(item => {
                if (item.x > wapp.W) {
                    item.x = -item.width;
                }
                if (item.x < -item.width) {
                    item.x = wapp.W;
                }
                if (item.y > wapp.H) {
                    item.y = -item.height;
                }
                if (item.y < -wapp.H) {
                    item.y = wapp.H + item.height;
                }
                item.x += item.speedX;
                item.y += item.speedY;
                item.angle += 0.1
                //console.log(wapp.W, item.x)
            });
        }
    })


    initController();




}


function resizeGame() {

    console.log("resizeGame:", $(window).width())

    wapp.W = $(window).width();
    wapp.H = $(window).height();

    document.getElementById("IRdebug").innerHTML = wapp.W + " x " + wapp.H;


}

window.textures = textures;



function addSprites(resources) {

    console.log("addSprites")

    Object.keys(resources).forEach(key => {
        //console.log(resources[key]);
        console.log('addSprites:', key)
        textures.push(resources[key].texture)

    });

    setupStage()
}


function parsingMiddleware() {

    console.log("parsingMiddleware");

}


function loadAssets() {

    console.log("loadAssets", wapp.data.shapes[0].n);


    const loader = Loader.shared;

    for (let i = 0; i <= wapp.data.shapes.length - 1; i++) {

        let path = wapp.data.shapes[i].p;
        let name = wapp.data.shapes[i].n;
        //console.log(i, name, path)
        loader.add(name, path)
    }

    loader.load((loader, resources) => {})


    //loader.use(parsingMiddleware)

    loader.onProgress.add((res) => {
        console.log("loading...", res.progress)
        loadingElMsg.innerHTML = ""+Math.round(res.progress)+"%";
    }); // called once per loaded/errored file

    loader.onError.add((err) => {
        console.log("Error loading...")
        loadingElMsg.innerHTML = "Error"+err+"";
    }); // called once per errored file

    loader.onLoad.add(() => {
        console.log("- loaded")
    }); // called once per loaded file    

    loader.onComplete.add(() => {
        console.log("onComplete");
        performance.loaded = new Date().getTime();
        performance.result = (performance.loaded - performance.start) / 1000 + " sec"
        console.log("onComplete: in", performance.result);
        loadingElMsg.innerHTML = "Loader complete in "+performance.result;
        const resources = loader.resources;
        addSprites(resources);
    });


}


/*function loadAssets() {

    console.log("loadAssets"); 


    const loader = Loader.shared; 

    for (let index = 1; index <= 17; index++) {
        const strI = (index < 10) ? "0" + index : index + '';
        let strName = 'shape'+strI
        console.log("strName:", strName)

        //loader.add(strName, './assets/shapes/basis/'+strI+'.basis')
        loader.add(strName, './assets/shapes/png-tiny/'+strI+'.png')
    }

    loader.load((loader, resources) => {})


    //loader.use(parsingMiddleware)

    loader.onProgress.add(() => {
        console.log("loading...")
    }); // called once per loaded/errored file

    loader.onError.add(() => {
        console.log("Error loading...")
    }); // called once per errored file

    loader.onLoad.add(() => {
        console.log("- loaded")        
    }); // called once per loaded file    

    loader.onComplete.add(() => {
        console.log("onComplete");
        const resources             = loader.resources;
        addSprites(resources);
    });


}*/


function setupStage() {

    console.log("setupStage");

    mC = new Container();
    mC.interactive = true
    mC.buttonMode = true
    mC.sortableChildren = true



    paintingArea = new Graphics();
    paintingArea.beginFill(cols_blue1);
    paintingArea.drawRect(0, 0, wapp.W, wapp.H);
    paintingArea.endFill();
    paintingArea.zIndex = 1
    paintingArea.interactive = true

    vBrush = Sprite.from("./assets/brushes/brush6.png"); //Sprite.from(textures[5])
    vBrush.zIndex = 10000000;

    window.vBrush = vBrush;

    sBrush = Sprite.from(textures[0])

    sBrush.zIndex = 50000;
    sBrush.scale.set(scale1 * 0.9)
    sBrush.anchor.set(0.5)
    sBrush.minScale = 0.1;
    sBrush.maxScale = 2;


    window.sBrush = sBrush;

    paintingArea.on('pointertap', (pointer) => {

        const { x, y } = vBrush //pointer.data.global

        if (selectedTool == "paint") { //  && x > 80+50
            let svgItem = pop(selectedGraphic, x, y)
            canvasItems.push(svgItem)
        }

        console.log("paintingArea.on('pointertap', (pointer), selectedTool", pointer, selectedTool)

    });

    mC.addChild(paintingArea)



    initPixi();


}





/*

    Init and Config
    ----------------------

                        */


function loadConfig(callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', contentData, true);
    xobj.onreadystatechange = function() {
        //console.log('xobj.readyState',xobj.readyState)
        if (xobj.readyState == 4 && xobj.status == "200") {
            callback(xobj.responseText);
        }
    };
    xobj.send(null);
}


//read setup
function initConfig() {

    loadingEl = document.getElementById('loading')
    loadingElMsg = document.getElementById('loading-msg')

    loadConfig(function(response) {
        // Parse JSON string into object
        wapp.data = JSON.parse(response);
        loadAssets();
    });
}

initConfig();





window.addEventListener('resize', resizeGame, false);