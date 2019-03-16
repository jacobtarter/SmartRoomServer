const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DeviceCategorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    }
});

module.exports = DeviceCategory = mongoose.model('DeviceCategory', DeviceCategorySchema);