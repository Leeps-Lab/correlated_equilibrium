import {html,PolymerElement} from '/static/otree-redwood/node_modules/@polymer/polymer/polymer-element.js';
import '/static/otree-redwood/src/redwood-channel/redwood-channel.js';
import '/static/otree-redwood/src/otree-constants/otree-constants.js';
import '../polymer-elements/iron-flex-layout-classes.js';

//Initialize dict for each player
var historyDict = {'p1': [], 'p2': [], 'p3': []};
var myHistory = [];
//Store Payoffs for each decision
var one = [];
var zero = []; 
var two = [];
var tick = 1;


export class RegretBar extends PolymerElement {

    static get template() {
        return html `
            <style>

                :host {
                    display: block;
                }

                #progress-container3 {
                    height: 50%;
                }

                #progress-container2 {
                    height: 50%;
                    margin-top: 3.75em;
                }

                #progress-container1 {
                    height: 33%;
                    margin-top: 1.875em;
                }

                #progress-container {
                    height: 33%;
                }

                #myProgress {
                    width: 12.5em;
                    background-color: #b1dcff;
                    outline: 0.0625em solid black;
                    margin-right: 1.5625em;
                }

                #myBar0 {
                    width: 0%;
                    height: 1.875em;
                    background-color: #ffc249;
                    text-align: center;
                    line-height: 1.875em;
                    color: white;
                }

                #myBar1 {
                    width: 0%;
                    height: 1.875em;
                    background-color: #ffc249;
                    text-align: center;
                    line-height: 1.875em;
                    color: white;
                }

                #myBar2 {
                    width: 0%;
                    height: 1.875em;
                    background-color: #ffc249;
                    text-align: center;
                    line-height: 1.875em;
                    color: white;
                }

            </style>
            
            <otree-constants id="constants"></otree-constants>
            <redwood-channel
                channel="group_decisions"
                on-event="_handleGroupDecisionsEvent">
            </redwood-channel>
            <redwood-channel
                channel="regret"
                id="channel">
            </redwood-channel>

            <template is="dom-if" if="[[ _if3()]]">
            <div id=progress-container1 style="padding-bottom: {{_padding()}};">
                    <div id="myProgress">
                        <div id="myBar2" ></div>
                    </div>
                </div>

                <div id=progress-container style="padding-bottom: {{_padding()}};">
                    <div id="myProgress">
                        <div id="myBar1"></div>
                    </div>
                </div>

                <div id=progress-container>
                    <div id="myProgress">
                        <div id="myBar0"></div>
                    </div>
                </div>
            </template>

            <template is="dom-if" if="[[  !_if3()]]">
                <div id=progress-container2>
                    <div id="myProgress">
                        <div id="myBar1"></div>
                    </div>
                </div>

                <div id=progress-container3>
                    <div id="myProgress">
                        <div id="myBar0"></div>
                    </div>
                </div>
            </template>   
        `
    }

    static get properties() {
        return {
            payoffMatrix: {
                type: Array
            },
            groupDecisions: {
                type: Object,
            },
            myDecision: {
                type: Number,
            },
            otherDecision: {
                type: Number,
            },
            regretType:{
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
    }

    _handleGroupDecisionsEvent(event) {
        
        //Add most recent decision to history
        myHistory.push(this.myDecision);
        //Grab the max and min payoffs
        if(history.length > 0) {
            let minPayoff = Infinity;
            let maxPayoff = -Infinity;

            for (var i=0; i< this.myPayoffs.length; i++) {
                for(var j = 0; j < this.myPayoffs[0].length; j++) {
                    if(this.numPlayers % 2 == 0){
                        minPayoff = Math.min(minPayoff, this.myPayoffs[i][j]);
                        maxPayoff = Math.max(maxPayoff, this.myPayoffs[i][j]);
                    }else{
                        for(var z=0; z < this.myPayoffs[0][0].length; z++){
                            minPayoff = Math.min(minPayoff, this.myPayoffs[i][j][z]);
                            maxPayoff = Math.max(maxPayoff, this.myPayoffs[i][j][z]);
                        }

                    }
                    
                }
            }

            //Take the difference between the max and min
            let maxMinDiff = maxPayoff - minPayoff;


            //Grab the IDs of the regret bars
            var elem0 = this.shadowRoot.getElementById("myBar0");
            var elem1 = this.shadowRoot.getElementById("myBar1");
            var elem2;

            if(this.$.constants.role == 'p3' || this.gameType == 'MV1' || this.gameType == 'MV2') {
                elem2 = this.shadowRoot.getElementById("myBar2");
            }


            //Calculate regret

            const groupDecisions = event.detail.payload;

            var p1_decisions = [];
            var p2_decisions = [];
            var p3_decisions = [];

            // populate decision arrays
            for (const player of this.$.constants.group.players) {
                let decision = groupDecisions[player.participantCode];
                if(player.role == 'p1') p1_decisions.push(decision);
                if(player.role == 'p2') p2_decisions.push(decision);
                if(player.role == 'p3') p3_decisions.push(decision);
                                                  
            }


            //Push history to dictionary

            historyDict['p1'].push(p1_decisions);
            historyDict['p2'].push(p2_decisions);
            historyDict['p3'].push(p3_decisions);

            var regret0 = 0, regret1 = 0, regret2 = 0;
            var regret0List = [], regret1List = [], regret2List = [];
            var lastDecision = myHistory[(myHistory.length - 1)]; 
            //Mean counterfactual payoff up to time t if all instances of j were swapped out for k.
            if (this.regretType == 1){
                //Copy elements
                for(var i = 0; i < myHistory.length; i++) {
                    regret0List.push(myHistory[i]);
                    regret1List.push(myHistory[i]);
                    regret2List.push(myHistory[i]);
                }

                //Replace elements in list
                for(var i = 0; i < myHistory.length; i++) {
                    if(myHistory[i] == lastDecision) {
                        regret0List[i] = 0;
                        regret1List[i] = 1;
                        regret2List[i] = 2;
                    }
                }

                //Get payoffs-- adding over all decisions for mean matching
                for(var i = 0; i < myHistory.length; i++) {
                    
                    if(this.numPlayers % 2 == 0) {
                        if(this.$.constants.role == 'p1') {
                            //If player 1
                            for(const p2 of historyDict['p2'][i]){
                                regret0 += this.myPayoffs[regret0List[i]][p2];
                                regret1 += this.myPayoffs[regret1List[i]][p2];

                                //If 3 rows
                                if(this._if3()) {
                                    regret2 += this.myPayoffs[regret2List[i]][p2];
                                }
                            }

                        } 
                        else if(this.$.constants.role == 'p2') { 
                            //If player 2
                            for(const p1 of historyDict['p1'][i]){
                                regret0 += this.myPayoffs[regret0List[i]][p1];
                                regret1 += this.myPayoffs[regret1List[i]][p1];

                                //If 3 rows
                                if(this._if3()) {
                                    regret2 += this.myPayoffs[regret2List[i]][p1];
                                }
                            }
                        }
                    }
                    else if(this.numPlayers % 3 == 0) {
                        if(this.$.constants.role == 'p1') {
                            //If player 1
                            for(const p2 of historyDict['p2'][i]){
                                for(const p3 of historyDict['p3'][i]){
                                    regret0 += this.payoffMatrix[p3][regret0List[i]][p2][0];
                                    regret1 += this.payoffMatrix[p3][regret1List[i]][p2][0];
                                }
                            }
                                    
                        }
                        else if(this.$.constants.role == 'p2') {
                            //If player 2
                            for(const p1 of historyDict['p1'][i]){
                                for(const p3 of historyDict['p3'][i]){
                                    regret0 += this.originalPayoffMatrix[p3][p1][regret0List[i]][1];
                                    regret1 += this.originalPayoffMatrix[p3][p1][regret1List[i]][1];
                                }
                            }
                                    
                        }
                        else if(this.$.constants.role == 'p3') {
                            //If player 3
                            for(const p1 of historyDict['p1'][i]){
                                for(const p2 of historyDict['p2'][i]){
                                    regret0 += this.originalPayoffMatrix[regret0List[i]][p1][p2][2];
                                    regret1 += this.originalPayoffMatrix[regret1List[i]][p1][p2][2];
                                    regret2 += this.originalPayoffMatrix[regret2List[i]][p1][p2][2];
                                }
                            }
                            
                        }
                    }
                }
                // Take average payoff for mean-matching
                let pop_size = p1_decisions.length;
                if(this.numPlayers % 2 == 0){
                    regret0 /= pop_size;
                    regret1 /= pop_size;
                    regret2 /= pop_size;
                }else if(this.numPlayers % 3 == 0){
                    regret0 /= (pop_size * pop_size);
                    regret1 /= (pop_size * pop_size);
                    regret2 /= (pop_size * pop_size);
                }


                //take the average conditional on group size, 2/3 populations share equal sizes.
                let histLength = myHistory.length;

                regret0 /= histLength;
                regret1 /= histLength;
                regret2 /= histLength;
            

            
            } else if(this.regretType == 2){
                //Mean actual payoff up to time t.
                //Get payoff for this round-- adding over all decisions for mean matching
                var payoff = 0;
                if(this.numPlayers % 2 == 0) {
                    if(this.$.constants.role == 'p1') {
                        //If player 1
                        for(const p2 of p2_decisions){
                            payoff += this.myPayoffs[this.myDecision][p2];
                        }

                    } 
                    else if(this.$.constants.role == 'p2') { 
                        //If player 2
                        for(const p1 of p1_decisions){
                            payoff += this.myPayoffs[this.myDecision][p1];
                        }
                    }
                }
                else if(this.numPlayers % 3 == 0) {
                    if(this.$.constants.role == 'p1') {
                        //If player 1
                        for(const p2 of p2_decisions){
                            for(const p3 of p3_decisions){
                                payoff += this.payoffMatrix[p3][this.myDecision][p2][0];
                            }
                        }
                                
                    }
                    else if(this.$.constants.role == 'p2') {
                        //If player 2
                        for(const p1 of p1_decisions){
                            for(const p3 of p3_decisions){
                                payoff += this.originalPayoffMatrix[p3][p1][this.myDecision][1];
                            }
                        }
                                
                    }
                    else if(this.$.constants.role == 'p3') {
                        //If player 3
                        for(const p1 of p1_decisions){
                            for(const p2 of p2_decisions){
                                payoff += this.originalPayoffMatrix[this.myDecision][p1][p2][2];
                            }
                        }
                        
                    }
                }
                
                // Take average payoff for mean-matching
                let pop_size = p1_decisions.length;
                if(this.numPlayers % 2 == 0){
                    payoff /= pop_size;
                }else if(this.numPlayers % 3 == 0){
                    payoff /= (pop_size * pop_size);
                }

                //Push the payoff on the respective history list
                if(this.myDecision == 0) zero.push(payoff);
                else if(this.myDecision == 1) one.push(payoff);
                else two.push(payoff);

                //For each decision, sum up payoffs (get average payoffs for all round)
                for (const p of zero) regret0 += p;
                for (const p of one) regret1 += p;
                for (const p of two) regret2 += p;
                // If the list is not empty, divide the calculation by length
                regret0 = (zero.length > 0) ? regret0 / zero.length : 0;
                regret1 = (one.length > 0) ? regret1 / one.length : 0;
                regret2 = (two.length > 0) ? regret2 / two.length : 0;
            }
            
            //Mean counterfactual payoff up to time t if all instances of j were swapped out for k.
            //For regret type 3, instead of the total average, only consider the time periods when j was played.
            else if (this.regretType == 3){
                //Copy regret from the history
                for(var i = 0; i < myHistory.length; i++) {
                    regret0List.push(myHistory[i]);
                    regret1List.push(myHistory[i]);
                    regret2List.push(myHistory[i]);
                }

                //Replace elements in regret list
                for(var i = 0; i < myHistory.length; i++) {
                    if(myHistory[i] == lastDecision) {
                        regret0List[i] = 0;
                        regret1List[i] = 1;
                        regret2List[i] = 2;
                    }
                }
                let histLength = 0;
                //Get payoffs-- adding over all decisions for mean matching
                //only record payoff when the history decision = my current decision
                for(var i = 0; i < myHistory.length; i++) {
                    if (myHistory[i] == lastDecision){
                        histLength += 1;
                        if(this.numPlayers % 2 == 0) {
                            if(this.$.constants.role == 'p1') {
                                //If player 1
                                for(const p2 of historyDict['p2'][i]){
                                    regret0 += this.myPayoffs[regret0List[i]][p2];
                                    regret1 += this.myPayoffs[regret1List[i]][p2];
    
                                    //If 3 rows
                                    if(this._if3()) {
                                        regret2 += this.myPayoffs[regret2List[i]][p2];
                                    }
                                }
    
                            } 
                            else if(this.$.constants.role == 'p2') { 
                                //If player 2
                                for(const p1 of historyDict['p1'][i]){
                                    regret0 += this.myPayoffs[regret0List[i]][p1];
                                    regret1 += this.myPayoffs[regret1List[i]][p1];
    
                                    //If 3 rows
                                    if(this._if3()) {
                                        regret2 += this.myPayoffs[regret2List[i]][p1];
                                    }
                                }
                            }
                        }
                        else if(this.numPlayers % 3 == 0) {
                            if(this.$.constants.role == 'p1') {
                                //If player 1
                                for(const p2 of historyDict['p2'][i]){
                                    for(const p3 of historyDict['p3'][i]){
                                        regret0 += this.payoffMatrix[p3][regret0List[i]][p2][0];
                                        regret1 += this.payoffMatrix[p3][regret1List[i]][p2][0];
                                    }
                                }
                                        
                            }
                            else if(this.$.constants.role == 'p2') {
                                //If player 2
                                for(const p1 of historyDict['p1'][i]){
                                    for(const p3 of historyDict['p3'][i]){
                                        regret0 += this.originalPayoffMatrix[p3][p1][regret0List[i]][1];
                                        regret1 += this.originalPayoffMatrix[p3][p1][regret1List[i]][1];
                                    }
                                }
                                        
                            }
                            else if(this.$.constants.role == 'p3') {
                                //If player 3
                                for(const p1 of historyDict['p1'][i]){
                                    for(const p2 of historyDict['p2'][i]){
                                        regret0 += this.originalPayoffMatrix[regret0List[i]][p1][p2][2];
                                        regret1 += this.originalPayoffMatrix[regret1List[i]][p1][p2][2];
                                        regret2 += this.originalPayoffMatrix[regret2List[i]][p1][p2][2];
                                    }
                                }
                                
                            }
                        }
                    }
                }
                // Take average payoff for mean-matching
                let pop_size = p1_decisions.length;
                if(this.numPlayers % 2 == 0){
                    regret0 /= pop_size;
                    regret1 /= pop_size;
                    regret2 /= pop_size;
                }else if(this.numPlayers % 3 == 0){
                    regret0 /= (pop_size * pop_size);
                    regret1 /= (pop_size * pop_size);
                    regret2 /= (pop_size * pop_size);
                }

                //take the average conditional on group size, 2/3 populations share equal sizes.
                //not the total average, only the average when the current decison was played in history.
                //let CalculateLength = [choice for c in myHistory if c == lastDecision]
                //let histLength = 1;
                //for(let c in myHistory){
                //    if(c == lastDecision) histLength += 1;
                // }
                
                regret0 /= histLength;
                regret1 /= histLength;
                regret2 /= histLength;
                
                // -------------------------------------------------------------------------
                // Calculating ave payoff for j (regret 2 type)
                var payoff = 0;
                if(this.numPlayers % 2 == 0) {
                    if(this.$.constants.role == 'p1') {
                        //If player 1
                        for(const p2 of p2_decisions){
                            payoff += this.myPayoffs[this.myDecision][p2];
                        }

                    } 
                    else if(this.$.constants.role == 'p2') { 
                        //If player 2
                        for(const p1 of p1_decisions){
                            payoff += this.myPayoffs[this.myDecision][p1];
                        }
                    }
                }
                else if(this.numPlayers % 3 == 0) {
                    if(this.$.constants.role == 'p1') {
                        //If player 1
                        for(const p2 of p2_decisions){
                            for(const p3 of p3_decisions){
                                payoff += this.payoffMatrix[p3][this.myDecision][p2][0];
                            }
                        }
                                
                    }
                    else if(this.$.constants.role == 'p2') {
                        //If player 2
                        for(const p1 of p1_decisions){
                            for(const p3 of p3_decisions){
                                payoff += this.originalPayoffMatrix[p3][p1][this.myDecision][1];
                            }
                        }
                                
                    }
                    else if(this.$.constants.role == 'p3') {
                        //If player 3
                        for(const p1 of p1_decisions){
                            for(const p2 of p2_decisions){
                                payoff += this.originalPayoffMatrix[this.myDecision][p1][p2][2];
                            }
                        }
                        
                    }
                }
                
                // Take average payoff for mean-matching
                if(this.numPlayers % 2 == 0){
                    payoff /= pop_size;
                }else if(this.numPlayers % 3 == 0){
                    payoff /= (pop_size * pop_size);
                }

                //Push the payoff on the respective history list
                //For each decision, sum up payoffs (get average payoffs for all round)
                //If the list is not empty, divide the calculation by length
                if(this.myDecision == 0) {
                    zero.push(payoff);
                    regret0 = 0;
                    for (const p of zero) regret0 += p;
                    regret0 = (zero.length > 0) ? regret0 / zero.length : 0;
                }
                else if(this.myDecision == 1) {
                    one.push(payoff);
                    regret1 = 0;
                    for (const p of one) regret1 += p;
                    regret1 = (one.length > 0) ? regret1 / one.length : 0;
                }
                else {
                    two.push(payoff);
                    regret2 = 0;
                    for (const p of two) regret2 += p;
                    regret2 = (two.length > 0) ? regret2 / two.length : 0;
                }
            
            }

            //Divide regret by maxMinDiff to calculate % regret
            var regret0Percent = regret0 / maxPayoff;
            var regret1Percent = regret1 / maxPayoff;
            var regret2Percent = regret2 / maxPayoff;

            //To deal with possible negative regret
            regret0 = Math.max(0, regret0);
            regret1 = Math.max(0, regret1);
            regret2 = Math.max(0, regret2);

            //To deal with possible negative regret
            regret0Percent = Math.max(0, regret0Percent);
            regret1Percent = Math.max(0, regret1Percent);
            regret2Percent = Math.max(0, regret2Percent);
            
            elem0.style.width = Math.round(regret0Percent * 100) + '%';
            elem0.innerHTML = Math.round(regret0);

            elem1.style.width = Math.round(regret1Percent * 100) + '%';
            elem1.innerHTML = Math.round(regret1);

            if(this._if3()) {
                elem2.style.width = Math.round(regret2Percent * 100) + '%';
                elem2.innerHTML = Math.round(regret2);
            }   
            let regretMessage = {
                'pcode': this.$.constants.participantCode,
                'tick': tick,
                'regret0': Math.round(regret0),
                'regret1': Math.round(regret1),
                'regret2': Math.round(regret2),
            };
            tick += 1;
            this.$.channel.send(regretMessage);
        }  
    }
    
    //Calculate how many regret bars needed to show
    _if3() {
        return this.payoffMatrix[0].length > 2 || this.$.constants.role == 'p3';
    }

    _padding(){
        if (this.gameType == 'MV1' || this.gameType == 'MV2') return '0.75em';
        return '';
    }

}

window.customElements.define('regret-bar', RegretBar);

