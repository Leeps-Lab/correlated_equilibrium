import {html,PolymerElement} from '/static/otree-redwood/node_modules/@polymer/polymer/polymer-element.js';
import '/static/otree-redwood/src/redwood-channel/redwood-channel.js';
import '/static/otree-redwood/src/otree-constants/otree-constants.js';

export class SubperiodStrategyGraph extends PolymerElement {

    static get template() {
        return html `
            <style>

                :host {
                    display: block;
                }

            </style>
            
            <otree-constants id="constants"></otree-constants>
            <redwood-channel
                channel="group_decisions"
                on-event="_handleGroupDecisionsEvent">
            </redwood-channel>

            <div id="chart"></div>
        `
    }

    static get properties() {
        return {
            choice: {
                type: Number,
            },
            myDecision: {
                type: Number,
            },
            otherDecision: {
                type: Number,
            },
            periodLength: Number,
            _currSubperiod: {
                type: Number,
                value: 0,
            },
        }
    }

    connectedCallback() {
        super.connectedCallback();
        this._initHighchart();
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
            title: { text: ((this.choice == 2 )
                || (this.numPlayers % 3 == 0 && this.$.constants.role != "p3" && this.choice == 1) 
                ) ? "Choices vs. Time" : " "},
            exporting: { enabled: false },
            tooltip: { enabled: false },
            legend: { enabled: ((this.choice == 2 )
                || (this.numPlayers % 3 == 0 && this.$.constants.role != "p3" && this.choice == 1) 
                ) ? true : false  },
            credits: { enabled: false },
            xAxis: {
                min: 0,
                max: 1,
                max: this.numSubperiods,
                tickInterval: 1,
                labels: { enabled: true },
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#ccd6eb',
                    zIndex: 100,
                },
                {
                    value: this.numSubperiods,
                    width: 1,
                    color: '#ccd6eb',
                    zIndex: 100,
                }],
            },
            yAxis: {
                title: { text: (this.choice == 2) ? "U" : (this.choice == 1) ? "C" : "D" },
                min: 0,
                max: 1
            },
            plotOptions: {
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
            series: (!this.maxInfo) ? [{
                name: 'Your Choice',
                type: "line",
                data: [[0, 0]],
                step: "left"
            }] : (this.numPlayers % 3 == 0) ? [
                {
                    name: 'Your Choice',
                    type: "line",
                    data: [[0, 0]],
                    step: "left"
                },
                {
                    name: (this.$.constants.role == "p3" || this.$.constants.role == "p2") ? 'P1 Choice' : 'P2 Choice',
                    type: "line",
                    data: [[0, 0]],
                    step: "left"
                },
                {
                    name: (this.$.constants.role == "p3" ) ? 'P2 Choice' : 'P3 Choice',
                    type: "line",
                    data: [[0, 0]],
                    step: "left"
                },
            ] : 
            [
                {
                    name: 'Your Choice',
                    type: "line",
                    data: [[0, 0]],
                    step: "left"
                },
                {
                    name: ( this.$.constants.role == "p2") ? 'P1 Choice' : 'P2 Choice',
                    type: "line",
                    data: [[0, 0]],
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
    }
    _handleGroupDecisionsEvent(event) {
        this._currSubperiod += 1;

        let dataset = this.graph_obj.series[0];
        this._lastElem(dataset.data).update({y: (this.myDecision == this.choice)? 1 : 0});
        dataset.addPoint([this._currSubperiod, (this.myDecision == this.choice)? 1 : 0]);
        
        if(this.numPlayers % 2 == 0  && this.maxInfo) {
            dataset = this.graph_obj.series[1];
            this._lastElem(dataset.data).update({y: (this.otherDecision == this.choice)? 1 : 0});
            dataset.addPoint([this._currSubperiod, (this.otherDecision == this.choice)? 1 : 0]);            
        }
        
        
        if(this.numPlayers % 3 == 0 && this.maxInfo) {
            let i = 1;
            console.log("Other player decisions: " + this.otherDecisionArray);
            for( let decision of this.otherDecisionArray ) {
                dataset = this.graph_obj.series[i];
                this._lastElem(dataset.data).update({y: (decision == this.choice)? 1 : 0});
                dataset.addPoint([this._currSubperiod, (decision == this.choice)? 1 : 0]);
                i++;
            }
        }

        
    }
}

window.customElements.define('subperiod-strategy-graph', SubperiodStrategyGraph);

