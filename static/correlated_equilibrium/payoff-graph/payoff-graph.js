import {html,PolymerElement} from '/static/otree-redwood/node_modules/@polymer/polymer/polymer-element.js';
import '/static/otree-redwood/src/redwood-period/redwood-period.js';
import '/static/otree-redwood/src/otree-constants/otree-constants.js';


export class PayoffGraph extends PolymerElement {

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
    
    static get observers() {
        return [
          // Observer method name, followed by a list of dependencies, in parenthesis
          '_updateDataset(groupDecisions.*)'
        ]
      }

    static get properties() {
        return {
            groupDecisions: {
                type: Object,
            },
            myPayoffs: {
                type: Array,
                observer: '_addTransitionBand'
            },
            otherPayoffs: {
                type: Array,
                observer: '_addTransitionBand'
            },
            periodLength: Number,
            payoffMin: {
                type: Number,
            },
            payoffMax: {
                type: Number,
            },
            myPayoffSeries: {
                type: Array,
                value: () => {
                    return [[0, 0], [Number.EPSILON, 0]];
                }
            },
            otherPayoffSeries: {
                type: Array,
                value: () => {
                    return [[0, 0], [Number.EPSILON, 0]];
                }
            },
            otherOtherPayoffSeries: {
                type: Array,
                value: () => {
                    return [[0, 0], [Number.EPSILON, 0]];
                }
            }
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

        let minPayoff = Infinity;
        let maxPayoff = -Infinity;

        for (var i=0; i< this.myPayoffs.length; i++) {
            
            for(var j = 0; j < this.myPayoffs[0].length; j++) {
                minPayoff = Math.min(minPayoff, this.myPayoffs[i][j], this.otherPayoffs[i][j]);
                maxPayoff = Math.max(maxPayoff, this.myPayoffs[i][j], this.otherPayoffs[i][j]);
            }
        }
        
        // call highcharts setup function
        this.graph_obj = Highcharts.chart({
            chart: {
                animation: false,
                renderTo: this.$.chart,
                enabled: false,
                width: this.offsetWidth,
                height: this.offsetHeight,

            },
            title: { text: 'Payoff vs. Time' },
            exporting: { enabled: false },
            tooltip: { enabled: false },
            legend: { enabled: false },
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
                title: { text: 'Payoff' },
                min: minPayoff,
                max: maxPayoff,
                endOnTick: false,
                tickInterval: (maxPayoff-minPayoff) / 4
            },
            plotOptions: {
                line: {marker: {enabled: false}},
                area: {marker: {enabled: false}},
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
            series: [
                {
                    name: 'Your Payoff',
                    type: "area",
                    data: this.myPayoffSeries,
                    step: "left"
                },
                {
                    name: 'Other Payoff',
                    type: "line",
                    data: this.otherPayoffSeries,
                    step: "left"
                }
            ],
            series:
            (!this.maxInfo) ? [{
                name: 'Your Payoff',
                type: "area",
                data: [[0, 0]],
                step: "left"
            }] : (this.numPlayers % 3 == 0) ?
              [
                {
                    name: 'Your Payoff',
                    type: "area",
                    data: this.myPayoffSeries,
                    step: "left"
                },
                {
                    name: (this.$.constants.role == "p3" || this.$.constants.role == "p2") ? 'P1 Payoff' : 'P2 Payoff',
                    type: "line",
                    data: this.otherPayoffSeries,
                    step: "left"
                },
                
                {
                    name: (this.$.constants.role == "p3" ) ? 'P2 Payoff' : 'P3 Payoff',
                    color: '#ff0900',
                    type: "line",
                    data: this.otherOtherPayoffSeries,
                    step: "left"
                } 
            ]
            : [
                {
                    name: 'Your Payoff',
                    type: "area",
                    data: this.myPayoffSeries,
                    step: "left"
                },
                {
                    name: ( this.$.constants.role == "p2") ? 'P1 Payoff' : 'P2 Payoff',
                    type: "line",
                    data: this.otherPayoffSeries,
                    step: "left"
                },
                
            ] ,
            legend: {
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
    // updates current payoff value every 50 ms
    _updateGraph(timestamp) {
        // calculate x value for current time
        if(!this.graph_obj) {
            this._animationID = window.requestAnimationFrame(this._updateGraph.bind(this));
            return;
        }
        
        const xval = (
            (timestamp - this.start_time) /
            (this.periodLength * 1000));
        if (!isNaN(xval) && xval > 0) {

            let dataset;
            dataset = this.graph_obj.series[0];
            if (xval > this._lastElem(dataset.data).x) {
                this._lastElem(dataset.data).update({x: xval});
            }

            dataset = this.graph_obj.series[1];
            if (xval > this._lastElem(dataset.data).x) {
                this._lastElem(dataset.data).update({x: xval});
            }

            this.graph_obj.redraw();
        }

        // recursively call update
        this._animationID = window.requestAnimationFrame(this._updateGraph.bind(this));
    }
    // is called everytime someone's decision changes to update this payoff graph
    _updateDataset() {
        if(Object.keys(this.groupDecisions).length == 0) return;
        for(let decision of Object.values(this.groupDecisions)){
           if(decision === null) return;
        }
        
        // if graph hasn't been initialized, don't do anything
        if (!this.graph_obj) return;
        let num_other_players = 0;

        var my_flow_payoff = 0;
        var other_flow_payoff = 0;
        var third_flow_payoff = 0;
        
        console.log(this.get("groupDecisions"));
      
        var p1Decision, p2Decision, p3Decision;
        var p1ID, p2ID, p3ID;

        if(this.numPlayers % 2 == 0) {

            for (const player of this.$.constants.group.players) {
                if (player.role != this.$.constants.role) {
                    my_flow_payoff += this.myPayoffs[this.myDecision][this.otherDecision];
                    other_flow_payoff += this.otherPayoffs[this.myDecision][this.otherDecision];
                }
                    
                    num_other_players++;
            }

            //my_flow_payoff /= num_other_players;
            //other_flow_payoff /= num_other_players;
        }
        else if(this.numPlayers % 3 == 0) {
            
            for (const player of this.$.constants.group.players) {
                if(player.role == "p1") { 
                    p1Decision = this.groupDecisions[player.participantCode];
                    p1ID = player.participantCode;
                }
                else if(player.role == "p2") { 
                    p2Decision = this.groupDecisions[player.participantCode];
                    p2ID = player.participantCode;
                }
                else if(player.role == "p3") { 
                    p3Decision = this.groupDecisions[player.participantCode];
                    p3ID = player.participantCode;
                }
            }
            
            if(this.$.constants.participantCode == p1ID) {
                console.log(this.payoffMatrix[p3Decision]);
                my_flow_payoff += this.payoffMatrix[p3Decision][this.myDecision][p2Decision][0];
                other_flow_payoff += this.payoffMatrix[p3Decision][this.myDecision][p2Decision][1];
                third_flow_payoff += this.payoffMatrix[p3Decision][this.myDecision][p2Decision][2];

            }
            else if(this.$.constants.participantCode == p2ID) {
                my_flow_payoff += this.payoffMatrix[p3Decision][p1Decision][this.myDecision][1];
                other_flow_payoff += this.payoffMatrix[p3Decision][p1Decision][this.myDecision][0];
                console.log(this.payoffMatrix);
                third_flow_payoff += this.payoffMatrix[p3Decision][p1Decision][this.myDecision][2];

            }
            else if(this.$.constants.participantCode == p3ID) {
                my_flow_payoff += this.originalPayoffMatrix[this.myDecision][p1Decision][p2Decision][2];
                other_flow_payoff += this.originalPayoffMatrix[this.myDecision][p1Decision][p2Decision][0];
                third_flow_payoff += this.originalPayoffMatrix[this.myDecision][p1Decision][p2Decision][1];

            }

            //Fix
            /*
            my_flow_payoff /= 2;
            other_flow_payoff /= 2;
            third_flow_payoff /= 2;
            */

        }

        // calculate new decision's timestamp as a value between 0 and 1
        const xval = (
            (performance.now() - this.start_time) /
            (this.periodLength * 1000));
        if (isNaN(xval) || xval <= 0) return;

        // add point for my payoff
        let dataset = this.graph_obj.series[0];
        this._lastElem(dataset.data).remove();
        dataset.addPoint([xval, my_flow_payoff]);
        dataset.addPoint([xval+Number.EPSILON, my_flow_payoff]);

        // add point for other payoff
        if(this.maxInfo){
            dataset = this.graph_obj.series[1]
            this._lastElem(dataset.data).remove()
            dataset.addPoint([xval, other_flow_payoff]);
            dataset.addPoint([xval+Number.EPSILON, other_flow_payoff]);
        }

        if(this.numPlayers % 3 == 0 && this.maxInfo) {
            dataset = this.graph_obj.series[2];
            this._lastElem(dataset.data).remove()
            dataset.addPoint([xval, third_flow_payoff]);
            dataset.addPoint([xval+Number.EPSILON, third_flow_payoff]);
        }
    }
    // called every time a matrix transition occurs
    _addTransitionBand() {
        if (!this.graph_obj) return;

        const xval = (
            (performance.now() - this.start_time) /
            (this.periodLength * 1000))
        this.graph_obj.xAxis[0].addPlotBand({
            value: xval,
            width: 2,
            color: 'red',
            zIndex: 100,
        });

        this._updateDataset();
    }
}

window.customElements.define('payoff-graph', PayoffGraph);
