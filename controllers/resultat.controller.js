const dbClient = require('../utils').dbClient;
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('resultat');
const Joi = require('joi');
const { ObjectId } = require('mongodb');


exports.findAll = async (req, res) => {
    try {
        const data = await collection
            .aggregate([
                {
                    $lookup: {
                        from: 'professeur',
                        localField: 'id_professeur',
                        foreignField: '_id',
                        as: 'professeur',
                    },
                    $lookup: {
                        from: 'etudiant',
                        localField: 'id_etudiant',
                        foreignField: '_id',
                        as: 'etudiant',
                    }
                },

                {
                    $project: {
                        _id: 1,
                        'professeurs.nom': 1,
                    },
                    $project: {
                        _id: 1,
                        'etudiant.nom': 1,
                    }
                },
            ])
            .toArray();

        return res.status(200).json(data);
    } catch (err) {
        return res
            .status(500)
            .json({ message: 'Une erreur interne est survenue' });
    }
};

exports.findOne = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({
            message: 'Aucun id fourni',
        });
    }

    const data = await collection.findOne({ _id: new ObjectId(id) });
    if (!data) {
        res.status(404).json({
            message: 'aucun resultat trouvé' ,
        });
    }
    res.status(200).json(data);
};


exports.create = async (req, res) => {
    try{
    const schema = Joi.object({
        Note: Joi.array().items(Joi.number().required()).required(),
        Nbr_Note: Joi.number(),
        Moyenne: Joi.number(),
        Max: Joi.number(),
        Min: Joi.number(),
        id_professeur: Joi.array().items(Joi.string().required()).required(),
        id_etudiant: Joi.array().items(Joi.string().required()).required(),
    });
    const { error, value } = await schema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        try {
            const result = await collection.insertOne({
                ...value,
                id_professeur: value.id_professeur.map((id) => new ObjectId(id)),
                id_etudiant: value.id_etudiant.map((id) => new ObjectId(id)),
            });

            return res
                .status(200)
                .json({ message: 'Resultat créée avec succès' });
        } catch (err) {
            return res
                .status(500)
                .json({ message: 'Une erreur interne est survenue' });
        }
    } catch (err) {
        return res
            .status(500)
            .json({ message: 'Une erreur interne est survenue' });
    }
}



exports.updateOne = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'Aucun id fourni' });
    }
    const { body } = req;

    const schema = Joi.object({
        Note: Joi.array().items(Joi.number().required()).required(),
        Nbr_Note: Joi.number(),
        Moyenne: Joi.number(),
        Max: Joi.number(),
        Min: Joi.number(),
        id_professeur: Joi.array().items(Joi.string().required()).required(),
        id_etudiant: Joi.array().items(Joi.string().required()).required(),
    });

    try {
        const value = await schema.validateAsync(body);

        let updateValue;

        if (
            typeof value === 'object' &&
            value !== null &&
            !value.hasOwnProperty('id_professeur') &&
            !value.hasOwnProperty('id_etudiant')
        ) {
            
            updateValue = { ...value };
            delete updateValue.id_professeur;
            delete updateValue.id_etudiant;

        } else {
            updateValue = {
                ...value,
                id_professeur: value.id_professeur.map((el) => new ObjectId(el)),
                id_etudiant: value.id_etudiant.map((el) => new ObjectId(el)),
            };
        }

        const data = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            {
                $set: updateValue,
            },
            {
                returnDocument: 'after',
            }
        );

        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.details[0].message });
    }
};


exports.deleteOne = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            message: 'Aucun identifiant fourni',
        });
    }

    const { force } = req.query;

    try {
        const client = await collection.findOne({ _id: new ObjectId(id) });
        if (!client) {
            return res.status(404).json({
                message: 'Resultat non trouvé',
            });
        }

        if (force === undefined || parseInt(force, 10) === 0) {
            // suppression logique
            const data = await collection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: {
                        deletedAt: new Date(),
                    },
                }
            );
            return res.status(200).json(data);
        } else if (parseInt(force, 10) === 1) {
            // suppression physique
            try {
                await collection.deleteOne({ _id: new ObjectId(id) });
                return res.status(204).json(null);
            } catch (error) {
                console.error(error);
                return res.status(500).json({
                    message: 'Erreur de serveur interne',
                });
            }
        } else {
            return res.status(400).json({
                message: 'Paramètre malformé "force"',
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Erreur de serveur interne',
        });
    }
};


exports.findProfesseur = async (req, res) => {
    const { id } = req.params;

    try {
        const data = await collection
            .aggregate([
                { $match: { _id: new ObjectId(id) } },
                {
                    $lookup: {
                        from: 'professeurs',
                        localField: 'id_professeur',
                        foreignField: '_id',
                        as: 'professeurs',
                    },
                },

                {
                    $project: {
                        _id: 1,
                        'professeurs.nom': 1,
                        'professeurs.email': 1,
                    }
                },
            ])
            .toArray();

        if (data.length === 0) {

            res.status(404).json({ message: 'Professeur non trouvé' });
        } else {
            res.status(200).json(data[0].professeurs);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur de serveur interne' });
    }
};


exports.addProfesseur = async (req, res) => {
    const { id } = req.params;

    const { body } = req;

    const data = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $addToSet: { id_professeur: new ObjectId(body._id) } },
        { returnDocument: 'after' }
    );

    res.status(201).json({ message: 'Professeur ajouté' });
};

exports.removeProfesseur = async (req, res) => {
    const { id, _id } = req.params;

    try {
        const resultat = await collection.findOne({ _id: new ObjectId(id) });
        if (!resultat) {
            return res.status(404).json({ message: 'Resultat non trouvée' });
        }

        const professeurIndex = resultat.id_professeur.findIndex(
            (professeurId) => professeurId.toString() === _id
        );
        if (professeurIndex === -1) {
            return res.status(404).json({
                message: "L'identifiant  n'existe pas dans le resultat",
            });
        }

        // Mettre à jour client
        const data = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            {
                $pull: {
                    id_professeur: { $in: [new ObjectId(_id)] },
                },
            },
            { returnDocument: 'after' }
        );

        return res.status(200).json({ message: 'profeseur supprimé avec succès' });
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .json({ message: 'Une erreur interne est survenue' });
    }
};

exports.findEtudiant = async (req, res) => {
    const { id } = req.params;

    try {
        const data = await collection
            .aggregate([
                { $match: { _id: new ObjectId(id) } },
                {
                    $lookup: {
                        from: 'etudiant',
                        localField: 'id_etudiant',
                        foreignField: '_id',
                        as: 'etudiant',
                    },
                },

                {
                    $project: {
                        _id: 1,
                        'etudiant.name': 1,
                        'etudiant.email': 1,
                    }
                },
            ])
            .toArray();

        if (data.length === 0) {

            res.status(404).json({ message: 'Etudiant non trouvé' });
        } else {
            res.status(200).json(data[0].etudiant);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur de serveur interne' });
    }
};


exports.addEtudiant = async (req, res) => {
    const { id } = req.params;

    const { body } = req;

    const data = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $addToSet: { id_etudiant: new ObjectId(body._id) } },
        { returnDocument: 'after' }
    );

    res.status(201).json({ message: 'Etudiant ajouté' });
};

exports.removeEtudiant = async (req, res) => {
    const { id, _id } = req.params;

    try {
        // Vérifier que le client existe
        const resultat = await collection.findOne({ _id: new ObjectId(id) });
        if (!resultat) {
            return res.status(404).json({ message: 'Resultat non trouvée' });
        }

        // Vérifier que l'identifiant commande existe dans le cliant
        const etudiantIndex = resultat.id_etudiant.findIndex(
            (etudiantId) => etudiantId.toString() === _id
        );
        if (etudiantIndex === -1) {
            return res.status(404).json({
                message: "L'identifiant  n'existe pas dans le resultat",
            });
        }

        // Mettre à jour client
        const data = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            {
                $pull: {
                    id_etudiant: { $in: [new ObjectId(_id)] },
                },
            },
            { returnDocument: 'after' }
        );

        return res.status(200).json({ message: 'Etudiant supprimé avec succès' });
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .json({ message: 'Une erreur interne est survenue' });
    }
};