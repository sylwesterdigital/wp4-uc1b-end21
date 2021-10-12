
// Class
import Model from './DTW/model.js'

// Data
import upData from './DTW/models/up.js'
import swingData from './DTW/models/swing.js'
import downData from './DTW/models/down.js'

export default class dtw{

    constructor(gesture_detection_callback){
        this.x = []
        this.y = []
        this.z = []
        
        this.gestureDetectionCallback = gesture_detection_callback

        this.models = [
            new Model("up", upData, 120), 
            new Model("down", downData, 100), 
            new Model("swing", swingData, 150)
        ];

    }

    push(data){
        this.x.push({x: data.timeStamp, y: data.detail.accelerometer.x})
        this.y.push({x: data.timeStamp, y: data.detail.accelerometer.y})
        this.z.push({x: data.timeStamp, y: data.detail.accelerometer.z})
        this.dataCleaner()
    }

    dataCleaner(){
        if(this.x.length > 14 && this.y.length > 14 && this.z.length > 14){
            this.x.shift()
            this.y.shift()
            this.z.shift()
        }
        this.matcher()
    }

    analyseGesture(live, toMatch){
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

    matcher(){
        const currentData = [
            this.x.map(x=>x.y),
            this.y.map(x=>x.y),
            this.z.map(x=>x.y),
        ]

        //loop throught models to chech gesture
        this.models.forEach(model => {
            var gesture = this.analyseGesture(currentData, model.matchingString());

            if (gesture <= model.sensitivity) {
                this.x = []
                this.y = []
                this.z = []
                this.gestureDetectionCallback(model.name)
            }
        });
    }





}