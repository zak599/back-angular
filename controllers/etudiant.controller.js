const dbClient = require('../utils').dbClient;
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('etudiant');
const Joi = require('joi');
const { ObjectId } = require('mongodb');


exports.findAll = async (req, res) => {
    const data = await collection.find({}).toArray();
    res.status(200).json(data);
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
            message: 'aucun etudiant trouvé' ,
        });
    }
    res.status(200).json(data);
};

exports.create = async (req, res) => {
    const schema = Joi.object({
        nom: Joi.string(),
        email: Joi.string().email().required(),
        addresse: Joi.object({
            rue: Joi.string().required(),
            numero: Joi.number().required(),
            codePostale: Joi.number().required(),
            ville: Joi.string().required(),
            pays: Joi.string().required(),
        }),
        telephone: Joi.number().required(),
        password: Joi.string().required()
    });
    const { body } = req;
    const { error, value } = await schema.validate(body);

    if (error) {
        return res.status(400).json({ message: error });
    }

    const data = await collection.insertOne(value).catch((err) => {
        return { error: 'Impossible de sauver ce record!' };
    });
    res.status(201).json(data);
};

exports.updateOne = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'Aucun id fourni' });
    }
    const { body } = req;

    const schema = Joi.object({
        nom: Joi.string().required(),
        email: Joi.string().email().required(),
        addresse: Joi.object({
            rue: Joi.string().required(),
            numero: Joi.number().required(),
            codePostale: Joi.number().required(),
            ville: Joi.string().required(),
            pays: Joi.string().required(),
        }),
        telephone: Joi.number().required(),
    });

    try {
        const value = await schema.validateAsync(body);

        let updateValue;

        if (
            typeof value === 'object' &&
            value !== null     
        ) {
            updateValue = { ...value };
        } else {
            updateValue = {
                ...value,
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
                message: 'Etudiant non trouvé',
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
