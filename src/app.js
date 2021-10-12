// import Controller from './thingy_support/main.js';
// import dtw from './dtw.js';

import css from './style.css';
import * as PIXI from 'pixi.js'

import { DataReportMode, IRDataType, IRSensitivity } from "./wiimote-webhid/src/const.js";
import WIIMote from './wiimote-webhid/src/wiimote.js'

// const controller = new Controller();

const HEIGHT = 600
const WIDTH = 1000
const BACKGROUND_COLOR = 0x132CAD
const UI_BACKGROUND_COLOR = 0x5c5c5c

/* Main Container */
var mC = new PIXI.Container();

//var tempGUI = new PIXI.Text("Please connect a controller", {fontFamily : 'Arial', fontSize: 24, fill : 0xffffff, align : 'center'})
//var tempLOGO = PIXI.Sprite.from("/src/assets/5gtours.png")

var canvasItems = []

var paintingArea = new PIXI.Graphics();
    paintingArea.beginFill(BACKGROUND_COLOR);
    paintingArea.drawRect(0, 0, 1000, 1000);
    paintingArea.endFill();
    paintingArea.zIndex = 1
    paintingArea.interactive = true

var vBrush = PIXI.Sprite.from("./assets/brushes/brush2.png")
    vBrush.zIndex = 10000000;
    // vBrush.lineStyle(0);
    // vBrush.beginFill(0xFFFF0B, 0.5);
    // vBrush.drawCircle(470, 90,60);
    // vBrush.endFill();


var selected;
var selectedGraphic = 0;

var selectedTool = 0;
var selectedToolGraphic = 0;

var editToolSelection;
var editToolSelectionData;

var paintTool;

//wiimote
var device = null; //bluetooth connection
var wiimote = null; //wiimote
var buttonState = {
    A: false,
    MINUS: false
}

mC.interactive = true
mC.buttonMode = true
mC.sortableChildren = true

paintingArea.on('pointertap', (pointer) => {
     const {x, y} = vBrush//pointer.data.global

    if(selectedTool == "paint"){ //  && x > 80+50
        let svgItem = pop(selectedGraphic, x, y)
        canvasItems.push(svgItem)
    }
});

mC.addChild(paintingArea)


var dtwTest = null;
var app = null;

// let requestButton = document.getElementById("request-hid-device");


let ledK = 0;
function circleLed() {

    setInterval(function() {
        
        ledK++;
        if(ledK >=4) {
            ledK = 0;
        }
        for(var i=0; i<4; i++ ){
            if(i == ledK) {
                wiimote.toggleLed(ledK)
            }
        }


    }, 500)


}


function enableControls() {


    console.log("enableControls")

    
    // //wiimote.toggleLed(2)
    // circleLed()

    wiimote.initiateIR()

    // wiimote.BtnListener = function(buttons) {


        

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

    //     if(buttons) {

    //        console.log("buttons", buttons) 

    //    } else {
           
    //        console.log("no buttons");

    //    }


    // }



    // wiimote.AccListener = function(pos) {

    //     //x,y,z
    //     //console.log("AccListener pos",pos)


    // }


    // wiimote.IrListener = function(pos) {


    //     //console.log("IrListener pos", pos)

    //     // if(pos[0]){
    //     //   console.log("DEV 0 IrListener pos x", pos[0]["x"])
    //     // }

    //     // if(pos[1]){
    //     //   console.log("DEV 1 IrListener pos x", pos[1]["x"])
    //     // }        


    //     if(pos.length < 1){
    //       return
    //     }

    //     vBrush.x = WIDTH-pos[0]["x"] //max 1016
    //     vBrush.y = pos[0]["y"] //max 760

    //     document.getElementById("IRdebug").innerHTML = JSON.stringify(pos, null, true)


    //   }    



    wiimote.BtnListener = (buttons) => {

        var buttonJSON = JSON.stringify(buttons, null, 2);



        const {x, y} = vBrush

        if(buttons.MINUS == true){
            if(buttonState.MINUS == false){
                buttonState.MINUS = true
            }
        }

        if(buttons.MINUS == false && buttonState.MINUS == true){
            var a = app.renderer.plugins.interaction.hitTest({x: x, y: y})

            if(a != undefined){
                a.alpha = 0.5
                // a.destroy();
            }
            buttonState.MINUS = false
        }



        if(buttons.A == true){

            var a = app.renderer.plugins.interaction.hitTest({x: x, y: y})

            if(buttonState.A == false){

                a.emit("pointertap")
                a.emit("mousedown")

                buttonState.A = true
            }

            a.emit("mousemove")
        }

        if(buttons.A == false && buttonState.A == true){
            var a = app.renderer.plugins.interaction.hitTest({x: x, y: y})

            buttonState.A = false
            a.emit("mouseup")

        }


        if(document.getElementById('buttons').innerHTML != buttonJSON){
          document.getElementById('buttons').innerHTML = buttonJSON
        }
    }

    wiimote.AccListener = (x,y,z) => {

        if(vBrush) {
            vBrush.angle = (x*-1+120)*-1;
            let angles = String(vBrush.angle).substr(0,4)
            document.getElementById('accA').innerHTML = angles
        }

        document.getElementById('accX').innerHTML = x
        document.getElementById('accY').innerHTML = y
        document.getElementById('accZ').innerHTML = z
      }

    wiimote.IrListener = (pos) => {
        if(pos.length < 1){
          return
        }

        vBrush.x = WIDTH-pos[0]["x"] //max 1016
        vBrush.y = pos[0]["y"] //max 760

        document.getElementById("IRdebug").innerHTML = JSON.stringify(pos, null, true)
      }




}


function initController(){

    //console.log("")

    var toolbox = document.getElementById("toolbox")

    var element = document.createElement("button");
        element.innerText = "+ C";
        element.className = "bu";
        element.id = "request-hid-device"
        element.onclick = async function() { // Note this is a function
            // controller.newDevice(pop, _connected)
            try {
                const devices = await navigator.hid.requestDevice({
                    filters: [{ vendorId: 0x057e }],
                });

                device = devices[0];
                wiimote = new WIIMote(device)

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
                },200);

            }
        }

    toolbox.appendChild(element)

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

    // toolbox.appendChild(virtControl)


    var clearBtn = document.createElement("button");
        clearBtn.innerText = "R!";
        clearBtn.className = "bu";
        clearBtn.onclick = function() { // Note this is a function
            canvasItems.forEach(item => {
                item.destroy()
            });
            canvasItems = []
            // mC.destroy()
            // app.stage.destroy(true)
            // document.getElementsByTagName("canvas")[0].remove()
            // // mC = new PIXI.Container();
            // initPixi()
            // app.stage.addChild(mC);
        };

    toolbox.appendChild(clearBtn)

}

async function test(d){
    d.addEventListener("rawdata", function(data){
        dtwTest.push(data)
    });

    await d.rawdata.start();
}

function gestureEvent(name) {

    const mouvements = {
        "up": 5,
        "down": 6,
        "swing": 8
    }

    const texture = PIXI.Texture.from('./assets/GAM_WALL_EXP/GAM_svg/DE-MARIA_-0'+mouvements[name]+'.svg')
    const svg = new PIXI.Sprite(texture);
    svg.anchor.set(0.5);

    svg.x = Math.floor(Math.random() * (app.screen.width-150)) + 50
    svg.y = Math.floor(Math.random() * (app.screen.height-150)) + 50

    mC.addChild(svg);
}

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

    app = new PIXI.Application({
/*        width: WIDTH, 
        height: HEIGHT, */
        backgroundColor: BACKGROUND_COLOR, 
        resolution: window.devicePixelRatio || 1,
        resizeTo: window
    });


    // app.renderer.plugins.interaction.cursorStyles.default = "url('./src/assets/cursor/1/cursor_96.png'), auto";
    // app.renderer.plugins.interaction.cursorStyles.hover = "url('./src/assets/cursor/1/cursor_96.png'), auto";
    // app.renderer.plugins.interaction.cursorStyles.pointer = "url('./src/assets/cursor/1/cursor_96.png'), auto";



    window.app = app

    view.appendChild(app.view);

    app.stage.addChild(mC);

    mC.addChild(vBrush)

    /* Loading assets, images, textures ... */

    const texture = PIXI.Texture.from('./assets/GAM_WALL_EXP/GAM_svg/DE-MARIA_-01.svg');

    const textures = []

    for (let index = 1; index <= 17; index++) {
        const strI = (index < 10) ?  "0"+index : index+'';

        textures.push(
            PIXI.Texture.from('./assets/GAM_WALL_EXP/GAM_svg/DE-MARIA_-'+strI+'.svg')
        )
    }

    function pop(textureId, x, y) {
        var texture, svg;
        if(textureId == "random"){
            texture = textures[Math.floor(Math.random()*textures.length)]
            svg = new PIXI.Sprite(texture);
            svg.x = Math.floor(Math.random() * (app.screen.width-150)) + 50
            svg.y = Math.floor(Math.random() * (app.screen.height-150)) + 50
        }else{
            texture = textures[textureId]
            svg = new PIXI.Sprite(texture);
            svg.x = x
            svg.y = y
        }

        svg.anchor.set(0.5);
        svg.zIndex = 1;

        // svg.buttonMode = true;

        mC.addChild(svg);
        return svg
    }

    function _selected(textureId, x, y){
        if(selected != null){
            mC.removeChild(selected)
        }
        selected = new PIXI.Graphics();
            selected.beginFill(0xffffff, 0.4);
            selected.drawRect(x-35, HEIGHT-80, 80, 80);
            selected.endFill();
        selected.zIndex = 10
        selectedGraphic = textureId
        mC.addChild(selected)
    }

    function _toolSelect(tool, x, y){
        if(selectedTool != null){
            mC.removeChild(selectedToolGraphic)
        }

        selectedToolGraphic = new PIXI.Graphics();
            selectedToolGraphic.beginFill(0xffffff, 0.4);
            selectedToolGraphic.drawRect(x, y, 80, 80);
            selectedToolGraphic.endFill();
            selectedToolGraphic.zIndex = 10
        selectedTool = tool;
        mC.addChild(selectedToolGraphic)
    }

    function resetEditTool(){
        editToolSelection = null
        canvasItems.map((x)=> {
            x.alpha=1
            x.interactive = false
            x.removeAllListeners();
        })
    }

    function loadTools(){
        const graphics = new PIXI.Graphics();
            graphics.beginFill(UI_BACKGROUND_COLOR);
            graphics.drawRect(0, 0, 80, HEIGHT);
            graphics.endFill();

            graphics.zIndex = 10

        mC.addChild(graphics)


        paintTool = new PIXI.Text("Paint", {fontFamily : 'Arial', fontSize: 24, fill : 0xffffff, align : 'center'})
            paintTool.x = 12
            paintTool.y = 25
            paintTool.interactive = true
            paintTool.zIndex = 11


            paintTool.on("pointertap", () => {
                _toolSelect("paint", 0, 0)
                resetEditTool()
            })

        mC.addChild(paintTool)

        const editTool = new PIXI.Text("Edit", {fontFamily : 'Arial', fontSize: 24, fill : 0xffffff, align : 'center'})
            editTool.x = 18
            editTool.y = 25*4
            editTool.interactive = true
            editTool.zIndex = 11

            editTool.on("pointertap", () => {
                _toolSelect("edit", 0, 75)
                canvasItems.forEach(item => {
                    item.interactive = true
                    item.alpha = 0.2

                    item.on("pointertap", () => {

                        canvasItems.map(x=> x.alpha=0.2)

                        // if(editToolSelection != null){
                        //     editToolSelection.removeAllListeners();
                        // }

                        editToolSelection = item;
                        item.alpha = 1

                        item
                            .on('mousedown', (event) => {
                                if(editToolSelection == item){
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

        mC.addChild(editTool)


    }


    function onDragEnd() {
        editToolSelectionData = null
    }
    function onDragMove() {
        if(editToolSelectionData != null){
            editToolSelection.x = editToolSelectionData.x
            editToolSelection.y = editToolSelectionData.y
        }
    }

    function loadTextures() {

        const bottomBackgroundTool = new PIXI.Graphics();
            bottomBackgroundTool.beginFill(UI_BACKGROUND_COLOR);
            bottomBackgroundTool.drawRect(0, HEIGHT-80, WIDTH, 100);
            bottomBackgroundTool.endFill();
            bottomBackgroundTool.zIndex = 10
        mC.addChild(bottomBackgroundTool)

        const list = [0,1,3,5,7,8,11,14,15]

        list.forEach((item, index) => {
            const x = 50+(index * 110)
            const y = 560
            const svgItem = pop(item, x, y)
            svgItem.scale.set(0.6, 0.6)
            svgItem.interactive = true
            svgItem.zIndex = 11


            svgItem.on('pointertap', () => {
                // alert(textureId, x, y)
                _selected(item, x, y)
            });
        });
    }

    //init tempGUI message
    // tempGUI.x = (1000-tempGUI.width)/2
    // tempGUI.y = 400

    // tempLOGO.x = 410
    // tempLOGO.y = 120
    // tempLOGO.scale.set(0.8, 0.8)

    loadTools()

    loadTextures()

    // mC.addChild(tempGUI);
    // mC.addChild(tempLOGO)

    window.pop = pop
}


function resizeGame() {

  console.log("resizeGame:",$(window).width()) 

  //console.log('resizeGame',$(window).width(), $(window).height())
  // game.w = $(window).width();
  // game.h = $(window).height();
  // game.ah = game.h - offsetY;
  // app.resize(game.w, game.w);
  // reposUI(scoreTable,"topmiddle");
  // reposUI(playAgain,"middle");
  // game.playing = false;

}


function initGame() {

    console.log("initGame")


/*  for (var a in appData.items) {
    let name = appData.items[a].name;
    let path = appData.items[a].path;
    console.log('loader.add(',name, path,')');
    loader.add(name, path)
  }
  loader.load((loader, resources) => {
    console.log('resources',resources);
  });
  loader.onProgress.add((e) => {
    console.log('progress - loader', e.progress)
  });
  loader.onError.add(() => {
    console.log('onError - loader')
  });
  loader.onLoad.add((e) => {
    console.log('onLoad - loader')
  });
  loader.onComplete.add(() => {
    console.log('- assets loaded');
    setTimeout(setupGame,100);    
  });*/



    initPixi()
    initController()

}

initGame();


function getUSB() {


    let button = document.getElementById('request-device');
    button.className = "bu";
    button.style.display = "block";

    button.addEventListener('click', async () => {

        console.log("request-device click")

      let device;

      // try {
      //   device = await navigator.usb.requestDevice({ filters: [{
      //       vendorId: 0xABCD,
      //       classCode: 0xFF, // vendor-specific
      //       protocolCode: 0x01
      //   }]});
      // } catch (err) {
      //   // No device was selected.
      // }

      // if (device !== undefined) {
      //   // Add |device| to the UI.
      //   console.log("device: ",device)
      // }


          try {

            device = await navigator.usb.getDevices({ filters: [{
                vendorId: 0xABCD,
                classCode: 0xFF, // vendor-specific
                protocolCode: 0x01
            }]});

          } catch (err) {
            // No device was selected.
          }

          if (device !== undefined) {


                  devices.forEach(device => {
                    // Add |device| to the UI.
                    console.log("USB DEVICES: ", device)
                  });


          }




    });



    navigator.usb.addEventListener('connect', event => {
      // Add |event.device| to the UI.
      console.log('connect', event)
    });

    navigator.usb.addEventListener('disconnect', event => {
      // Remove |event.device| from the UI.
      console.log('disconnect', event)
    });    


  // devices = await navigator.usb.getDevices();

  // devices.forEach(device => {
  //   // Add |device| to the UI.
  //   console.log("USB DEVICES: ", device)
  // });


}



window.getUSB = getUSB




window.addEventListener('resize', resizeGame, false);



