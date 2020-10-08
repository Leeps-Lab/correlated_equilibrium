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
            title: { text: 'Choice vs. Time' },
            exporting: { enabled: false },
            tooltip: { enabled: false },
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
                column: {
                    stacking: 'normal'
                  },
                area: {marker: {enabled: false}},
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
            series: (!this.maxInfo) ? (this.$.constants.role == "p3" || this.gameType == 'MV1' || this.gameType == 'MV2')? [
                {
                    name: 'U',
                    borderColor: null,
                    color: '#ffff00',
                    type: "area",
                    data: [[0, 0]],
                    step: "left"
                },
                {
                    name: 'C',
                    borderColor: null,
                    color: '#04f2ff',
                    type: "area",
                    data: [[0, 0]],
                    step: "left"
                },
                {
                    name: 'D',
                    borderColor: null,
                    color: '#9aff02',
                    type: "area",
                    data: [[0, 0]],
                    step: "left"
                },
            ] : [
                {
                    name: 'C',
                    borderColor: null,
                    color: '#04f2ff',
                    type: "area",
                    data: [[0, 0]],
                    step: "left"
                },
                {
                    name: 'D',
                    borderColor: null,
                    color: '#9aff02',
                    type: "area",
                    data: [[0, 0]],
                    step: "left"
                },
            ] : (this.numPlayers % 3 == 0 ) ? 
                    (this.$.constants.role == "p3")? [
                    {
                        name: 'U',
                        borderColor: null,
                        color: '#ffff00',
                        type: "area",
                        data: [[0, 0]],
                        step: "left"
                    },
                    {
                        name: 'C',
                        borderColor: null,
                        color: '#04f2ff',
                        type: "area",
                        data: [[0, 0]],
                        step: "left"
                    },
                    {
                        name: 'D',
                        borderColor: null,
                        color: '#9aff02',
                        type: "area",
                        data: [[0, 0]],
                        step: "left"
                    },
                    {
                        name: 'P1 Choice',
                        color: '#000000',
                        type: "line",
                        data: [[0, 0]],
                        step: "left"
                    },
                    {
                        name: 'P2 Choice',
                        color: '#ff0000',
                        type: "line",
                        data: [[0, 0]],
                        step: "left"
                    },
                    
                ] : [
                    {
                        name: 'C',
                        borderColor: null,
                        color: '#04f2ff',
                        type: "area",
                        data: [[0, 0]],
                        step: "left"
                    },
                    {
                        name: 'D',
                        borderColor: null,
                        color: '#9aff02',
                        type: "area",
                        data: [[0, 0]],
                        step: "left"
                    },
                    {
                        name: (this.$.constants.role == "p2") ? 'P1 Choice' : 'P2 Choice',
                        color: '#000000',
                        type: "line",
                        data: [[0, 0]],
                        step: "left"
                    },
                    {
                        name: 'P3 Chooses C',
                        color: '#ff0000',
                        type: "line",
                        data: [[0, 0]],
                        step: "left"
                    },
                    {
                        name: 'P3 Chooses U',
                        color: '#ff0000',
                        type: "line",
                        data: [[0, 0]],
                        step: "left",
                        dashStyle: 'dot'
                    },
                ] : //two player games
            (this.gameType == "MV1" || this.gameType == "MV2") ?
            [
                {
                    name: 'U',
                    borderColor: null,
                    color: '#ffff00',
                    type: "area",
                    data: [[0, 0]],
                    step: "left"
                },
                {
                    name: 'C',
                    borderColor: null,
                    color: '#04f2ff',
                    type: "area",
                    data: [[0, 0]],
                    step: "left"
                },
                {
                    name: 'D',
                    borderColor: null,
                    color: '#9aff02',
                    type: "area",
                    data: [[0, 0]],
                    step: "left"
                },
                {
                    name: ( this.$.constants.role == "p2") ? 'P1 Chooses C' : 'P2 Chooses C',
                    color: '#ff0000',
                    type: "line",
                    data: [[0, 0]],
                    step: "left"
                },
                {
                    name: ( this.$.constants.role == "p2") ? 'P1 Chooses U' : 'P2 Chooses U',
                    color: '#ff0000',
                    type: "line",
                    data: [[0, 0]],
                    step: "left",
                    dashStyle: 'dot'
                },
                
            ] : [
                {
                    name: 'C',
                    borderColor: null,
                    color: '#04f2ff',
                    type: "area",
                    data: [[0, 0]],
                    step: "left"
                },
                {
                    name: 'D',
                    borderColor: null,
                    color: '#9aff02',
                    type: "area",
                    data: [[0, 0]],
                    step: "left"
                },
                {
                    name: ( this.$.constants.role == "p2") ? 'P1 Choice' : 'P2 Choice',
                    color: '#ff0000',
                    type: "line",
                    data: [[0, 0]],
                    step: "left",
                },
            ],
            legend: {
                enabled:  true ,
                align: 'right',
                verticalAlign: 'top',
                floating: true,
                y: 15,
                itemStyle: {"fontSize": "0.75em",},
            },
        });
    }
    _handleGroupDecisionsEvent(event) {
        this._currSubperiod += 1;

        let dataset;
        var p1Decision, p2Decision, p3Decision;

        var p1Decisions = [];
        var p2Decisions = [];
        var p3Decisions = [];

        // populate decison arrays by role
        for (const player of this.$.constants.group.players) {
            if(player.role == "p1") { 
                p1Decision = this.groupDecisions[player.participantCode];
                p1Decisions.push(p1Decision);
            }
            else if(player.role == "p2") { 
                p2Decision = this.groupDecisions[player.participantCode];
                p2Decisions.push(p2Decision);
            }
            else if(player.role == "p3") { 
                p3Decision = this.groupDecisions[player.participantCode];
                p3Decisions.push(p3Decision);
            }
        }


        //For your choice
        if(this.$.constants.role == "p3") {
            /* For Stacked Area
            var count2 = 0;
            var count1 = 0;
            var count0 = 0;

            var len = p3Decisions.length;

            for(const p3 of p3Decisions){
                if (p3 == 2) count2++;
                if (p3 == 1) count1++;
                if (p3 == 0) count0++;
            }

            count2 /= len;
            count1 /= len;
            count0 /= len;


            dataset = this.graph_obj.series[0];
            this._lastElem(dataset.data).update({y: count2});
            dataset.addPoint([this._currSubperiod, count2]);

            dataset = this.graph_obj.series[1];
            this._lastElem(dataset.data).update({y: count1});
            dataset.addPoint([this._currSubperiod, count1]);

            dataset = this.graph_obj.series[2];
            this._lastElem(dataset.data).update({y: count0});
            dataset.addPoint([this._currSubperiod, count0]);
            */
            dataset = this.graph_obj.series[0];
            this._lastElem(dataset.data).update({y: (this.myDecision == 2) ? 1 : 0});
            dataset.addPoint([this._currSubperiod, (this.myDecision == 2) ? 1 : 0]);

            dataset = this.graph_obj.series[1];
            this._lastElem(dataset.data).update({y: (this.myDecision == 1) ? 1 : 0});
            dataset.addPoint([this._currSubperiod, (this.myDecision == 1) ? 1 : 0]);

            dataset = this.graph_obj.series[2];
            this._lastElem(dataset.data).update({y: (this.myDecision == 0) ? 1 : 0});
            dataset.addPoint([this._currSubperiod, (this.myDecision == 0) ? 1 : 0]);

        }
        else {/* For stacked area
            var count2 = 0;
            var count1 = 0;
            var count0 = 0;

            var len = p2Decisions.length;

            if(this.$.constants.role == "p2"){
                for(const p2 of p2Decisions){
                    if (p2 == 2) count2++;
                    if (p2 == 1) count1++;
                    if (p2 == 0) count0++;
                }
            }
            
            if(this.$.constants.role == "p1"){
                for(const p1 of p1Decisions){
                    if (p1 == 2) count2++;
                    if (p1 == 1) count1++;
                    if (p1 == 0) count0++;
                }
            }
            

            count2 /= len;
            count1 /= len;
            count0 /= len;*/

            if(this.gameType == 'MV1' || this.gameType == 'MV2'){/*
                dataset = this.graph_obj.series[0];
                this._lastElem(dataset.data).update({y: count2});
                dataset.addPoint([this._currSubperiod, count2]);

                dataset = this.graph_obj.series[1];
                this._lastElem(dataset.data).update({y: count1});
                dataset.addPoint([this._currSubperiod, count1]);

                dataset = this.graph_obj.series[2];
                this._lastElem(dataset.data).update({y: count0});
                dataset.addPoint([this._currSubperiod, count0]);
                */
                dataset = this.graph_obj.series[0];
                this._lastElem(dataset.data).update({y: (this.myDecision == 2) ? 1 : 0});
                dataset.addPoint([this._currSubperiod, (this.myDecision == 2) ? 1 : 0]);

                dataset = this.graph_obj.series[1];
                this._lastElem(dataset.data).update({y: (this.myDecision == 1) ? 1 : 0});
                dataset.addPoint([this._currSubperiod, (this.myDecision == 1) ? 1 : 0]);

                dataset = this.graph_obj.series[2];
                this._lastElem(dataset.data).update({y: (this.myDecision == 0) ? 1 : 0});
                dataset.addPoint([this._currSubperiod, (this.myDecision == 0) ? 1 : 0]);

            } else {/*
                dataset = this.graph_obj.series[0];
                this._lastElem(dataset.data).update({y: count1});
                dataset.addPoint([this._currSubperiod, count1]);

                dataset = this.graph_obj.series[1];
                this._lastElem(dataset.data).update({y: count0});
                dataset.addPoint([this._currSubperiod, count0]);
                */

                dataset = this.graph_obj.series[0];
                this._lastElem(dataset.data).update({y: (this.myDecision == 1) ? 1 : 0});
                dataset.addPoint([this._currSubperiod, (this.myDecision == 1) ? 1 : 0]);

                dataset = this.graph_obj.series[1];
                this._lastElem(dataset.data).update({y: (this.myDecision == 0) ? 1 : 0});
                dataset.addPoint([this._currSubperiod, (this.myDecision == 0) ? 1 : 0]);
            }

            
        }


        //For other choices
        if(this.numPlayers % 2 == 0  && this.maxInfo) {
            var count2 = 0;
            var count1 = 0;

            var len = p2Decisions.length;

            if(this.$.constants.role == "p2"){
                for(const p1 of p1Decisions){
                    if (p1 == 2) count2++;
                    if (p1 == 1) count1++;
                }
            }
            
            if(this.$.constants.role == "p1"){
                for(const p2 of p2Decisions){
                    if (p2 == 2) count2++;
                    if (p2 == 1) count1++;
                }
            }
            

            count2 /= len;
            count1 /= len;


            if(this.gameType == 'MV1' || this.gameType == 'MV2') {
                //plot if other player chose 1
                dataset = this.graph_obj.series[3];
                this._lastElem(dataset.data).update({y: count1});
                dataset.addPoint([this._currSubperiod, count1]);  

                //plot if other player chose 2
                dataset = this.graph_obj.series[4];
                this._lastElem(dataset.data).update({y: count2});
                dataset.addPoint([this._currSubperiod, count2]);  
            }
            else {
                //plot other player's decision
                dataset = this.graph_obj.series[2];
                this._lastElem(dataset.data).update({y: count1});
                dataset.addPoint([this._currSubperiod, count1]);  
            }
        }

        if(this.numPlayers % 3 == 0 && this.maxInfo) {
            if(this.$.constants.role == "p3"){
                var count1 = 0;

                var len = p2Decisions.length;

                for(const p1 of p1Decisions){
                    if (p1 == 1) count1++;
                }

                count1 /= len;

                //p1 decision (average if mean-matching) 
                dataset = this.graph_obj.series[3];
                this._lastElem(dataset.data).update({y: count1});
                dataset.addPoint([this._currSubperiod, count1]);

                count1 = 0;

                for(const p2 of p2Decisions){
                    if (p2 == 1) count1++;
                }
                                
                count1 /= len;

                //p2 decision (average if mean-matching) 
                dataset = this.graph_obj.series[4];
                this._lastElem(dataset.data).update({y: count1});
                dataset.addPoint([this._currSubperiod, count1]);
            }
            else{
                var count1 = 0;
                var len = p3Decisions.length;

                if(this.$.constants.role == "p2"){
                    for(const p1 of p1Decisions){
                        if (p1 == 1) count1++;
                    }
                } else if (this.$.constants.role == "p1"){
                    for(const p2 of p2Decisions){
                        if (p2 == 1) count1++;
                    }
                }

                count1 /= len;

                //plot the other player with two decisions
                dataset = this.graph_obj.series[2];
                this._lastElem(dataset.data).update({y: count1});
                dataset.addPoint([this._currSubperiod, count1]);


                var count2 = 0;
                count1 = 0;

                for(const p3 of p3Decisions){
                    if (p3 == 2) count2++;
                    if (p3 == 1) count1++;
                }

                count2 /= len;
                count1 /= len;

                //plot if p3 chose 1
                dataset = this.graph_obj.series[3];
                this._lastElem(dataset.data).update({y: count1});
                dataset.addPoint([this._currSubperiod, count1]);

                //plot if p3 chose 2
                dataset = this.graph_obj.series[4];
                this._lastElem(dataset.data).update({y: count2});
                dataset.addPoint([this._currSubperiod, count2]);
                
            }
            
        }
    }
}

window.customElements.define('subperiod-strategy-graph', SubperiodStrategyGraph);
