const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SwitchedDeviceSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'DeviceCategory'
    },
    room: {
        type: Schema.Types.ObjectId,
        ref: 'Room'
    },
    switch: {
        type: Schema.Types.ObjectId,
        ref: 'BaseSwitch'
    }
});

module.exports = SwitchedDevice = mongoose.model('SwitchedDevice', SwitchedDeviceSchema);