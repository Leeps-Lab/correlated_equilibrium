import {html,PolymerElement} from '/static/otree-redwood/node_modules/@polymer/polymer/polymer-element.js';
import {get_gradient_color} from '../color.js';

export class BimatrixHeatmap extends PolymerElement {

    static get template() {
        return html `
            <style>
                :host {
                    display: inline-block;
                    position: relative;
                    font-size: 9pt;
                    font-weight: bold;
                }

                canvas {
                    border: 1px black solid;
                }

                #heatmap-container {
                    position: relative;
                }

                #my-val {
                    position: absolute;
                    bottom: 0;
                    left: -2%;
                    width: 104%;
                    border-top: 2px solid black;
                }

                #other-val {
                    position: absolute;
                    height: 104%;
                    right: 0;
                    top: -2%;
                    border-left: 2px solid black;
                }

                #at-worst-container {
                    position: relative;
                    float: right;
                    width: 30px;
                    margin-top: 20px;
                }

                #at-worst-label {
                    position: absolute;
                    right: 10px;
                    top: -40px;
                    width: 100px;
                    text-align: right;
                }

                #at-worst {
                    position: absolute;
                    left: 10px;
                    text-align: center;
                    margin-bottom: -10px;
                }

                #best-response-container {
                    position: relative;
                    height: 30px;
                    clear: left;
                }

                #best-response {
                    position: absolute;
                    text-align: center;
                    width: 20px;
                    margin-right: -10px;
                }

            </style>
            <div>
                <div style="float: left">
                    <div style="height: 20px">
                        <span>
                            [[_arrayItem(payoffs.*, 0)]]
                        </span>
                        <span style="float: right">
                            [[_arrayItem(payoffs.*, 1)]]
                        </span>
                    </div>
                    <div
                        id="heatmap-container"
                        style$="width: [[size]]px; height: [[size]]px">
                        <canvas
                            id="canvas"
                            style$="width: [[size]]px; height: [[size]]px">
                        </canvas>
                        <div
                            id="my-val"
                            style$="height: [[_calcPercent(myDecision)]]">
                        </div>
                        <div
                            id="other-val"
                            style$="width: [[_calcPercent(otherDecision)]]">
                        </div>
                    </div>
                    <div style="height: 20px">
                        <span>
                            [[_arrayItem(payoffs.*, 2)]]
                        </span>
                        <span style="float: right">
                            [[_arrayItem(payoffs.*, 3)]]
                        </span>
                    </div>
                </div>
                <template is="dom-if" if="{{ showAtWorst }}">
                    <div id="at-worst-container" style$="height: [[size]]px">
                        <div id="at-worst-label">
                            <span style="vertical-align: text-top">At Worst</span>
                            <!-- &#8628; is RIGHTWARDS ARROW WITH CORNER DOWNWARDS -->
                            <font size="5" style="vertical-align: top">&#8628;</font>
                        </div>
                        <div id="at-worst" style$="bottom: [[_calcPercent(myDecision)]]">
                            {{ _atWorst }}
                        </div>
                    </div>
                </template>
                <template is="dom-if" if="{{ showBestResponse }}">
                    <div id="best-response-container" style$="width: [[size]]px">
                        <div id="best-response" style$="right: [[_calcPercent(otherDecision)]]">
                            {{ _bestResponse }}
                        </div>
                    </div>
                </template>
            </div>
        `
    }

    static get properties() {
        return {
            size: Number,
            myDecision: Number,
            otherDecision: Number,
            payoffs: {
                type: Array,
                observer: 'make_heatmap',
            },
            color: {
                type: String,
                observer: 'make_heatmap',
            },
            showAtWorst: Boolean,
            showBestResponse: Boolean,
            _atWorst: {
                type: Number,
                computed: '_computeAtWorst(myDecision, payoffs)',
            },
            _bestResponse: {
                type: Number,
                computed: '_computeBestResponse(otherDecision, payoffs)',
            }
        }
    }

    _calcPercent(decision) {
        return decision * 100 + "%"
    }
    _arrayItem(change, index) {
        return change.base[index]
    }
    make_heatmap() {
        if (!this.color || !this.payoffs) {
            return;
        }
        const canvas = this.$.canvas;
        const w = canvas.width;
        const h = canvas.height;
        const ctx = canvas.getContext('2d');

        const max_payoff = Math.max(... this.payoffs);

        // create empty imageData object
        const imageData = ctx.createImageData(w, h);
        const data = imageData.data;

        // iterate through every pixel in the image in row major order
        for (let row = 0; row < h; row++) {
            // calculate percent distance from bottom and top of image
            const percent_bottom = row / h;
            const percent_top = 1 - percent_bottom;
            for (let col = 0; col < w; col++) {
                // calculate percent distance from left and right of image
                const percent_right = col / w;
                const percent_left = 1 - percent_right;

                // calculate the payoff at each pixel by weighting the payoff at each corner by its distance from the pixel
                const point_payoff = (
                    (percent_top * percent_left * this.payoffs[0]) +
                    (percent_top * percent_right * this.payoffs[1]) +
                    (percent_bottom * percent_left * this.payoffs[2]) +
                    (percent_bottom * percent_right * this.payoffs[3])
                );

                // divide the payoff by the max payoff to get an color intensity percentage
                // use get_gradient_color to get the appropriate color in the gradient for that percentage
                const point_color = get_gradient_color(
                    point_payoff / max_payoff, this.color);

                // set imageData for this pixel to the calculated color
                const index = (row * w * 4) + (col * 4);
                data[index] = point_color[0];
                data[index + 1] = point_color[1];
                data[index + 2] = point_color[2];
                // set alpha channel to fully opaque
                data[index + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }
    _computeAtWorst(myDecision, payoffs) {
        const left = myDecision * payoffs[0] + (1 - myDecision) * payoffs[2];
        const right = myDecision * payoffs[1] + (1 - myDecision) * payoffs[3];
        const worst = Math.round(Math.min(left, right));
        return isNaN(worst) ? '' : worst;
    }
    _computeBestResponse(otherDecision, payoffs) {
        const top = otherDecision * payoffs[0] + (1 - otherDecision) * payoffs[1];
        const bottom = otherDecision * payoffs[2] + (1 - otherDecision) * payoffs[3];
        const best = Math.round(Math.max(top, bottom));
        return isNaN(best) ? '' : best;
    }
}

window.customElements.define('bimatrix-heatmap', BimatrixHeatmap);
