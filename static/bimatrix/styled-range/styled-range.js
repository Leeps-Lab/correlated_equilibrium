import {html,PolymerElement} from '/static/otree-redwood/node_modules/@polymer/polymer/polymer-element.js';
import '/static/otree-redwood/src/redwood-channel/redwood-channel.js';
import './range-styles.js';

export class StyledRange extends PolymerElement {

    static get template() {
        return html `
            <style include="range-styles">
                :host {
                    display: flex;
                    flex-direction: row;
                    width: 100%;
                    height: 100%;
                }
            </style>

            <redwood-channel id="channel" channel="target"></redwood-channel>

            <input
                id="input"
                type="range"
                min="[[ min ]]"
                max="[[ max ]]"
                step="[[ step ]]"
                disabled$="[[ disabled ]]"
                on-change="_inputValueChanged"
                value="[[ initialValue ]]">
        `
    }

    static get properties() {
        return {
            disabled: {
                type: Boolean,
                observer: '_disabledChanged'
            },
            min: {
                type: Number,
            },
            max: {
                type: Number,
            },
            step: {
                type: Number,
            },
            // in seconds to move slider from 0 to 1
            rateLimit: {
                type: Number,
                value: 0,
            },
            value: {
                type: Number,
                notify: true,
                //observer: '_parentValueChanged',
            },
            initialValue: {
                type: Number,
            },
            _sliderValue: {
                type: Number,
            },
            _lastMovedTime: {
                type: Number,
            },
            _timeoutID: {
                type: Number,
            },
        }
    }

    _inputValueChanged(event) {
        this._sliderValue = parseFloat(event.target.value);
        if (this.rateLimit > 0) {
            window.clearTimeout(this._timeoutID);
            this._lastMovedTime = performance.now();
            this._timeoutID = window.setTimeout(this._tick.bind(this), 200);
            this.$.channel.send(this._sliderValue);
        }
        else {
            this.value = this._sliderValue;
        }
    }
    _tick() {
        let dist = (performance.now() - this._lastMovedTime) / (this.rateLimit * 1000);
        this._lastMovedTime = performance.now();
        if (this._sliderValue < this.value) dist *= -1;
        let new_value = this.value + dist;
        if ((dist < 0 && new_value <= this._sliderValue) ||
            (dist > 0 && new_value >= this._sliderValue)) {
            new_value = this._sliderValue;
        }
        else {
            this._timeoutID = window.setTimeout(this._tick.bind(this), 200);
        }
        this.value = new_value;
    }
    _parentValueChanged(newValue, oldValue) {
        this.$.input.value = newValue;
    }
    _disabledChanged(newValue, oldValue) {
        if (newValue === true) window.clearTimeout(this._timeoutID);
    }
}

window.customElements.define('styled-range', StyledRange);
