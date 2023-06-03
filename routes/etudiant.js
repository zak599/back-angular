var express = require('express');
var router = express.Router();
const controller = require('../controllers/etudiant.controller');


router.get('/', controller.findAll);
router.get('/:id', controller.findOne);
router.post('/', controller.create);
router.patch('/:id', controller.updateOne);
router.delete('/:id', controller.deleteOne);

module.exports = router;