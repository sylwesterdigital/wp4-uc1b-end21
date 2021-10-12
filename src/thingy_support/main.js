
import Thingy from "./thingy.js";
// import Model from "./model.js";

// import upData from './data/up.js'
// import swingData from './data/swing.js'
// import downData from './data/down.js'


class Controller{
    constructor(){
        this.devices = []
        this.colors = ["red", "blue", "green", "blue"];
        this.id = null
    }

    currentDevices(){
        var items = [];
        this.devices.forEach(device => {
            items.push( {
                name: device.device.name,
                assignedColor: device.assignedColor,
                batteryStatus: device.batteryStatus
            })
        });
        return items;
    }

    asignColor(deviceID){
        const id = Math.floor(Math.random()*this.colors.length);
        const selectedColor = this.colors[id];

        this.colors.splice(id, 1)

        this.devices[deviceID].led.write({
            mode: "breathe",
            color: selectedColor,
            intensity: 100,
            delay: 1000,
        });

        return selectedColor;
    }

    async buttonListener(deviceID, action){
        await this.devices[deviceID].button.start();

        var bool = 0
        this.devices[deviceID].addEventListener('button', function(data){
            if(bool == 0){
                bool = 1
                console.log(this.deviceID+": "+data.type);
                action()
            }else{
                bool = 0
            }
        });
    }

    async batteryListener(deviceID){
        await this.devices[deviceID].battery.start();

        this.devices[deviceID].addEventListener("battery", function(data){
            this.devices[deviceID].batteryStatus = data.detail.status;
        });
    }

    async rawDataListener(deviceID, callback){
        console.log(deviceID)
        await this.devices[deviceID].rawdata.start();

        this.devices[deviceID].addEventListener("rawdata", function(data){
            var data = {
                x: {x: data.timeStamp, y: data.detail.accelerometer.x},
                y: {x: data.timeStamp, y: data.detail.accelerometer.y},
                z: {x: data.timeStamp, y: data.detail.accelerometer.z},
            }

            callback(data)

            // matcher()
        });
    }

    async newDevice(buttonAction, callback){
        this.devices.push(new Thingy())

        const deviceID = this.devices.length-1
        const device = this.devices[deviceID];
        
        const success = await device.connect();
        
        if(success){
            this.batteryListener(deviceID);
            this.buttonListener(deviceID, buttonAction);
            
            device.id = deviceID;
            device.isPlaying = false;
            device.assignedColor = this.asignColor(deviceID);
    
            callback(this.devices[deviceID])
        }else{
            callback(false)
        }
    }
}

export default Controller;