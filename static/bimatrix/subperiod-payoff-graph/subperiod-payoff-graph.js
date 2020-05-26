import {html,PolymerElement} from '/static/otree-redwood/node_modules/@polymer/polymer/polymer-element.js';
import '/static/otree-redwood/src/redwood-channel/redwood-channel.js';
import '/static/otree-redwood/src/otree-constants/otree-constants.js';

export class SubperiodPayoffGraph extends PolymerElement {

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
            myDecision: {
                type: Number,
                observer: '_endSubperiod',
            },
            otherDecision: {
                type: Number,
            },
            myPayoffs: {
                type: Array,
            },
            otherPayoffs: {
                type: Array,
            },
            periodLength: Number,
            numSubperiods: Number,
            payoffMin: {
                type: Number,
            },
            payoffMax: {
                type: Number,
            },
            _currSubperiod: {
                type: Number,
                value: 0,
            }
        }
    }

    connectedCallback() {
        super.connectedCallback();
        this._initHighchart();
    }
    // sets up payoff over time graph
    _initHighchart() {
        // readability is overrated
        // just sums each set of payoffs and divides by 4
        const myInitialPayoff = this.myPayoffs.reduce(
            (a, b) => a + b, 0) / 4;
        const otherInitialPayoff = this.otherPayoffs.reduce(
            (a, b) => a + b, 0) / 4;

        const minPayoff = this.payoffMin === undefined ?
            Math.min(... this.myPayoffs.concat(this.otherPayoffs)) : this.payoffMin;
        const maxPayoff = this.payoffMax === undefined ?
            Math.max(... this.myPayoffs.concat(this.otherPayoffs)) : this.payoffMax;

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
                    data: [[0, 0]],
                    step: "left"
                },
                {
                    name: 'Other Payoff',
                    type: "line",
                    data: [[0, 0]],
                    step: "left"
                }
            ],
            legend: {
                align: 'right',
                verticalAlign: 'top',
                floating: true,
                y: 15,
            },
        });
    }
    // helper method to return last element of array
    _lastElem(arr) {
        return arr[arr.length - 1];
    }
    _handleGroupDecisionsEvent(event) {
        const groupDecisions = event.detail.payload;
        const myDecision = groupDecisions[this.$.constants.participantCode];
        const otherDecision = (() => {
            let sum_avg_strategy = 0;
            let num_other_players = 0;
            for (const player of this.$.constants.group.players) {
                if (player.role != this.$.constants.role) {
                    sum_avg_strategy += groupDecisions[player.participantCode];
                    num_other_players++;
                }
            }
            return sum_avg_strategy / num_other_players;
        })();

        this._currSubperiod += 1;

        const myPayoff =
            (myDecision * otherDecision * this.myPayoffs[0]) +
            (myDecision * (1 - otherDecision) * this.myPayoffs[1]) +
            ((1 - myDecision) * otherDecision * this.myPayoffs[2]) +
            ((1 - myDecision) * (1 - otherDecision) * this.myPayoffs[3]);

        const otherPayoff =
            (myDecision * otherDecision * this.otherPayoffs[0]) +
            (myDecision * (1 - otherDecision) * this.otherPayoffs[1]) +
            ((1 - myDecision) * otherDecision * this.otherPayoffs[2]) +
            ((1 - myDecision) * (1 - otherDecision) * this.otherPayoffs[3]);

        let dataset = this.graph_obj.series[0];
        this._lastElem(dataset.data).update({y: myPayoff});
        dataset.addPoint([this._currSubperiod, myPayoff]);

        dataset = this.graph_obj.series[1];
        this._lastElem(dataset.data).update({y: otherPayoff});
        dataset.addPoint([this._currSubperiod, otherPayoff]);
    }
}

window.customElements.define('subperiod-payoff-graph', SubperiodPayoffGraph);
