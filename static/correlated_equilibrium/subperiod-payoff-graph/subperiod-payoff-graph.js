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

        let minPayoff = Infinity;
        let maxPayoff = -Infinity;
        
        for (var i=0; i< this.myPayoffs.length; i++) {
            for(var j = 0; j < this.myPayoffs[0].length; j++) {
                if(this.numPlayers % 2 == 0) {
                    minPayoff = Math.min(minPayoff, this.myPayoffs[i][j], this.otherPayoffs[i][j]);
                    maxPayoff = Math.max(maxPayoff, this.myPayoffs[i][j], this.otherPayoffs[i][j]);
                }
                else if(this.numPlayers % 3 == 0) {
                        
                    minPayoff = Math.min(minPayoff, this.myPayoffs[i][j], this.otherPayoffs[i][j], this.thirdPayoffs[i][j]);
                    maxPayoff = Math.max(maxPayoff, this.myPayoffs[i][j], this.otherPayoffs[i][j], this.thirdPayoffs[i][j]);   
                }
            }
        }

        if(this.numPlayers % 3 == 0) {
                        
            
            maxPayoff = 300;   
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
                    data: [[0, 0]],
                    step: "left"
                },
                {
                    name: (this.$.constants.role == "p3" || this.$.constants.role == "p2") ? 'P1 Payoff' : 'P2 Payoff',
                    type: "line",
                    data: [[0, 0]],
                    step: "left"
                },
                
                {
                    name: (this.$.constants.role == "p3" ) ? 'P2 Payoff' : 'P3 Payoff',
                    color: '#ff0900',
                    type: "line",
                    data: [[0, 0]],
                    step: "left"
                } 
            ]
            : [
                {
                    name: 'Your Payoff',
                    type: "area",
                    data: [[0, 0]],
                    step: "left"
                },
                {
                    name: ( this.$.constants.role == "p2") ? 'P1 Payoff' : 'P2 Payoff',
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
    // helper method to return last element of array
    _lastElem(arr) {
        return arr[arr.length - 1];
    }
    _handleGroupDecisionsEvent(event) {
        const groupDecisions = event.detail.payload;
        if(typeof groupDecisions === 'undefined') return;
        if(Object.keys(groupDecisions).length == 0) return;
        for(let decision of Object.values(groupDecisions)){
            if(decision === null) return;
        }

        const myDecision = groupDecisions[this.$.constants.participantCode];
        var my_flow_payoff = 0;
        var other_flow_payoff = 0;
        var third_flow_payoff = 0;
        var num_other_players = 0;
        
        var p1_decisions = [];
        var p2_decisions = [];
        var p3_decisions = [];

        this._currSubperiod += 1;
        
        //Get payoffs
        if(this.numPlayers % 2 == 0) {

            // populate decision arrays
            for (const player of this.$.constants.group.players) {
                let otherDecision = groupDecisions[player.participantCode];
                if(player.role == 'p1') p1_decisions.push(otherDecision);
                if(player.role == 'p2') p2_decisions.push(otherDecision);
                num_other_players++;
            }
            console.log("num_other_players: " + num_other_players);

            if(this.$.constants.role == 'p1'){
                // calculate my payoff (average w.r.t myDecision if mean-matching)
                for(const p2 of p2_decisions){
                    my_flow_payoff += this.myPayoffs[myDecision][p2];
                    //other_flow_payoff += this.otherPayoffs[myDecision][p2];
                }

                // calculate p2 average (overall average if mean-matching)
                for(const p2 of p2_decisions){
                    for(const p1 of p1_decisions){
                        other_flow_payoff += this.otherPayoffs[p1][p2];
                    }
                }

            }

            if(this.$.constants.role == 'p2'){
                // calculate my payoff (average w.r.t myDecision if mean-matching)
                for(const p1 of p1_decisions){
                    my_flow_payoff += this.myPayoffs[myDecision][p1];
                    //other_flow_payoff += this.otherPayoffs[myDecision][p1];
                }

                // calculate p1 average (overall average if mean-matching)
                for(const p1 of p1_decisions){
                    for(const p2 of p2_decisions){
                        other_flow_payoff += this.otherPayoffs[p2][p1];
                    }
                }
            }
            let pop_size = p1_decisions.length;

            my_flow_payoff /= pop_size;
            other_flow_payoff /= (pop_size * pop_size);
        }
        else if(this.numPlayers % 3 == 0) {
            var p1Decision, p2Decision, p3Decision;
            var p1ID, p2ID, p3ID;
            
            // populate decision arrays
            for (const player of this.$.constants.group.players) {
                let decision = groupDecisions[player.participantCode];
                if(player.role == 'p1') p1_decisions.push(decision);
                if(player.role == 'p2') p2_decisions.push(decision);
                if(player.role == 'p3') p3_decisions.push(decision);
                                  
                num_other_players++;
                
            }

            if(this.$.constants.role == "p1") {
                // calculate own payoff
                for(const p2 of p2_decisions){
                    for(const p3 of p3_decisions){
                        my_flow_payoff += this.payoffMatrix[p3][myDecision][p2][0];
                        //other_flow_payoff += this.payoffMatrix[p3][myDecision][p2][1];
                        //third_flow_payoff += this.payoffMatrix[p3][myDecision][p2][2];

                    }

                }

                // calculate other payoffs
                for(const p1 of p1_decisions){
                    for(const p2 of p2_decisions){
                        for(const p3 of p3_decisions){
                            other_flow_payoff += this.payoffMatrix[p3][p1][p2][1];
                            third_flow_payoff += this.payoffMatrix[p3][p1][p2][2];
                        }
                    }
                }


            }
            else if(this.$.constants.role == "p2") {
                // calculate own payoff
                for(const p1 of p1_decisions){
                    for(const p3 of p3_decisions){
                        my_flow_payoff += this.originalPayoffMatrix[p3][p1][myDecision][1];
                        //other_flow_payoff += this.originalPayoffMatrix[p3][p1][myDecision][0];
                        //third_flow_payoff += this.originalPayoffMatrix[p3][p1][myDecision][2];

                    }

                }

                // calculate other payoffs
                for(const p1 of p1_decisions){
                    for(const p2 of p2_decisions){
                        for(const p3 of p3_decisions){
                            other_flow_payoff += this.originalPayoffMatrix[p3][p1][p2][0];
                            third_flow_payoff += this.originalPayoffMatrix[p3][p1][p2][2];
                        }
                    }
                }

            }
            else if(this.$.constants.role == "p3") {
                // calculate own payoff
                for(const p1 of p1_decisions){
                    for(const p2 of p2_decisions){
                        my_flow_payoff += this.originalPayoffMatrix[myDecision][p1][p2][2];
                        //other_flow_payoff += this.originalPayoffMatrix[myDecision][p1][p2][0];
                        //third_flow_payoff += this.originalPayoffMatrix[myDecision][p1][p2][1];

                    }

                }

                // calculate other payoffs
                for(const p1 of p1_decisions){
                    for(const p2 of p2_decisions){
                        for(const p3 of p3_decisions){
                            other_flow_payoff += this.originalPayoffMatrix[p3][p1][p2][0];
                            third_flow_payoff += this.originalPayoffMatrix[p3][p1][p2][1];
                        }
                    }
                }

            }
            let pop_size = p1_decisions.length;
            //Divide to take average
            my_flow_payoff /= (pop_size * pop_size);
            other_flow_payoff /= (pop_size * pop_size * pop_size);
            third_flow_payoff /= (pop_size * pop_size * pop_size);

        }
        //plot own payoff
        let dataset = this.graph_obj.series[0];
        this._lastElem(dataset.data).update({y: my_flow_payoff});
        dataset.addPoint([this._currSubperiod, my_flow_payoff]);
        
        //plot other payoff
        if(this.maxInfo){
            dataset = this.graph_obj.series[1];
            this._lastElem(dataset.data).update({y: other_flow_payoff});
            dataset.addPoint([this._currSubperiod, other_flow_payoff]);

            
            if(this.numPlayers % 3 == 0) {
                dataset = this.graph_obj.series[2];
                this._lastElem(dataset.data).update({y: third_flow_payoff});
                dataset.addPoint([this._currSubperiod, third_flow_payoff]);
            }
        }
    }
}

window.customElements.define('subperiod-payoff-graph', SubperiodPayoffGraph);
