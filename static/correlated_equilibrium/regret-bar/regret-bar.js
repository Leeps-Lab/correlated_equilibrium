import {html,PolymerElement} from '/static/otree-redwood/node_modules/@polymer/polymer/polymer-element.js';
import '/static/otree-redwood/src/redwood-channel/redwood-channel.js';
import '/static/otree-redwood/src/otree-constants/otree-constants.js';
import '../polymer-elements/iron-flex-layout-classes.js';

var history = [];

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
                <div id=progress-container1>
                    <div id="myProgress">
                        <div id="myBar2" ></div>
                    </div>
                </div>

                <div id=progress-container>
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
        //(this.myDecision);
        //Add most recent decision to history
        history.push(this.myDecision);

        if(history.length > 0) {
            let minPayoff = Infinity;
            let maxPayoff = -Infinity;

            for (var i=0; i< this.payoffMatrix.length; i++) {
                for(var j = 0; j < this.payoffMatrix[0].length; j++) {
                    minPayoff = Math.min(minPayoff, this.payoffMatrix[i][j], this.payoffMatrix[i][j]);
                    maxPayoff = Math.max(maxPayoff, this.payoffMatrix[i][j], this.payoffMatrix[i][j]);
                }
            }

            var elem0 = this.shadowRoot.getElementById("myBar0");
            var elem1 = this.shadowRoot.getElementById("myBar1");
            var elem2;

            if(this.$.constants.role == 'p3' || this.gameType == 'MV') {
                elem2 = this.shadowRoot.getElementById("myBar2");
            }

            var regret0 = 0, regret1 = 0, regret2 = 0;
            var regret0List = [], regret1List = [], regret2List = [];

            var lastDecision = history[(history.length - 1)]; 
            
            //Copy elements
            for(var i = 0; i < history.length; i++) {
                regret0List.push(history[i]);
                regret1List.push(history[i]);
                regret2List.push(history[i]);
            }

            //Replace elements in list
            for(var i = 0; i < history.length; i++) {
                if(history[i] == lastDecision) {
                    regret0List[i] = 0;
                    regret1List[i] = 1;
                    regret2List[i] = 2;
                }
            }

            //Calculate regret
            for(var i = 0; i < history.length; i++) {
                if(history[i] == 0) {
                    regret0 += 1; 
                }
                else if(history[i] == 1) {
                    regret1 += 1;
                }
                else {
                    regret2 += 1;
                }
            }

            regret0 /= history.length;
            regret1 /= history.length;
            regret2 /= history.length;

            elem0.style.width = (regret0 * 100) + '%';
            elem1.style.width = (regret1 * 100) + '%';

            if(this.$.constants.role == 'p3' || this.gameType == 'MV') {
                elem2.style.width = (regret2 * 100) + '%';
            }            
        }  
    }

    

    _if3() {
        return this.gameType == 'MV' || this.$.constants.role == 'p3';
    }
}

window.customElements.define('regret-bar', RegretBar);

