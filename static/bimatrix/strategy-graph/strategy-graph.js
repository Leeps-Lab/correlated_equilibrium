import {html,PolymerElement} from '/static/otree-redwood/node_modules/@polymer/polymer/polymer-element.js';
import '/static/otree-redwood/src/redwood-period/redwood-period.js';

export class StrategyGraph extends PolymerElement {

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

    static get properties() {
        return {
            myDecision: {
                type: Number,
                observer: '_updateDataset'
            },
            otherDecision: {
                type: Number,
                observer: '_updateDataset'
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
                data: this.myChoiceSeries,
                step: "left"
            },
            {
                name: 'Other Choice',
                data: this.otherChoiceSeries,
                step: "left"
            }],
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

        // add point for my new decision
        let dataset = this.graph_obj.series[0];
        this._lastElem(dataset.data).remove();
        dataset.addPoint([xval, this.myDecision]);
        dataset.addPoint([xval, this.myDecision]);

        // add point for others' new decision
        dataset = this.graph_obj.series[1];
        this._lastElem(dataset.data).remove();
        dataset.addPoint([xval, this.otherDecision]);
        dataset.addPoint([xval, this.otherDecision]);
    }
}

window.customElements.define('strategy-graph', StrategyGraph);
