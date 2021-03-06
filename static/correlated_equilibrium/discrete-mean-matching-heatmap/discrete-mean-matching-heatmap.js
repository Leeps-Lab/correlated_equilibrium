import {html,PolymerElement} from '/static/otree-redwood/node_modules/@polymer/polymer/polymer-element.js';
import {get_gradient_color} from '../color.js';

export class DiscreteMeanMatchingHeatmap extends PolymerElement {

    static get template() {
        return html `
            <style>
                :host {
                    font-size: 9pt;
                    font-weight: bold;
                }

                #container {
                    border: 1px solid black;
                    position: relative;
                }

                #top_heatmap, #bottom_heatmap{
                    position: absolute;
                    height: 10%;
                    width: 100%;
                }

                #top_heatmap {
                    top: 20%;
                }

                #bottom_heatmap {
                    bottom: 20%;
                }

                #payoffs_top, #payoffs_bottom {
                    position: absolute;
                    height: 28px;
                    width: 100%;
                    padding: 5px;
                }

                #payoffs_top {
                    top: 12%;
                }

                #payoffs_bottom {
                    bottom: 12%;
                }

                #other-val {
                    position: absolute;
                    height: 100%;
                    right: 0;
                    border-left: 2px solid black;
                }

                .selected {
                    border-top: 4px solid #39f;
                    border-bottom: 4px solid #39f;
                }
            </style>
            <div id='container' style$="width: [[size]]px; height: [[size]]px">
                <div id="payoffs_top">
                    <span>[[ _arrayItem(payoffs.*, 0) ]]</span>
                    <span style="float: right;">[[ _arrayItem(payoffs.*, 1) ]]</span>
                </div>
                <canvas
                    class$="[[ _selectedClass(myDecision, 1) ]]"
                    id="top_heatmap">
                </canvas>
                <canvas
                    class$="[[ _selectedClass(myDecision, 0) ]]"
                    id="bottom_heatmap">
                </canvas>
                <div id="payoffs_bottom">
                    <span>[[ _arrayItem(payoffs.*, 2) ]]</span>
                    <span style="float: right">[[ _arrayItem(payoffs.*, 3) ]]</span>
                </div>

                <div id="other-val" style$="width: [[ _calcPercent(otherDecision) ]]"></div>
            </div>
        `
    }

    static get properties() {
        return {
            myDecision: {
                type: Number,
            },
            otherDecision: {
                type: Number,
            },
            size: {
                type: Number,
            },
            payoffs: {
                type: Array,
                observer: '_makeAllHeatmaps',
            },
            color: {
                type: String,
                observer: '_makeAllHeatmaps',
            },
        }
    }

    _makeAllHeatmaps() {
        const payoffs = this.get('payoffs');
        if (!payoffs || !this.color) {
            return;
        }

        const maxPayoff = Math.max(...payoffs);

        this._makeHeatmap(this.$.top_heatmap, payoffs[0], payoffs[1], maxPayoff);
        this._makeHeatmap(this.$.bottom_heatmap, payoffs[2], payoffs[3], maxPayoff);
    }
    _makeHeatmap(elem, leftPayoff, rightPayoff, maxPayoff) {
        const w = elem.width;
        const h = elem.height;

        const ctx = elem.getContext('2d');
        const imageData = ctx.createImageData(w, h);
        const data = imageData.data;

        for (let col = 0; col < w; col++) {
            const percent_right = col / w;
            const percent_left = 1 - percent_right;

            const point_payoff = percent_left * leftPayoff + percent_right * rightPayoff;
            const point_color = get_gradient_color(point_payoff / maxPayoff, this.color);

            for (let row = 0; row < h; row++) {
                const index = (row * w * 4) + (col * 4);
                data[index] = point_color[0];
                data[index + 1] = point_color[1];
                data[index + 2] = point_color[2];
                data[index + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }
    _calcPercent(decision) {
        return decision * 100 + "%"
    }
    _selectedClass(myDecision, i) {
        return myDecision === i ? 'selected' : '';
    }
    _arrayItem(change, index) {
        return change.base[index]
    }

    // all other methods go here

}

window.customElements.define('discrete-mean-matching-heatmap', DiscreteMeanMatchingHeatmap);
