import {html,PolymerElement} from '/static/otree-redwood/node_modules/@polymer/polymer/polymer-element.js';
import '/static/otree-redwood/src/redwood-channel/redwood-channel.js';
import '/static/otree-redwood/src/otree-constants/otree-constants.js';
import '../polymer-elements/iron-flex-layout-classes.js';

//Initialize dict for each player
var historyDict = {'p1': [], 'p2': [], 'p3': []};
var myHistory = [];

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
                    margin-top: 60px;
                }

                #progress-container1 {
                    height: 33%;
                    margin-top: 30px;
                }

                #progress-container {
                    height: 33%;
                }

                #myProgress {
                    width: 200px;
                    background-color: #b1dcff;
                    outline: 1px solid black;
                    margin-right: 25px;
                }

                #myBar0 {
                    width: 0%;
                    height: 30px;
                    background-color: #ffc249;
                    text-align: center;
                    line-height: 30px;
                    color: white;
                }

                #myBar1 {
                    width: 0%;
                    height: 30px;
                    background-color: #ffc249;
                    text-align: center;
                    line-height: 30px;
                    color: white;
                }

                #myBar2 {
                    width: 0%;
                    height: 30px;
                    background-color: #ffc249;
                    text-align: center;
                    line-height: 30px;
                    color: white;
                }

            </style>
            
            <otree-constants id="constants"></otree-constants>
            <redwood-channel
                channel="group_decisions"
                on-event="_handleGroupDecisionsEvent">
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

            if(this.$.constants.role == 'p3' || this.gameType == 'MV') {
                elem2 = this.shadowRoot.getElementById("myBar2");
            }


            //Calculate regret

            const groupDecisions = event.detail.payload;
            var p1Decision, p2Decision, p3Decision;
            var p1ID, p2ID, p3ID;

            //Get each player's decision
            for (const player of this.$.constants.group.players) {
                if(player.role == "p1") { 
                    p1Decision = groupDecisions[player.participantCode];
                    p1ID = player.participantCode;
                }
                else if(player.role == "p2") { 
                    p2Decision = groupDecisions[player.participantCode];
                    p2ID = player.participantCode;
                }
                else if(player.role == "p3") { 
                    p3Decision = groupDecisions[player.participantCode];
                    p3ID = player.participantCode;
                }
            }

            //Push history to dictionary
            historyDict['p1'].push(p1Decision);
            historyDict['p2'].push(p2Decision);
            historyDict['p3'].push(p3Decision);

            var regret0 = 0, regret1 = 0, regret2 = 0;
            var regret0List = [], regret1List = [], regret2List = [];
            var lastDecision = myHistory[(myHistory.length - 1)]; 
        
            
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

            //Get payoffs
            for(var i = 0; i < myHistory.length; i++) {
                
                if(this.numPlayers % 2 == 0) {
                    if(this.$.constants.role == 'p1') {
                        //If player 1
                        //my_flow_payoff += this.myPayoffs[historyDict['p1'][i]][historyDict['p2'][i]];
                        regret0 += this.myPayoffs[regret0List[i]][historyDict['p2'][i]];
                        regret1 += this.myPayoffs[regret1List[i]][historyDict['p2'][i]];

                        //If 3 rows
                        if(this._if3()) {
                            regret2 += this.myPayoffs[regret2List[i]][historyDict['p2'][i]];
                        }

                    } 
                    else if(this.$.constants.role == 'p2') { 
                        //If player 2
                        //my_flow_payoff += this.myPayoffs[historyDict['p2'][i]][historyDict['p1'][i]];
                        regret0 += this.myPayoffs[regret0List[i]][historyDict['p1'][i]];
                        regret1 += this.myPayoffs[regret1List[i]][historyDict['p1'][i]];

                        //If 3 rows
                        if(this._if3()) {
                            regret2 += this.myPayoffs[regret2List[i]][historyDict['p1'][i]];
                        }
                    }
                }
                else if(this.numPlayers % 3 == 0) {
                    //my_flow_payoff += this.payoffMatrix[historyDict['p3'][i]][historyDict['p1'][i]][historyDict['p2'][i]][0];
                    if(this.$.constants.role == 'p1') {
                        //If player 1
                        regret0 += this.payoffMatrix[historyDict['p3'][i]][regret0List[i]][historyDict['p2'][i]][0];
                        regret1 += this.payoffMatrix[historyDict['p3'][i]][regret1List[i]][historyDict['p2'][i]][0];        
                    }
                    else if(this.$.constants.role == 'p2') {
                        //If player 2
                        regret0 += this.originalPayoffMatrix[historyDict['p3'][i]][historyDict['p1'][i]][regret0List[i]][1];
                        regret1 += this.originalPayoffMatrix[historyDict['p3'][i]][historyDict['p1'][i]][regret1List[i]][1];        
                    }
                    else if(this.$.constants.role == 'p3') {
                        //If player 3
                        regret0 = this.originalPayoffMatrix[regret0List[i]][historyDict['p1'][i]][historyDict['p2'][i]][2];
                        regret1 = this.originalPayoffMatrix[regret1List[i]][historyDict['p1'][i]][historyDict['p2'][i]][2];
                        regret2 = this.originalPayoffMatrix[regret2List[i]][historyDict['p1'][i]][historyDict['p2'][i]][2];
                    }
                }
            }
            

            //take the average conditional on group size, 2/3 populations share equal sizes.
            let pop_size = myHistory.length;

            regret0 /= pop_size;
            regret1 /= pop_size;
            regret2 /= pop_size;
            

            //Divide regret by maxMinDiff to calculate % regret
            regret0 /= maxMinDiff;
            regret1 /= maxMinDiff;
            regret2 /= maxMinDiff;

            //To deal with possible negative regret
            regret0 = Math.max(0, regret0);
            regret1 = Math.max(0, regret1);
            regret2 = Math.max(0, regret2);

            //Update regret bars
            elem0.style.width = Math.round(regret0 * 100) + '%';
            elem0.innerHTML = Math.round(regret0 * 100) + '%';

            elem1.style.width = Math.round(regret1 * 100) + '%';
            elem1.innerHTML = Math.round(regret1 * 100) + '%';

            if(this._if3()) {
                elem2.style.width = Math.round(regret2 * 100) + '%';
                elem2.innerHTML = Math.round(regret2 * 100) + '%';
            }            
        }  
    }
    
    //Calculate how many regret bars needed to show
    _if3() {
        //return this.gameType == 'MV' || this.$.constants.role == 'p3';
        return this.payoffMatrix[0].length > 2 || this.$.constants.role == 'p3';
    }

    _padding(){
        if (this.gameType == 'MV') return '12px';
        return '';
    }

}

window.customElements.define('regret-bar', RegretBar);

