import {html,PolymerElement} from '/static/otree-redwood/node_modules/@polymer/polymer/polymer-element.js';
import '/static/otree-redwood/src/redwood-channel/redwood-channel.js';

export class SubperiodStrategyGraph extends PolymerElement {

    static get template() {
        return html `
            <style>

                :host {
                    display: block;
                }

            </style>

            <redwood-channel
                channel="group_decisions"
                on-event="_handleGroupDecisionsEvent">
            </redwood-channel>

            <div id="chart"></div>
        `
    }

    static get properties() {
        return {
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
            title: { text: 'Choice vs. Time' },
            exporting: { enabled: false },
            tooltip: { enabled: false },
            legend: { enabled: false },
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
                title: { text: 'Choice' },
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
            series: [{
                name: 'Your Choice',
                type: "line",
                data: [[0, 0]],
                step: "left"
            },
            {
                name: 'Other Choice',
                type: "line",
                data: [[0, 0]],
                step: "left"
            }],
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
        this._lastElem(dataset.data).update({y: this.myDecision});
        dataset.addPoint([this._currSubperiod, this.myDecision]);

        dataset = this.graph_obj.series[1];
        this._lastElem(dataset.data).update({y: this.otherDecision});
        dataset.addPoint([this._currSubperiod, this.otherDecision]);
    }
}

window.customElements.define('subperiod-strategy-graph', SubperiodStrategyGraph);
