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
import '../regret-bar/regret-bar.js';
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

                regret-bar {
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
                    background-color: #054cff;
                }

                .matrices {
                    height: 300px;

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

                            <div class="layout vertical  ">
                                <regret-bar
                                    payoff-matrix="[[ payoffMatrix ]]"
                                    my-payoffs="[[ myPayoffs ]]"
                                    group-decisions="{{ groupDecisions }}"
                                    my-decision="[[ myDecision ]]"

                                ></regret-bar>                            
                            </div>
                            
                            <paper-radio-group
                                class="layout vertical around-justified "
                                selected="{{ _myPlannedDecisionString }}">

                                <template is="dom-if" if="[[ !isMultiDim ]]">

                                    <template is="dom-if" if="[[ _ifMVGame() ]]">
                                        <paper-radio-button name="2"><p> U </p></paper-radio-button>
                                        <paper-radio-button name="1"><p> C </p></paper-radio-button>
                                        <paper-radio-button name="0"><p> D </p></paper-radio-button>
                                    </template>

                                    <template is="dom-if" if="[[ !_ifMVGame() ]]">
                                        <paper-radio-button name="1"><p> C </p></paper-radio-button>
                                        <paper-radio-button name="0"><p> D </p></paper-radio-button>
                                    </template>

                                    <!--
                                    <template is="dom-repeat" items="{{_arrayIndex(payoffMatrix)}}">
                                        <paper-radio-button name="[[item]]">[[item]]</paper-radio-button>
                                    </template>
                                    -->                                        
                                </template>

                                <template is="dom-if" if="[[ isMultiDim ]]">
                                    <template is="dom-if" if="[[ _p3Role() ]]">
                                        <paper-radio-button name="2"><p> U </p></paper-radio-button>
                                        <paper-radio-button name="1"><p> C </p></paper-radio-button>
                                        <paper-radio-button name="0"><p> D </p></paper-radio-button>
                                    </template>

                                    <template is="dom-if" if="[[ !_p3Role() ]]">
                                        <paper-radio-button name="1"><p> C </p></paper-radio-button>
                                        <paper-radio-button name="0"><p> D </p></paper-radio-button>
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
                            <div class="layout vertical">
                            <template is="dom-if" if="[[ maxInfo ]]">
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
                                        <template is="dom-repeat" index-as="rowIndex" items="{{_reverse(stratMatrix)}}" as="row">
                                                <tr>
                                                    <template is="dom-repeat" index-as="colIndex" items="{{_reverse(row)}}" as="column">
                                                            <td class$="[[ _freq2Color( rowIndex, colIndex, stratMatrix) ]]">
                                                                    <span class="your-payoff">
                                                                    [[   _freq2( rowIndex, colIndex, stratMatrix) ]]
                                                                    </span>,
                                                                    <span class="other-payoff">
                                                                    [[   _freq2( rowIndex, colIndex, stratMatrix) ]]
                                                                    </span>
                                                            </td>
                                                    </template>
                                                </tr>
                                            </template>
                                    </template>
                                    

                                    <template is="dom-if" if="[[ isMultiDim ]]">
                                        <div class="layout horizontal matrices" >
                                        <template is="dom-repeat" index-as="matrixIndex" items="{{payoffMatrix}}" as="matrix">

                                            <table id="payoff-table" class="self-center two" >
                                                    <template is="dom-repeat" index-as="rowIndex" items="{{_reverse(matrix)}}" as="row">
                                                        <tr>
                                                            <template is="dom-repeat" index-as="colIndex" items="{{row}}" as="column">
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
                                        </div>
                                        <div class="layout horizontal">
                                        <template is="dom-repeat" index-as="matrixIndex" items="{{stratMatrix}}" as="matrix">
                                            <table id="payoff-table" class="self-center two" >
                                                <template is="dom-repeat" index-as="rowIndex" items="{{_reverse(matrix)}}" as="row">
                                                    <tr>
                                                        <template is="dom-repeat" index-as="colIndex" items="{{row}}" as="column">
                                                                <td style="background-color: {{_freq3Color(matrixIndex, rowIndex, colIndex, stratMatrix)}} ;">
                                                                    <span class="your-payoff" >
                                                                        [[   _freq3(matrixIndex, rowIndex, colIndex, stratMatrix) ]]
                                                                    </span>
                                                                </td>
                                                        </template>
                                                    </tr>
                                                </template>
                                            </table>
                                        </template>   
                                        </div>
                                    </template>  
                                </template>
                            </template>
                            </div>
                        </div>

                        <div id="graphs-column" class="layout horizontal">
                            <div class="layout horizontal end">
                                <template is="dom-if" if="[[ _showThermometer(meanMatching) ]]">
                                    <heatmap-thermometer
                                        color="rainbow"
                                        class="self-end">
                                    </heatmap-thermometer>
                                </template>
                                <div class="layout vertical">
                                    <template is="dom-if" if="[[ !numSubperiods ]]">
                                        <strategy-graph
                                            game-type="[[ gameType ]]"
                                            num-players="[[ numPlayers ]]"
                                            my-decision="[[ myPlannedDecision ]]"
                                            other-decision="[[ otherDecision ]]"
                                            period-length="[[ periodLength ]]"
                                            my-choice-series="[[ myChoiceSeries ]]"
                                            other-decision-array="[[ otherDecisionArray ]]"
                                            other-choice-series="[[ otherChoiceSeries ]]"
                                            other-other-choice-series="[[ otherOtherChoiceSeries ]]"
                                            max-info="[[ maxInfo ]]"
                                        ></strategy-graph>
                                        <payoff-graph
                                            num-players="[[ numPlayers ]]"
                                            group-decisions="{{ groupDecisions }}"
                                            my-decision="[[ myPlannedDecision ]]"
                                            other-decision="[[ otherDecision ]]"
                                            original-payoff-matrix="[[ originalPayoffMatrix ]]"
                                            payoff-matrix="[[ payoffMatrix ]]"
                                            my-payoffs="[[ myPayoffs ]]"
                                            other-payoffs="[[ otherPayoffs ]]"
                                            period-length="[[ periodLength ]]"
                                            my-payoff-series="[[ myPayoffSeries ]]"
                                            other-payoff-series="[[ otherPayoffSeries ]]"
                                            other-other-payoff-series="[[ otherOtherPayoffSeries ]]"
                                            max-info="[[ maxInfo ]]"
                                        ></payoff-graph>
                                    </template>
                                    <template is="dom-if" if="[[ numSubperiods ]]">
                                        <subperiod-strategy-graph
                                            game-type="[[ gameType ]]"
                                            num-players="[[ numPlayers ]]"
                                            group-decisions="{{ groupDecisions }}"
                                            my-decision="[[ myDecision ]]"
                                            other-decision="[[ otherDecision ]]"
                                            other-decision-array="[[ otherDecisionArray ]]"
                                            period-length="[[ periodLength ]]"
                                            num-subperiods="[[ numSubperiods ]]"
                                            max-info="[[ maxInfo ]]"
                                        ></subperiod-strategy-graph>
                                        <subperiod-payoff-graph
                                            group-decisions="{{ groupDecisions }}"
                                            my-payoffs="[[ myPayoffs ]]"
                                            other-payoffs="[[ otherPayoffs ]]"
                                            third-payoffs="[[ thirdPayoffs ]]"
                                            payoff-matrix="[[ payoffMatrix ]]"
                                            original-payoff-matrix="[[ originalPayoffMatrix ]]"
                                            period-length="[[ periodLength ]]"
                                            num-subperiods="[[ numSubperiods ]]"
                                            num-players="[[ numPlayers ]]"
                                            max-info="[[ maxInfo ]]"
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
            originalPayoffMatrix: Array,
            stratMatrix: Array,
            gamma:{
                type: Number,
            },
            initialDecision: {
                type: Number,
            },
            numPlayers: {
                type: Number,
            },
            choice: {
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
            maxInfo: {
                type: Boolean,
                value: false,
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
            isMultiDim: {
                type: Boolean,
                value: false
            },
            gameType: {
                type: String
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
            otherOtherChoiceSeries: {
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
            otherOtherPayoffSeries: {
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
        console.log(this.stratMatrix);
        //Get number of players
        let num_players = this.numPlayers;

         // transpose payoff and probability matrices if player controls vertical line in a 2 player game
         if (this.$.constants.idInGroup % num_players == 0 && num_players == 2)  {
            var i, j, t = [];

            // Loop through every item in the outer array (height)
            for (i=0; i < this.payoffMatrix.length; i++ ) {
                t[i] = [];

                for(j = 0; j < this.payoffMatrix[0].length; j++) {
                    t[i][j] = this.payoffMatrix[j][i];
                }
            }

            this.set("payoffMatrix", t);
        }

        // transpose strat matrices if player controls vertical line in a 2 player game
        if (this.$.constants.idInGroup % num_players == 0 && num_players == 2)  {
            var i, j, t = [];

            // Loop through every item in the outer array (height)
            for (i=0; i < this.stratMatrix.length; i++ ) {
                t[i] = [];

                for(j = 0; j < this.stratMatrix[0].length; j++) {
                    t[i][j] = this.stratMatrix[j][i];
                }
            }

            this.set("stratMatrix", t);
        }

        // transpose payoff and probability matrices if player controls vertical line in a 3 player game
        if (this.$.constants.idInGroup % num_players == 0 && num_players % 3 == 0) {
            var p1, p2, p3, t = [];

            for (p2=0; p2 < this.payoffMatrix[0][0].length; p2++) {
                t[p2] = [];

                for (p3=0; p3 < this.payoffMatrix.length; p3++) {
                    t[p2][p3] = [];

                    for (p1=0; p1 < this.payoffMatrix[0].length; p1++) {

                        t[p2][p3][p1] = this.payoffMatrix[p3][p1][p2];
                    }
                }
            }

            this.set("payoffMatrix", t);
        }

        // transpose strat matrices if player 2 and there are 3 players
        if (this.$.constants.idInGroup == 2 && num_players % 3 == 0) {
            var p1, p2, p3, t = [];

            for (p3=0; p3 < this.stratMatrix.length; p3++) {
                t[p3] = [];

                for (p2=0; p2 < this.stratMatrix[0][0].length; p2++) {
                    t[p3][p2] = [];

                    for (p1=0; p1 < this.stratMatrix[0].length; p1++) {

                        t[p3][p2][p1] = this.stratMatrix[p3][p1][p2];
                    }
                }
            }
            this.set("stratMatrix", t);
        }

        // transpose strat matrices if player controls vertical line in a 2 player game
        if (this.$.constants.idInGroup % num_players == 0 && num_players == 2)  {
            var i, j, t = [];

            // Loop through every item in the outer array (height)
            for (i=0; i < this.stratMatrix.length; i++ ) {
                t[i] = [];

                for(j = 0; j < this.stratMatrix[0].length; j++) {
                    t[i][j] = this.stratMatrix[j][i];
                }
            }

            this.set("stratMatrix", t);
        }

        // transpose strat matrices if player controls vertical line in a 3 player game
        if (this.$.constants.idInGroup % num_players == 0 && num_players % 3 == 0) {
            var p1, p2, p3, t = [];

            for (p2=0; p2 < this.stratMatrix[0][0].length; p2++) {
                t[p2] = [];

                for (p3=0; p3 < this.stratMatrix.length; p3++) {
                    t[p2][p3] = [];

                    for (p1=0; p1 < this.stratMatrix[0].length; p1++) {

                        t[p2][p3][p1] = this.stratMatrix[p3][p1][p2];
                    }
                }
            }

            this.set("stratMatrix", t);
        }

        // transpose payoff and probability matrices if player 2 and there are 3 players
        if (this.$.constants.idInGroup == 2 && num_players % 3 == 0) {
            var p1, p2, p3, t = [];

            for (p3=0; p3 < this.payoffMatrix.length; p3++) {
                t[p3] = [];

                for (p2=0; p2 < this.payoffMatrix[0][0].length; p2++) {
                    t[p3][p2] = [];

                    for (p1=0; p1 < this.payoffMatrix[0].length; p1++) {

                        t[p3][p2][p1] = this.payoffMatrix[p3][p1][p2];
                    }
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
        

   
        // if using pure strategy, set bot to only choose pure strategies
        this.$.bot.lambda = 1;
        this.$.bot.pattern = true;

        // only set decision string if we're not doing continuous strategy
        this._myPlannedDecisionString = new String(this.initialDecision);
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

    _show3Chart(){ 
        //console.log(this.$.constants.role == 'p3' || this.numPlayers % 2 == 0);
        return this.$.constants.role == 'p3' || this.numPlayers % 2 == 0;
    }

    _ifMVGame() {
        return this.gameType == 'MV';
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
    
    _freq2Color( rowIndex, colIndex, stratMatrix){
        console.log("called freq2Color()" );
        if (this.stratMatrix[rowIndex][colIndex].length == 0) return 0;
        var dividend = 0;
        var divisor = 0;
        for(let i = 0; i < this.stratMatrix[rowIndex][colIndex].length; i++){
            dividend += Math.pow(this.gamma, i) * this.stratMatrix[rowIndex][colIndex][i];
            divisor +=  Math.pow(this.gamma, i);
        }
        let num = Math.round(100 * dividend/divisor); //round to nearest hundredth and change to whole number
        num = 100 - num;//Math.abs(num);
        if (num == 100) return "#ffffff";
        if (num == 0) return "#0000ff";
        num = Math.round(num * 2.5);
        //num = num* 2;
        console.log((num.toString(16).length == 1) ? "#" + "0" + num.toString(16) + "0" +  num.toString(16) + "ff" : "#" + num.toString(16) +  num.toString(16) + "ff");//convert to hex
        return (num.toString(16).length == 1) ? "#" + "0" + num.toString(16) + "0" +  num.toString(16) + "ff" : "#" + num.toString(16) +  num.toString(16) + "ff"; //a shade of blue
    }

    _freq3Color(matrixIndex, rowIndex, colIndex, stratMatrix){
        console.log("called freq3Color()" );
        if (stratMatrix.length == 3){
            if(rowIndex== 0)   rowIndex = 1; 
            else if (rowIndex == 1) rowIndex = 0; 
        } else if (stratMatrix.length == 2){
            if(rowIndex == 0)  rowIndex = 2; 
            else if (rowIndex == 2) rowIndex = 0; 
         }
        if (this.stratMatrix[matrixIndex][rowIndex][colIndex].length == 0) return 0;
        var dividend = 0;
        var divisor = 0;
        for(let i = 0; i < this.stratMatrix[matrixIndex][rowIndex][colIndex].length; i++){
            dividend += Math.pow(this.gamma, i) * this.stratMatrix[matrixIndex][rowIndex][colIndex][i];
            divisor +=  Math.pow(this.gamma, i);
        }
        let num = Math.round(100 * dividend/divisor); //round to nearest hundredth and change to whole number
        num = 100 - num;//Math.abs(num);
        if (num == 100) return "#ffffff";
        if (num == 0) return "#0000ff";
        num = Math.round(num * 2.5);
        //num = num* 2;
        console.log((num.toString(16).length == 1) ? "#" + "0" + num.toString(16) + "0" +  num.toString(16) + "ff" : "#" + num.toString(16) +  num.toString(16) + "ff");//convert to hex
        return (num.toString(16).length == 1) ? "#" + "0" + num.toString(16) + "0" +  num.toString(16) + "ff" : "#" + num.toString(16) +  num.toString(16) + "ff"; //a shade of blue
    }

    _freq2( rowIndex, colIndex, stratMatrix){
        console.log("called freq2()" );
        //console.log(this.stratMatrix);
        if (this.stratMatrix[rowIndex][colIndex].length == 0) return 0;
        var dividend = 0;
        var divisor = 0;
        for(let i = 0; i < this.stratMatrix[rowIndex][colIndex].length; i++){
            dividend += Math.pow(this.gamma, i) * this.stratMatrix[rowIndex][colIndex][i];
            divisor +=  Math.pow(this.gamma, i);
        }
        
        return Math.round(1000 * dividend/divisor)/1000;//round to nearest thousandth
    }

    _freq3(matrixIndex, rowIndex, colIndex, stratMatrix){
        console.log("called freq3()" );
        //console.log(this.stratMatrix);
        if (stratMatrix.length == 3){
            if(rowIndex== 0)   rowIndex = 1; 
            else if (rowIndex == 1) rowIndex = 0; 
        } else if (stratMatrix.length == 2){
            if(rowIndex == 0)  rowIndex = 2; 
            else if (rowIndex == 2) rowIndex = 0; 
         }
        if (this.stratMatrix[matrixIndex][rowIndex][colIndex].length == 0) return 0;
        var dividend = 0;
        var divisor = 0;
        for(let i = 0; i < this.stratMatrix[matrixIndex][rowIndex][colIndex].length; i++){
            dividend += Math.pow(this.gamma, i) * this.stratMatrix[matrixIndex][rowIndex][colIndex][i];
            divisor +=  Math.pow(this.gamma, i);
        }
        
        return Math.round(1000 * dividend/divisor)/1000;//round to nearest thousandth
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
            if (otherDecision == j)
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
        console.log("Group Decisions Changed");
        console.log(this.groupDecisions);
        if(typeof this.groupDecisions === 'undefined') return;
        if(Object.keys(this.groupDecisions).length == 0) return;
        for(let decision of Object.values(this.groupDecisions)){
            if(decision === null) return;
         }
        if(this.numPlayers % 2 == 0) {
            var i, j, t = [];

            // Loop through every item in the outer array (height)
            for (i=0; i < this.stratMatrix.length; i++ ) {
                t[i] = [];

                for(j = 0; j < this.stratMatrix[0].length; j++) {
                    t[i][j] = this.stratMatrix[i][j];
                }
            }
            
            var p1Decision, p2Decision;
            var p1ID, p2ID;
            for (const player of this.$.constants.group.players) {
                if(player.role == "p1") { 
                    p1Decision = this.groupDecisions[player.participantCode];
                    p1ID = player.participantCode;
                }
                else if(player.role == "p2") { 
                    p2Decision = this.groupDecisions[player.participantCode];
                    p2ID = player.participantCode;
                }
            }
            if(this.$.constants.participantCode == p1ID) {
                for (let i = 0; i < this.stratMatrix.length; i++){
                    for (let j = 0; j < this.stratMatrix[0].length; j++){
                      if(i == p1Decision && j == p2Decision){
                        t[i][j].push(1);
                      } else{
                        t[i][j].push(0);
                      }
                    }
                }
            }
            else if(this.$.constants.participantCode == p2ID) {
                for (let i = 0; i < this.stratMatrix.length; i++){
                    for (let j = 0; j < this.stratMatrix[0].length; j++){
                      if(j == p1Decision && i == p2Decision){
                        t[i][j].push(1);
                      } else{
                        t[i][j].push(0);
                      }
                    }
                }
            }
        }
        else if(this.numPlayers % 3 == 0) {
            var p1Decision, p2Decision, p3Decision;
            var p1ID, p2ID, p3ID;

            var t = [];
            for (let i = 0; i < this.stratMatrix.length; i++){
                t[i] = [];
                for (let j = 0; j < this.stratMatrix[0].length; j++){
                    t[i][j] = [];
                    for (let z = 0; z < this.stratMatrix[0][0].length; z++){
                        t[i][j][z] = this.stratMatrix[i][j][z];
                    }
                }
            }
            
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
                for (let i = 0; i < this.stratMatrix.length; i++){
                    for (let j = 0; j < this.stratMatrix[0].length; j++){
                        for (let z = 0; z < this.stratMatrix[0][0].length; z++){
                            if(i == p3Decision && j == p1Decision && z == p2Decision){
                                t[i][j][z].push(1)
                            } else{
                                t[i][j][z].push(0)
                            }
                        }
                    }
                }
            }
            else if(this.$.constants.participantCode == p2ID) {
                for (let i = 0; i < this.stratMatrix.length; i++){
                    for (let j = 0; j < this.stratMatrix[0].length; j++){
                        for (let z = 0; z < this.stratMatrix[0][0].length; z++){
                            if(i == p3Decision && j == p2Decision && z == p1Decision){
                                t[i][j][z].push(1)
                            } else{
                                t[i][j][z].push(0)
                            }        
                        }
                    }
                }

            }
            else if(this.$.constants.participantCode == p3ID) {
                for (let i = 0; i < this.stratMatrix.length; i++){
                    for (let j = 0; j < this.stratMatrix[0].length; j++){
                        for (let z = 0; z < this.stratMatrix[0][0].length; z++){
                            if(i == p2Decision && j == p3Decision && z == p1Decision){
                                t[i][j][z].push(1)
                            } else{
                                t[i][j][z].push(0)
                            } 
                        }
                    }
                }

            }
        }
        console.log(t);
        this.set('stratMatrix', t);

        this.notifyPath('stratMatrix');
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
        //console.log("Other player decisions: " + otherDecisionArray);
        return otherDecisionArray;
    }
    // return true if thermometer is to be shown
    _showThermometer(meanMatching) {
        return meanMatching;
    }
}

window.customElements.define('leeps-bimatrix', LeepsBimatrix);
