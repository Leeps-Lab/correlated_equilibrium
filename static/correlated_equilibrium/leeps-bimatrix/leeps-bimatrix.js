import {html,PolymerElement} from '/static/otree-redwood/node_modules/@polymer/polymer/polymer-element.js';
import '/static/otree-redwood/node_modules/@polymer/polymer/lib/elements/dom-repeat.js';
import '../polymer-elements/iron-flex-layout-classes.js';
import '../polymer-elements/paper-progress.js';
import '../polymer-elements/paper-radio-button.js';
import '../polymer-elements/paper-radio-group.js';

import '/static/otree-redwood/src/redwood-decision/redwood-decision.js';
import '/static/otree-redwood/src/redwood-period/redwood-period.js';
import '/static/otree-redwood/src/redwood-decision-bot/redwood-decision-bot.js';
import '/static/otree-redwood/src/otree-constants/otree-constants.js';

import '../bimatrix-heatmap/bimatrix-heatmap.js';
import '../heatmap-thermometer/heatmap-thermometer.js';
import '../payoff-graph/payoff-graph.js';
import '../subperiod-payoff-graph/subperiod-payoff-graph.js';
import '../strategy-graph/strategy-graph.js';
import '../subperiod-strategy-graph/subperiod-strategy-graph.js';
import '../styled-range/styled-range.js';
import '../discrete-mean-matching-heatmap/discrete-mean-matching-heatmap.js';

import '../color.js';


export class LeepsBimatrix extends PolymerElement {

    static get template() {
        return html `
            <style include="iron-flex iron-flex-alignment"></style>
            <style>
                :host {
                    display: block;
                    margin: 30px 0 40px 0;
                    user-select: none;
                }

                #graphs-column {
                    margin-left: 20px;
                }

                #your-heatmap {
                    margin-top: 30px;
                }

                #payoff-table  {
                    width: 300px;
                    height: 300px;
                    border-collapse: collapse;
                    border: 1px solid black;
                }

                #payoff-table  {
                    width: 300px;
                    height: 300px;
                    border-collapse: collapse;
                    border: 1px solid black;
                }

                .your-payoff {
                    font-weight: bold;
                    font-size: 16pt;
                }

                .other-payoff {
                    font-size: 14pt;
                }

                paper-radio-group {
                    height: 300px;
                }

                #payoff-table td {
                    border: 1px solid black;
                    text-align: center;
                    vertical-align: center;
                }

                #payoff-table.two{
                    margin-right: 30px;
                }

                #payoff-table.two tr td{
                    width: 50%;
                }

                styled-range {
                    transform: rotate(270deg) translateX(-100%);
                    transform-origin: 0 0px;
                    width: 315px;
                    height: 50px;
                }

                .slider-container {
                    margin-top: 13px;
                    width: 50px;
                    height: 315px;
                }

                heatmap-thermometer {
                    margin-bottom: 20px;
                    height: 243px;
                }

                strategy-graph, subperiod-strategy-graph {
                    width: 510px;
                    height: 200px;
                }

                payoff-graph, subperiod-payoff-graph {
                    width: 510px;
                    height: 305px;
                }

                paper-progress {
                    margin-bottom: 10px;
                    --paper-progress-height: 30px;
                }

                .light-blue {
                    background-color: #b5d9ff;
                }

                .blue {
                    background-color: #39f;
                }

                .dark-blue {
                    background-color: #2a22c9;
                }

            </style>

            <otree-constants id="constants"></otree-constants>
            <redwood-period
                running="{{ _isPeriodRunning }}"
                on-period-start="_onPeriodStart"
                on-period-end="_onPeriodEnd">
            </redwood-period>

            <redwood-decision
                initial-decision="[[ initialDecision ]]"
                my-decision="{{ myPlannedDecision }}"
                my-current-decision="{{ myDecision }}"
                group-decisions="{{ groupDecisions }}"
                max-per-second="10"
                on-group-decisions-changed="_onGroupDecisionsChanged"
                mean-matching="[[ meanMatching ]]">
            </redwood-decision>

            <redwood-decision-bot
                id="bot"
                my-decision="{{ myPlannedDecision }}"
                other-decision="[[ otherDecision ]]">
            </redwood-decision-bot>

            <div class="layout vertical center">

                <div class="layout vertical end">

                    <template is="dom-if" if="[[ numSubperiods ]]">
                        <paper-progress
                            value="[[ _subperiodProgress ]]">
                        </paper-progress>
                    </template>

                    <div class="layout horizontal">

                        <div id="heatmap-column" class="layout horizontal">
                            <template is="dom-if" if="[[ pureStrategy ]]">
                                <paper-radio-group
                                    class="layout vertical around-justified self-center"
                                    selected="{{ _myPlannedDecisionString }}">
                                    
                                    <template is="dom-if" if="[[ !isMultiDim ]]">
                                        <template is="dom-repeat" items="{{_arrayIndex(payoffMatrix)}}">
                                            <paper-radio-button name="[[item]]"></paper-radio-button>
                                        </template>
                                    </template>

                                    <template is="dom-if" if="[[ isMultiDim ]]">
                                        <template is="dom-if" if="[[ _p3Role() ]]">
                                            <paper-radio-button name="2"></paper-radio-button>
                                            <paper-radio-button name="1"></paper-radio-button>
                                            <paper-radio-button name="0"></paper-radio-button>
                                        </template>

                                        <template is="dom-if" if="[[ !_p3Role() ]]">
                                            <paper-radio-button name="1"></paper-radio-button>
                                            <paper-radio-button name="0"></paper-radio-button>
                                        </template>
                                    </template>
                                </paper-radio-group>

                                <template is="dom-if" if="[[ meanMatching ]]">
                                    <discrete-mean-matching-heatmap
                                        class="self-center"
                                        my-decision="[[ myDecision ]]"
                                        other-decision="[[ otherDecision ]]"
                                        size="300"
                                        payoffs="[[ myPayoffs ]]"
                                        color="[[ myColor ]]">
                                    </discrete-mean-matching-heatmap>
                                </template>
                                <template is="dom-if" if="[[ !meanMatching ]]">
                                    <template is="dom-if" if="[[ !isMultiDim ]]">

                                        <table id="payoff-table" class="self-center" >
                                            <template is="dom-repeat" index-as="rowIndex" items="{{_reverse(payoffMatrix)}}" as="row">
                                                <tr>
                                                    <template is="dom-repeat" index-as="colIndex" items="{{_reverse(row)}}" as="column">
                                                            <td class$="[[ _payoffMatrixClass(myPlannedDecision, otherDecision, rowIndex, colIndex, payoffMatrix) ]]">
                                                                    <span class="your-payoff">
                                                                        [[ _array(column, payoffIndex) ]]
                                                                    </span>,
                                                                    <span class="other-payoff">
                                                                        [[ _array(column, otherPayoffIndex) ]]
                                                                    </span>
                                                            </td>
                                                    </template>
                                                </tr>
                                            </template>
                                        </table>
                                    </template>

                                    <template is="dom-if" if="[[ isMultiDim ]]">

                                        <template is="dom-repeat" index-as="matrixIndex" items="{{_reverse(payoffMatrix)}}" as="matrix">

                                            <table id="payoff-table" class="self-center two" >
                                                    <template is="dom-repeat" index-as="rowIndex" items="{{_reverse(matrix)}}" as="row">
                                                        <tr>
                                                            <template is="dom-repeat" index-as="colIndex" items="{{_reverse(row)}}" as="column">
                                                                    <td class$="[[ _payoffMatrixClass3(myPlannedDecision, otherDecisionArray, rowIndex, colIndex, matrixIndex, payoffMatrix) ]]">
                                                                        <template is="dom-if" if="[[ _p1Role() ]]">
                                                                            <span class="your-payoff">
                                                                                [[ _array(column, 0) ]]
                                                                            </span>
                                                                            
                                                                        </template>
                                                                        <template is="dom-if" if="[[ _p2Role() ]]">
                                                                            <span class="your-payoff">
                                                                                [[ _array(column, 1) ]]
                                                                            </span>
                                                                        </template>
                                                                        <template is="dom-if" if="[[ _p3Role() ]]">
                                                                            <span class="your-payoff">
                                                                                [[ _array(column, 2) ]]
                                                                            </span>
                                                                        </template>
                                                                        <br>
                                                                        <span> i = [[rowIndex]], j = [[colIndex]], m = [[matrixIndex]]
                                                                        </span>
                                                                    </td>
                                                            </template>
                                                        </tr>
                                                    </template>
                                            </table>
                                        </template>  
                                    </template>  
                                </template>
                            </template>
                        </div>

                        <div id="graphs-column" class="layout horizontal">
                            <div class="layout horizontal end">
                                <template is="dom-if" if="[[ _showThermometer(pureStrategy, meanMatching) ]]">
                                    <heatmap-thermometer
                                        color="rainbow"
                                        class="self-end">
                                    </heatmap-thermometer>
                                </template>
                                <div class="layout vertical">
                                    <template is="dom-if" if="[[ !numSubperiods ]]">
                                        <strategy-graph
                                            my-decision="[[ myPlannedDecision ]]"
                                            other-decision="[[ otherDecision ]]"
                                            period-length="[[ periodLength ]]"
                                            my-choice-series="[[ myChoiceSeries ]]"
                                            other-choice-series="[[ otherChoiceSeries ]]"
                                        ></strategy-graph>
                                        <payoff-graph
                                            group-decisions="{{ groupDecisions }}"
                                            my-decision="[[ myPlannedDecision ]]"
                                            other-decision="[[ otherDecision ]]"
                                            my-payoffs="[[ myPayoffs ]]"
                                            other-payoffs="[[ otherPayoffs ]]"
                                            period-length="[[ periodLength ]]"
                                            my-payoff-series="[[ myPayoffSeries ]]"
                                            other-payoff-series="[[ otherPayoffSeries ]]"
                                        ></payoff-graph>
                                    </template>
                                    <template is="dom-if" if="[[ numSubperiods ]]">
                                        <subperiod-strategy-graph
                                            num-players="[[ numPlayers ]]"
                                            group-decisions="{{ groupDecisions }}"
                                            my-decision="[[ myDecision ]]"
                                            other-decision="[[ otherDecision ]]"
                                            other-decision-array="[[ otherDecisionArray ]]"
                                            period-length="[[ periodLength ]]"
                                            num-subperiods="[[ numSubperiods ]]"
                                        ></subperiod-strategy-graph>
                                        <subperiod-payoff-graph
                                            group-decisions="{{ groupDecisions }}"
                                            my-payoffs="[[ myPayoffs ]]"
                                            other-payoffs="[[ otherPayoffs ]]"
                                            third-payoffs="[[ thirdPayoffs ]]"
                                            payoff-matrix="[[ payoffMatrix ]]"
                                            period-length="[[ periodLength ]]"
                                            num-subperiods="[[ numSubperiods ]]"
                                            num-players="[[ numPlayers ]]"
                                        ></subperiod-payoff-graph>
                                    </template>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        `
    }

    static get properties() {
        return {
            payoffMatrix: Array,
            initialDecision: {
                type: Number,
            },
            numPlayers: {
                type: Number,
            },
            myPlannedDecision: {
                type: Number,
            },
            groupDecisions: {
                type: Object,
            },
            myDecision: {
                type: Number,
            },
            // can't use otherDecision from redwood-decision because of mean matching special case
            otherDecision: {
                type: Number,
                computed: '_computeOtherDecision(groupDecisions)',
            },
            otherDecisionArray: {
                type: Array,
                computed: '_otherDecisionArray(groupDecisions)',
            },
            periodLength: Number,
            numSubperiods: {
                type: Number,
                value: 0
            },
            pureStrategy: {
                type: Boolean,
                value: false
            },
            isMultiDim: {
                type: Boolean,
                value: false
            },
            showAtWorst: {
                type: Boolean,
                value: false,
            },
            showBestResponse: {
                type: Boolean,
                value: false,
            },
            rateLimit: {
                type: Number,
            },
            meanMatching: {
                type: Boolean,
                value: false,
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
            // set by redwood-period
            _isPeriodRunning: {
                type: Boolean
            },
            _subperiodProgress: {
                type: Number,
                value: 0,
            },
            _myPlannedDecisionString: {
                type: String,
                observer: '_syncMyPlannedDecision',
            },
        }
    }

    ready() {
        super.ready()
        // set payoff indices
        if (this.$.constants.idInGroup === undefined) {
            console.log('Not in game, manually setting payoffIndex');
            this.payoffIndex = 0;
        } else {
            this.payoffIndex = (this.$.constants.idInGroup - 1) % 3;
        }
        this.otherPayoffIndex = Math.abs(1 - this.payoffIndex);
        this.thirdPayoffIndex = Math.abs(2 - this.payoffIndex);   

        //Get number of players
        let num_players = this.numPlayers;

        // transpose payoff and probability matrices if player controls vertical line
        if (this.$.constants.idInGroup % num_players == 0) {
            var i, j, t = [];

            // Loop through every item in the outer array (height)
            for (i=0; i < this.payoffMatrix[0].length; i++) {
                t[i] = [];

                for(j = 0; j < this.payoffMatrix.length; j++) {
                    t[i][j] = this.payoffMatrix[j][i];
                }
            }

            this.set("payoffMatrix", t);
        }

        // color schemes for each player's heatmaps
        this.myColor = 'rainbow';
        this.otherColor = 'red';

        // separate each player's payoffs into two separate arrays
        this.myPayoffs = [];
        this.otherPayoffs = [];
        this.thirdPayoffs = [];


        for (var i=0; i< this.payoffMatrix.length; i++) {
            this.myPayoffs[i] = [];
            this.otherPayoffs[i] = [];
            this.thirdPayoffs[i] = [];

            for(var j = 0; j < this.payoffMatrix[0].length; j++) {
                if(this.isMultiDim == false) {
                    this.myPayoffs[i][j] = this.payoffMatrix[i][j][this.payoffIndex];
                    this.otherPayoffs[i][j] = this.payoffMatrix[i][j][this.otherPayoffIndex];
                }
                else {
                    //If there are 3 players
                    for(var z = 0; z < this.payoffMatrix[0][0].length; z++) {
                        this.myPayoffs[i][j] = this.payoffMatrix[i][j][z][this.payoffIndex];
                        this.otherPayoffs[i][j] = this.payoffMatrix[i][j][z][this.otherPayoffIndex];
                        this.thirdPayoffs[i][j] = this.payoffMatrix[i][j][z][this.thirdPayoffIndex];
                    }
                }
            }
        }
        this.$.bot.payoffFunction = (myDecision, otherDecision) => {
            console.log("p");
            const m = this.myPayoffs;
            const row1 = myDecision * m[0][0] + (1 - myDecision) * m[0][1];
            const row2 = myDecision * m[1][0] + (1 - myDecision) * m[1][1];
            const flowPayoff = otherDecision * row1 + (1 - otherDecision) * row2;
            console.log(row1);
            return flowPayoff;
        }
        

        if (this.pureStrategy) {
            // if using pure strategy, set bot to only choose pure strategies
            this.$.bot.lambda = 1;
            this.$.bot.pattern = true;

            // only set decision string if we're not doing continuous strategy
            this._myPlannedDecisionString = new String(this.initialDecision);
        }
    }

    _p1Role() {
        return this.$.constants.role == 'p1';
    }

    _p2Role() {
        return this.$.constants.role == 'p2';
    }

    _p3Role() {
        return this.$.constants.role == 'p3';
    }

    _reverse(list) {
        return list.slice().reverse();
    }

    _arrayIndex(array) {
        var list = []
        for(var i = array.length - 1; i >= 0; i--) {
            list.push(i);
        }
        return list;
    }

    _array(a, i) {
        return a[i];
    }
    _payoffMatrixClass3(myDecision, otherDecisionArray, i, j, m, payoffMatrix) {
        let otherDecision = otherDecisionArray[0];
        let thirdDecision = otherDecisionArray[1];
        
        // this takes care of reversed i-indices 
        if (payoffMatrix.length == 3){
           if(i == 0)   i = 1; 
           else if (i == 1) i = 0; 
        } else if (payoffMatrix.length == 2){
           if(i == 0)  i = 2; 
           else if (i == 2) i= 0; 
        }

        let color = 0;
         
        // player's own decision
        if (myDecision == i) 
            color++;
        
        // 1st/2nd player's decision on 2nd/1st player's matrices
        if ("p3" != this.$.constants.role && otherDecision == j) 
            color++;
        
        // show third player's decision on first and second player's matrices  
        if ("p3" != this.$.constants.role && thirdDecision == m ){
             color++;
        } 
           
        // show first and second player's decisions on third player's matrices
        if ("p3" == this.$.constants.role){
            if (otherDecision == j )
                color++;
            if (thirdDecision == m)
                color++;
        }
            
        if (color == 1) return 'light-blue';
        else if (color == 2) return 'blue';
        else if (color == 3) return 'dark-blue';
        else return '';
    }
    _payoffMatrixClass(myDecision, otherDecision, i, j, payoffMatrix) {
        if (myDecision === (payoffMatrix.length - 1 - i) && otherDecision === (payoffMatrix[0].length - 1 - j)) {
            return 'blue';
        } else if (myDecision === (payoffMatrix.length - 1 - i) || otherDecision === (payoffMatrix[0].length - 1 - j)) {
            return 'light-blue';
        } 
        return '';
    }
    _syncMyPlannedDecision() {
        this.myPlannedDecision = parseInt(this._myPlannedDecisionString);
    }
    _onPeriodStart() {
        this._subperiodProgress = 0;
        this.lastT = performance.now();
        this._animID = window.requestAnimationFrame(
            this._updateSubperiodProgress.bind(this));
    }
    _onPeriodEnd() {
        window.cancelAnimationFrame(this._animID);
        this._subperiodProgress = 0;
    }
    _onGroupDecisionsChanged() {
        this.lastT = performance.now();
        this._subperiodProgress = 0;
    }
    _updateSubperiodProgress(t) {
        const deltaT = (t - this.lastT);
        const secondsPerSubperiod = this.periodLength / this.numSubperiods;
        this._subperiodProgress = 100 * ((deltaT / 1000) / secondsPerSubperiod);
        this._animID = window.requestAnimationFrame(
            this._updateSubperiodProgress.bind(this));
    }
    _computeOtherDecision(groupDecisions) {
        // calculate other decision as mean decision of others with opposite role
        // this works for pairwise matching and for mean matching
        let sum_avg_strategy = 0;
        let num_other_players = 0;
        for (let player of this.$.constants.group.players) {
            if (player.role != this.$.constants.role) {
                sum_avg_strategy += groupDecisions[player.participantCode];
                num_other_players++;
            }
        }
        return sum_avg_strategy / num_other_players;
    }
    _otherDecisionArray(groupDecisions) {
        let otherDecisionArray = [];
        for (let player of this.$.constants.group.players) {
            if (player.role != this.$.constants.role) {
                otherDecisionArray.push(groupDecisions[player.participantCode]);
            }
        }
        console.log("Other player decisions: " + otherDecisionArray);
        return otherDecisionArray;
    }
    // return true if thermometer is to be shown
    _showThermometer(pureStrategy, meanMatching) {
        return !pureStrategy || meanMatching;
    }
}

window.customElements.define('leeps-bimatrix', LeepsBimatrix);
