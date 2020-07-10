import {html,PolymerElement} from '/static/otree-redwood/node_modules/@polymer/polymer/polymer-element.js';
import '/static/otree-redwood/src/redwood-period/redwood-period.js';
import '/static/otree-redwood/src/otree-constants/otree-constants.js';


export class StrategyGraph extends PolymerElement {

    static get template() {
        return html `
            <style>
                :host {
                    display: block;
                }
            </style>
            <otree-constants id="constants"></otree-constants>
            <redwood-period
                on-period-start="_handlePeriodStart"
                on-period-end="_handlePeriodEnd">
            </redwood-period>
            <div id="chart"></div>
        `
    }

    static get properties() {
        return {
            choice: {
                type: Number
            },
            myDecision: {
                type: Number,
                observer: '_updateDataset'
            },
            otherDecision: {
                type: Number,
                observer: '_updateDataset'
            },
            otherDecisionArray: {
                type: Array,  
            },
            myChoiceSeries: {
                type: Array,
                value: () => {
                    return [[0, 0], [Number.EPSILON, 0]];
                }
            },
            otherChoiceSeries: {
                type: Array,
                value: () => {
                    return [[0, 0], [Number.EPSILON, 0]];
                }
            },
            otherOtherChoiceSeries: {
                type: Array,
                value: () => {
                    return [[0, 0], [Number.EPSILON, 0]];
                }
            },
            periodLength: Number,
        }
    }

    ready() {
        super.ready();
        setTimeout(this._initHighchart.bind(this), 1);
    }
    // helper method to return last element of array
    _lastElem(arr) {
        return arr[arr.length - 1];
    }
    // sets up payoff over time graph
    _initHighchart() {
        // disable highcharts sorting requirement
        // gets rid of annoying "highcharts error 15" messages
        (function (H) {
            H.seriesTypes.line.prototype.requireSorting = false;
        })(Highcharts);

        // call highcharts setup function
        this.graph_obj = Highcharts.chart({
            chart: {
                animation: false,
                renderTo: this.$.chart,
                type: 'line',
                width: this.offsetWidth,
                height: this.offsetHeight
            },
            title: { text: 'Choice vs. Time' },
            exporting: { enabled: false },
            tooltip: { enabled: false },
            credits: { enabled: false },
            xAxis: {
                min: 0,
                max: 1,
                labels: { enabled: false },
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#ccd6eb',
                    zIndex: 100,
                },
                {
                    value: 1,
                    width: 1,
                    color: '#ccd6eb',
                    zIndex: 100,
                }],
            },
            yAxis: {
                title: { text: 'Choice' },
                min: 0,
                max: 1
            },
            plotOptions: {
                column: {
                    stacking: 'normal'
                  },
                line: {marker: {enabled: false}},
                series: {
                    states: {
                        hover: {
                            enabled: false,
                        }
                    }
                }
            },
            line: {
                marker: {
                    enabled: false,
                    states: {
                        hover: { enabled: false },
                        select: { enabled: false }
                    }
                }
            },
            series: (!this.maxInfo) ? (this.$.constants.role == "p3")? [
                {
                    name: 'U',
                    pointWidth: 22,
                    borderColor: null,
                    color: '#ffff00',
                    type: "column",
                    data: this.myChoiceSeries,
                    step: "left"
                },
                {
                    name: 'C',
                    pointWidth: 22,
                    borderColor: null,
                    color: '#04f2ff',
                    type: "column",
                    data: this.myChoiceSeries,
                    step: "left"
                },
                {
                    name: 'D',
                    pointWidth: 22,
                    borderColor: null,
                    color: '#9aff02',
                    type: "column",
                    data: this.myChoiceSeries,
                    step: "left"
                },
            ] : [
                {
                    name: 'C',
                    pointWidth: 22,
                    borderColor: null,
                    color: '#04f2ff',
                    type: "column",
                    data: this.myChoiceSeries,
                    step: "left"
                },
                {
                    name: 'D',
                    pointWidth: 22,
                    borderColor: null,
                    color: '#9aff02',
                    type: "column",
                    data: this.myChoiceSeries,
                    step: "left"
                },
            ] : (this.numPlayers % 3 == 0 ) ? 
                    (this.$.constants.role == "p3")? [
                    {
                        name: 'U',
                        pointWidth: 22,
                        borderColor: null,
                        color: '#ffff00',
                        type: "column",
                        data: this.myChoiceSeries,
                        step: "left"
                    },
                    {
                        name: 'C',
                        pointWidth: 22,
                        borderColor: null,
                        color: '#04f2ff',
                        type: "column",
                        data: this.myChoiceSeries,
                        step: "left"
                    },
                    {
                        name: 'D',
                        pointWidth: 22,
                        borderColor: null,
                        color: '#9aff02',
                        type: "column",
                        data: this.myChoiceSeries,
                        step: "left"
                    },
                    {
                        name: 'P1 Choice',
                        color: '#000000',
                        type: "line",
                        data: this.otherChoiceSeries,
                        step: "left"
                    },
                    {
                        name: 'P2 Choice',
                        color: '#ff0000',
                        type: "line",
                        data: this.otherOtherChoiceSeries,
                        step: "left"
                    },
                    
                ] : [
                    {
                        name: 'C',
                        pointWidth: 22,
                        borderColor: null,
                        color: '#04f2ff',
                        type: "column",
                        data: this.myChoiceSeries,
                        step: "left"
                    },
                    {
                        name: 'D',
                        pointWidth: 22,
                        borderColor: null,
                        color: '#9aff02',
                        type: "column",
                        data: this.myChoiceSeries,
                        step: "left"
                    },
                    {
                        name: (this.$.constants.role == "p2") ? 'P1 Choice' : 'P2 Choice',
                        color: '#000000',
                        type: "line",
                        data: this.otherChoiceSeries,
                        step: "left"
                    },
                    {
                        name: 'P3 Chose 1?',
                        color: '#ff0000',
                        type: "line",
                        data: this.otherOtherChoiceSeries,
                        step: "left"
                    },
                    {
                        name: 'P3 Chose 2?',
                        color: '#ff0000',
                        type: "line",
                        data: this.otherOtherChoiceSeries,
                        step: "left",
                        dashStyle: 'dot'
                    },
                ] : //two player games
            (this.gameType == "MV") ?
            [
                {
                    name: 'C',
                    pointWidth: 22,
                    borderColor: null,
                    color: '#04f2ff',
                    type: "column",
                    data: this.myChoiceSeries,
                    step: "left"
                },
                {
                    name: 'D',
                    pointWidth: 22,
                    borderColor: null,
                    color: '#9aff02',
                    type: "column",
                    data: this.myChoiceSeries,
                    step: "left"
                },
                {
                    name: ( this.$.constants.role == "p2") ? 'P1 Chooses 1' : 'P2 Chooses 2',
                    color: '#ff0000',
                    type: "line",
                    data: this.otherChoiceSeries,
                    step: "left"
                },
                {
                    name: ( this.$.constants.role == "p2") ? 'P1 Chooses 1' : 'P2 Chooses 2',
                    color: '#ff0000',
                    type: "line",
                    data: [[0, 0]],
                    step: "left",
                    dashStyle: 'dot'
                },
                
            ] : [
                {
                    name: 'C',
                    pointWidth: 22,
                    borderColor: null,
                    color: '#04f2ff',
                    type: "column",
                    data: this.myChoiceSeries,
                    step: "left"
                },
                {
                    name: 'D',
                    pointWidth: 22,
                    borderColor: null,
                    color: '#9aff02',
                    type: "column",
                    data: this.myChoiceSeries,
                    step: "left"
                },
                {
                    name: ( this.$.constants.role == "p2") ? 'P1 Choice' : 'P2 Choice',
                    color: '#ff0000',
                    type: "line",
                    data: this.otherChoiceSeries,
                    step: "left"
                },
            ],
            legend: {
                enabled:  true ,
                align: 'right',
                verticalAlign: 'top',
                floating: true,
                y: 15,
            },
        });

        this._updateDataset();
    }
    _handlePeriodStart() {
        this.start_time = performance.now();
        this._animationID = window.requestAnimationFrame(this._updateGraph.bind(this));
    }
    _handlePeriodEnd() {
        window.cancelAnimationFrame(this._animationID);
    }
    _updateGraph(timestamp) {
        // calculate x value for current time
        const xval = (
            (timestamp - this.start_time) /
            (this.periodLength * 1000));
        if (isNaN(xval)) return;

        let dataset = this.graph_obj.series[0];
        this._lastElem(dataset.data).update({x: xval});

        dataset = this.graph_obj.series[1];
        this._lastElem(dataset.data).update({x: xval});

        this.graph_obj.redraw();

        // recursively call update
        this._animationID = window.requestAnimationFrame(this._updateGraph.bind(this));
    }
    // is called everytime someone's decision changes to update the graph
    _updateDataset() {
        // if graph hasn't been initialized, don't do anything
        if (!this.graph_obj) { console.log('not initialized'); return; }

        // calculate new decision's timestamp as a value between 0 and 1
        const xval = (
            (performance.now() - this.start_time) /
            (this.periodLength * 1000));
        if (isNaN(xval)) return;

        
        let dataset;

        //For your choice
        if(this.$.constants.role == "p3") {
            dataset = this.graph_obj.series[0];
            this._lastElem(dataset.data).remove();
            dataset.addPoint([xval, (this.myDecision == 2)? 1 : 0]);
            dataset.addPoint([xval, (this.myDecision == 2)? 1 : 0]);

            dataset = this.graph_obj.series[1];
            this._lastElem(dataset.data).remove();
            dataset.addPoint([xval, (this.myDecision == 1)? 1 : 0]);
            dataset.addPoint([xval, (this.myDecision == 1)? 1 : 0]);

            dataset = this.graph_obj.series[2];
            this._lastElem(dataset.data).remove();
            dataset.addPoint([xval, (this.myDecision == 0)? 1 : 0]);
            dataset.addPoint([xval, (this.myDecision == 0)? 1 : 0]);

        }
        else {
            dataset = this.graph_obj.series[0];
            this._lastElem(dataset.data).remove();
            dataset.addPoint([xval, (this.myDecision == 1)? 1 : 0]);
            dataset.addPoint([xval, (this.myDecision == 1)? 1 : 0]);

            dataset = this.graph_obj.series[1];
            this._lastElem(dataset.data).remove();
            dataset.addPoint([xval, (this.myDecision == 0)? 1 : 0]);
            dataset.addPoint([xval, (this.myDecision == 0)? 1 : 0]);

        }

        //For other choices
        if(this.numPlayers % 2 == 0 && this.maxInfo) {
            if(this.gameType == 'MV') {
                dataset = this.graph_obj.series[2];
                this._lastElem(dataset.data).remove();
                dataset.addPoint([xval, (this.otherDecision == 1)? 1 : 0]);
                dataset.addPoint([xval, (this.otherDecision == 1)? 1 : 0]); 
                
                dataset = this.graph_obj.series[3];
                this._lastElem(dataset.data).remove();
                dataset.addPoint([xval, (this.otherDecision == 2)? 1 : 0]);
                dataset.addPoint([xval, (this.otherDecision == 2)? 1 : 0]); 
            }
            else {
                dataset = this.graph_obj.series[2];
                this._lastElem(dataset.data).remove();
                dataset.addPoint([xval, (this.otherDecision == 1)? 1 : 0]);
                dataset.addPoint([xval, (this.otherDecision == 1)? 1 : 0]); 
            }
        }
        
        
        if(this.numPlayers % 3 == 0 && this.maxInfo) {
            for(let decision of this.otherDecisionArray ) {
                if (this.$.constants.role == "p3"){
                    dataset = this.graph_obj.series[3];
                    this._lastElem(dataset.data).remove();
                    dataset.addPoint([xval, (decision == 1)? 1 : 0]);
                    dataset.addPoint([xval, (decision == 1)? 1 : 0]);

                    dataset = this.graph_obj.series[4];
                    this._lastElem(dataset.data).remove();
                    dataset.addPoint([xval, (decision == 2)? 1 : 0]);
                    dataset.addPoint([xval, (decision == 2)? 1 : 0]);
                } 
                else{
                    dataset = this.graph_obj.series[2];
                    this._lastElem(dataset.data).remove();
                    dataset.addPoint([xval, (decision == 1) ? 1 :0]);
                    dataset.addPoint([xval, (decision == 1) ? 1 :0]);

                    dataset = this.graph_obj.series[3];
                    this._lastElem(dataset.data).remove();
                    dataset.addPoint([xval, (decision == 1) ? 1 :0]);
                    dataset.addPoint([xval, (decision == 1) ? 1 :0]);  

                    dataset = this.graph_obj.series[4];
                    this._lastElem(dataset.data).remove();
                    dataset.addPoint([xval, (decision == 2) ? 1 :0]);
                    dataset.addPoint([xval, (decision == 2) ? 1 :0]);   
                }                
            }
        }   
    }
}

window.customElements.define('strategy-graph', StrategyGraph);