const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const BaseSwitch = require('./BaseSwitch');
const RfService = require('../../../services/rfoutlets');

var rfSchema = new Schema({
    code: {
        on: {
            type: Number,
            default: 0,
            required: false
        },
        off: {
            type: Number,
            default: 0,
            required: false
        }
    },
    codesConfigured: {
        type: Boolean,
        default: false,
        required: false
    }
});

rfSchema.method('powerOn', function () {
    //if (this.codesConfigured) {
        this.state = true;
        this.save();
        RfService.sendSignal(this.code.on, this.rcFrequency);
        //console.log('turnin dis lamp on');
    //};
});

rfSchema.method('powerOff', function () {
    //if (this.codesConfigured) {
        this.state = false;
        this.save();
        RfService.sendSignal(this.code.off, this.rcFrequency);
        //console.log('turnin dis lamp on');
    //}
});

rfSchema.method('togglePower', function () {
        var action = this.state ? 'off' : 'on';
        this.state = !this.state;
        this.save();
        RfService.sendSignal(this.code[action], this.rcFrequency);
        //console.log('turnin dis lamp ' + action);
});

rfSchema.method('configure', function (codeArray) {
    this.code.on = codeArray.on;
    this.code.off = codeArray.off;
    if (this.code.on && this.code.off) {
        this.codesConfigured = true;
        this.save();
        //console.log('Codes Configured on Device');
    } else {
        //console.log('Both codes required (ON / OFF)');
    }
});

rfSchema.pre("save", function (next) {
    this.actions = [
        {
            name: "Power On",
            function: "powerOn"
        },
        {
            name: "Power Off",
            function: "powerOff"
        },
        {
            name: "Toggle Power",
            function: "togglePower"
        },
        {
            name: "Configure RF Codes",
            function: "configure"
        }
    ];
    next();
});

//Schema
const RFOutlet = BaseSwitch.discriminator(
    'RFOutlet',
    rfSchema
);

module.exports = mongoose.model('RFOutlet');