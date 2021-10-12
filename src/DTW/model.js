// import "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.7.1/Chart.min.js";

export default class Model{
    constructor(name, data, sensitivity){
        this.name = name;
        this.data = data;
        this.sensitivity = sensitivity;
        this.dataset = null;
        this.matchArray = null;
    }

    toChart() {
        if(this.dataset === null){
            this.dataset = [
                {
                    label: 'Axis X',
                    borderColor: 'red',
                    data: this.data[0]
                },
                {
                    label: 'Axis Y',
                    borderColor: 'green',
                    data: this.data[1]
                },
                {
                    label: 'Axis Z',
                    borderColor: 'blue',
                    data: this.data[2]
                }
            ];
        }

        return this.dataset
    }

    matchingString(){
        if(this.matchArray == null){
            this.matchArray = [ this.data[0].map(x=>x.y), this.data[1].map(x=>x.y), this.data[2].map(x=>x.y) ]
        }
        return this.matchArray;
    }



}