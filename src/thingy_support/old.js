
var devices = [new Thingy()];
var colors = ["red", "blue", "yellow", "purple", "pink"];

var liveCTX = document.getElementById('myChart').getContext('2d');

var lastGesture = document.getElementById('lastGesture');
var modelsElement = document.getElementById('models');


var liveX = {
    label: 'Axis X',
    borderColor: 'red',
    data: []
};
var liveY = {
    label: 'Axis Z',
    borderColor: 'green',
    data: []
};
var liveZ = {
    label: 'Axis Z',
    borderColor: 'blue',
    data: []
};
var chart = new Chart(liveCTX, {
    type: 'line',
    title: 'Swing data',
    data: { datasets: [liveX, liveY, liveZ] },
    options: {
    scales: {
        xAxes: [{
        type: 'time'
        }]
    },
    animation: {
        duration: 0
    }
    }
});

var UPModel = new Model("up", upData, 120);
var DOWNModel = new Model("down", downData, 100);
var SWINGModel = new Model("swing", swingData, 150);
var models = [UPModel, DOWNModel, SWINGModel];

initModelCharts();

async function start(device) {
    try {
    await device.connect();
    device.isPlaying = false;
    device.colorID = "none";
    device.batteryStatus = 0;

    await init(device)

    device.addEventListener("rawdata", function(data){
        liveX.data.push({x: data.timeStamp, y: data.detail.accelerometer.x})
        liveY.data.push({x: data.timeStamp, y: data.detail.accelerometer.y})
        liveZ.data.push({x: data.timeStamp, y: data.detail.accelerometer.z})

        if(liveX.data.length > 14 && liveY.data.length > 14 && liveZ.data.length > 14){
        liveX.data.shift()
        liveY.data.shift()
        liveZ.data.shift()
        }

        chart.update()
        matcher()
    });

    await device.rawdata.start();

    setTimeout(() => {
        updateDom()
    }, 1000);

    updateDom()
    } catch (error) {
    console.error(error);
    }
}

function analyseGesture(live, toMatch){
    var results = []

    for (let i = 0; i < toMatch.length; i++) {
    const ser1 = toMatch[i];
    const ser2 = live[i];

    var distFunc = function( a, b ) {
        return Math.abs( a - b );
    };
    
    var dtw = new DynamicTimeWarping(ser1, ser2, distFunc);
    results.push(dtw.getDistance())
    };

    return results.reduce(function(a, b){
    return a + b;
    }, 0);
}

function matcher(){
    var currentData = [chart.data.datasets[0].data.map(x=>x.y), chart.data.datasets[1].data.map(x=>x.y), chart.data.datasets[2].data.map(x=>x.y)]
    
    models.forEach(model => {
        var gesture = analyseGesture(currentData, model.matchingString());
        if (gesture <= model.sensitivity) {
            lastGesture.innerText = model.name;
            console.log("DETECTED "+ model.name, gesture)
        }
    });

}

function initModelCharts() {
    modelsElement.innerHTML = "";

    models.forEach(model => {
    var group = document.createElement('div');
    var h2 = document.createElement('h2');
    var canvas = document.createElement('canvas');

    group.classList.add("col-md-6")
    
    h2.innerText = model.name;

    group.appendChild(h2)
    group.appendChild(canvas)

    modelsElement.appendChild(group)

    var chart = new Chart(canvas, {
        type: 'line',
        data: { datasets: model.toChart() },
        options: {
        scales: {
            xAxes: [{
            type: 'time'
            }]
        },
        animation: {
            duration: 0
        }
        }
    })
    });
}

document.querySelector("#recordGesture").addEventListener("click", async () => {
    var json = [chart.data.datasets[0].data, chart.data.datasets[1].data, chart.data.datasets[2].data];

    var newModel = new Model("new"+Math.round(Math.random()*10000), json, 120);
    models.push(newModel);
    initModelCharts()

    document.getElementById('outputGesture').value = JSON.stringify(json);
})

document.querySelector("#connectBtn").addEventListener("click", async () => {
    for (let i = 0; i < devices.length; i++) {

    if(!devices[i].connected){
        start(devices[i]);
        devices.push(new Thingy({logEnabled: true}))
        break;
    }
    
    }
});

async function init(device){
    const deviceName = device.device.name;

    device.addEventListener("tap", function(data){
    console.log(deviceName+": "+data.type);
    });

    device.addEventListener("battery", function(data){
    device.batteryStatus = data.detail.status;
    });

    device.addEventListener('button', function(data){
    console.log(deviceName+": "+data.type);
    });


    await device.tap.start();
    await device.button.start();
    await device.battery.start();

    device.soundconfiguration.write({speakerMode: 1})
    
    var rnd = Math.round(Math.random()*(colors.length-1))+1;
    device.colorID = colors[rnd];
    colors.splice(rnd,1);

    await device.led.write({
    mode: "constant",
    red: 255,
    green: 0,
    blue: 0,
    });
}

function updateDom() {
    var dom = "";
    var buttonList = '';

    // buttonList += '<div class="input-group-text">';
    // buttonList += '<input type="checkbox" id="all">';
    // buttonList += '</div>';

    for (let i = 0; i < devices.length; i++) {
    const element = devices[i];

    if(element.device != undefined){
        buttonList += '<a class="btn btn-primary m-2" data-toggle="collapse" data-target="#colpse'+(i+1)+'" role="button" aria-expanded="false" aria-controls="colpse'+(i+1)+'">'+ element.device.name +'</a>';
    }

    dom += '<div class="collapse" id="colpse'+(i+1)+'">'
        if(element.device != undefined){
        dom += '<h1><b>#'+ (i+1) +'</b> '+ element.device.name +'</h1>'
        dom += '<p><b>Battery:</b> '+ element.batteryStatus +'%</p>'
        dom += '<p><b>UUID:</b> '+ element.TCS_UUID +'</p>'
        dom += '<p><b>Bluetooth id:</b> '+ element.device.id +'</p>'
        // dom += '<p><b>Color:</b> '+ element.colorID +'</p>';
        dom += '<p><b>Color:</b> <input type="color" id="color" vID="'+i+'"></p>';
        dom += '<a class="btn btn-warning btn-sm" id="find" vID="'+i+'">FIND</a>'
        dom += '<a class="btn btn-warning btn-sm" id="bip" vID="'+i+'">BIP</a>'
        }
    dom += '</div>'
    
    }

    document.getElementById('devices').innerHTML = dom;
    document.getElementById('devicesBtns').innerHTML = buttonList;
}

$('body').on('change', 'input#color', function(elem){
    

    var color = hexToRgb(elem.currentTarget.value)

    if( $("#defaultCheck1").prop('checked') ){
    devices.forEach(device => {
        device.led.write({
        mode: "constant",
        red: color.r,
        blue: color.b,
        green: color.g,
        });
    });
    }else{
    var id = elem.currentTarget.attributes['vid'].value;
    devices[id].led.write({
        mode: "constant",
        red: color.r,
        blue: color.b,
        green: color.g,
    });
    }

    
})

$('body').on('click', 'a#bip', function(elem){
    
    if( $("#defaultCheck1").prop('checked') ){

    devices.forEach(device => {
        device.speakerdata.write({mode: 1, frequency: 800, duration: 500, volume: 100})
    });

    }else{
    var id = elem.currentTarget.attributes['vid'].value;
    devices[id].speakerdata.write({mode: 1, frequency: 800, duration: 500, volume: 100})
    }

});

$('body').on('click', 'a#find', function(elem) {

    if( $("#defaultCheck1").prop('checked') ){
    for (let i = 0; i < devices.length; i++) {
        devices[i].led.write({
        mode: "breathe",
        color: 'red',
        intensity: 100,
        delay: 1000,
        });

        setTimeout(() => {
        devices[i].led.write({
            mode: "constant",
            red: 255,
            blue: 0,
            green: 0,
        });
        }, 5000);

    }
    }else{
    var id = elem.currentTarget.attributes['vid'].value;

    devices[id].led.write({
        mode: "breathe",
        color: 'red',
        intensity: 100,
        delay: 1000,
        });

        setTimeout(() => {
        devices[id].led.write({
            mode: "constant",
            red: 255,
            blue: 0,
            green: 0,
        });
        }, 5000);
    }
});


function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
    } : null;
}

document.onkeydown = function(e) {
switch (e.keyCode) {
    case 67:
    document.getElementById('lastGesture').innerText = 'None'
    break;
    }
};


window.devices = devices
window.updateDom = updateDom
window.chart = chart