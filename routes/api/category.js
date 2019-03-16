const express = require('express');
const router = express.Router();

const Category = require('../../models/switchedDevices/deviceCategories/DeviceCategory');

// Temporary Bulk Delete Route, For Dev
router.get('/delete/all', (req,res) => {
    //Category.remove({}).then(res.json({msg: "GOT EM ALL"}));
});

router.delete('/:id', (req,res) => {
    Category.findByIdAndRemove(req.params.id, (err, category) => {
        if (err) {
            console.log("ERROR DELETING " +  err);
            return res.status(500).send(err);
        }
        return res.json({ message: "Category successfully deleted" });
    });
});

// Get All Categories
router.get('/', (req, res) => {
    Category.find({}).
    then(categories => {
        if (categories.length > 0) {
            res.json(categories);
        } else {
            res.json( {error: "no categories yet."} );
        }
    }); 
});

// Create New Category
router.post('/', (req, res) => {
    if (req.body.name) {
        Category.find({name: req.body.name}).
            then(categories => {
                if (categories.length > 0) {
                    return res.json({error: "This category already exists."});
                } else {
                    Category.create({name: req.body.name}, function(err, newCategory) {
                        if (err) res.json(err);
                        
                        console.log(newCategory);
                
                        res.json(newCategory);
                    });
                }
            }); 
    } else {
        res.json({error: "Category requires a name"});
    }
});

module.exports = router;