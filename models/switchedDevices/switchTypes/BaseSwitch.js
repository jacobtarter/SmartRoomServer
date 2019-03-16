const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Schema
var options = {discriminatorKey: 'type'};
const BaseSwitch = mongoose.model('BaseSwitch', new Schema({
    state: {
        type: Boolean,
        default: false,
        required: true
    },
    actions: [
        {
            name: {
                type: String,
                required: true
            },
            function: {
                type: String,
                required: true
            }
        }
    ]
}, options
));

module.exports = mongoose.model('BaseSwitch');
