var express = require('express');
var router = express.Router();
const controller = require('../controllers/resultat.controller');


router.get('/', controller.findAll);
router.get('/:id', controller.findOne);
router.post('/', controller.create);
router.patch('/:id', controller.updateOne);
router.delete('/:id', controller.deleteOne);

router.get('/:id/id_professeur', controller.findProfesseur);
router.post('/:id/id_professeur', controller.addProfesseur);
router.delete('/:id/id_professeur/:_id', controller.removeProfesseur); 

router.get('/:id/id_etudiant', controller.findEtudiant);
router.post('/:id/id_etudiant', controller.addEtudiant);
router.delete('/:id/id_etudiant/:_id', controller.removeEtudiant); 

module.exports = router;