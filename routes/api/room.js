const express = require('express');
const router = express.Router();

const SwitchedDevice = require('../../models/switchedDevices/SwitchedDevice');
const BaseSwitch = require('../../models/switchedDevices/switchTypes/BaseSwitch');
const BulbRGB = require('../../models/switchedDevices/switchTypes/BulbRGB');
const RFOutlet = require('../../models/switchedDevices/switchTypes/RFOutlet');
const Room = require('../../models/switchedDevices/rooms/Room');
const Category = require('../../models/switchedDevices/deviceCategories/DeviceCategory');

// Temporary Bulk Delete Route, For Dev
router.get('/delete/all', (req,res) => {
    //Room.remove({}).then(res.json({msg: "GOT EM ALL"}));
});

router.delete('/:id', (req,res) => {
    Room.findByIdAndRemove(req.params.id, (err, room) => {
        if (err) {
            console.log("ERROR DELETING " +  err);
            return res.status(500).send(err);
        }
        return res.json({ message: "Room successfully deleted" });
    });
});

// Get All Rooms
router.get('/', (req, res) => {
    Room.find({}).
    then(rooms => {
        if (rooms.length > 0) {
            res.json(rooms);
        } else {
            res.json( {error: "no rooms yet."} );
        }
    }); 
});

// Create New Room
router.post('/', (req, res) => {
    if (req.body.name) {
        Room.find({name: req.body.name}).
            then(rooms => {
                if (rooms.length > 0) {
                    return res.json({error: "This room already exists."});
                } else {
                    Room.create({name: req.body.name}, function(err, newRoom) {
                        if (err) res.json(err);
                        
                        console.log(newRoom);
                
                        res.json(newRoom);
                    });
                }
            }); 
    } else {
        res.json({error: "Room requires a name"});
    }
});

module.exports = router;