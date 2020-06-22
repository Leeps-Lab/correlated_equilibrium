import {html,PolymerElement} from '/static/otree-redwood/node_modules/@polymer/polymer/polymer-element.js';
import '/static/otree-redwood/src/redwood-period/redwood-period.js';

export class PayoffGraph extends PolymerElement {

    static get template() {
        return html `
            <style>

                :host {
                    display: block;
                }

            </style>

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

        for (i=0; i< this.myPayoffs.length; i++) {
            
            for(j = 0; j < this.myPayoffs[0].length; j++) {
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
        // if graph hasn't been initialized, don't do anything
        if (!this.graph_obj) return;

        // calculate the payoff with current decision values
        var my_point_payoff = this.myPayoffs[this.myDecision][this.otherDecision];
        var other_point_payoff = this.otherPayoffs[this.otherDecision][this.myDecision];

        // calculate new decision's timestamp as a value between 0 and 1
        const xval = (
            (performance.now() - this.start_time) /
            (this.periodLength * 1000));
        if (isNaN(xval) || xval <= 0) return;

        // add point for my payoff
        let dataset = this.graph_obj.series[0];
        this._lastElem(dataset.data).remove();
        dataset.addPoint([xval, my_point_payoff]);
        dataset.addPoint([xval+Number.EPSILON, my_point_payoff]);

        // add point for other payoff
        dataset = this.graph_obj.series[1]
        this._lastElem(dataset.data).remove()
        dataset.addPoint([xval, other_point_payoff]);
        dataset.addPoint([xval+Number.EPSILON, other_point_payoff]);
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
