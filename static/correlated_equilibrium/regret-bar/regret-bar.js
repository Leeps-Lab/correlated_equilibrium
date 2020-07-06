import {html,PolymerElement} from '/static/otree-redwood/node_modules/@polymer/polymer/polymer-element.js';
import '/static/otree-redwood/src/redwood-channel/redwood-channel.js';
import '/static/otree-redwood/src/otree-constants/otree-constants.js';

var history = [];

export class RegretBar extends PolymerElement {

    static get template() {
        return html `
            <style>

                :host {
                    display: block;
                }

                #myProgress {
                    width: 200px;
                    background-color: #b1dcff;
                    outline: 1px solid black;
                    margin-right: 100px;
                
                }

                #myBar0 {
                    width: 0%;
                    height: 30px;
                    background-color: #ffc249;
                    text-align: center;
                    line-height: 30px;
                    color: white;
                    margin-bottom: 150px;
                }

                #myBar1 {
                    width: 0%;
                    height: 30px;
                    background-color: #ffc249;
                    text-align: center;
                    line-height: 30px;
                    color: white;
                    margin-bottom: 25px;
                }

                #myBar2 {
                    width: 0%;
                    height: 30px;
                    background-color: #ffc249;
                    text-align: center;
                    line-height: 30px;
                    color: white;
                    margin-bottom: 25px;
                }

            </style>
            
            <otree-constants id="constants"></otree-constants>
            <redwood-channel
                channel="group_decisions"
                on-event="_handleGroupDecisionsEvent">
            </redwood-channel>

            <div id="myProgress">
                <div id="myBar0"></div>
            </div>

            <div id="myProgress">
                <div id="myBar1"></div>
            </div>

            <template is="dom-if" if="[[ _p3Role() ]]">
                <div id="myProgress">
                    <div id="myBar2" ></div>
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

            var elem0 = document.getElementById("myBar0");
            var elem1 = document.getElementById("myBar1");
            var elem2;

            var width0, width1, width2;
            var regret0, regret1, regret2;
            var regret0List = history, regret1List = history, regret2List = history;

            var lastDecision = history[(history.length - 1)]; 
            
            //Calculate regret
            for(var i = 0; i < history.length; i++) {
                if(history[i] == lastDecision) {
                }
            }



            if(_p3Role()) {
                elem3 = document.getElementById("myBar2");
            }

            width0 = 1;
            width1 = 1;
            width2 = 1;
            
            elem0.style.width = width1 + '%';
            
            elem1.style.width = width2 + '%';

            elem2.style.width = width3 + '%';
        }  
    }

    _p3Role() {
        return this.$.constants.role == 'p3';
    }
}

window.customElements.define('regret-bar', RegretBar);

