const dbclient = require('../utils/db-client.util');
const professeurCollection = dbclient.db(process.env.MONGO_DB_DATABASE).collection('professeurs');
const etudiantCollections = dbclient.db(process.env.MONGO_DB_DATABASE).collection('etudiants');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

exports.register = async (req, res) => {
    try {
        const saltRounds = 10;
        const { email, password, nom, telephone, address, userType } = req.body;
        const salt = await bcrypt.genSalt(saltRounds);
        const hashPassword = await bcrypt.hash(password, salt)
        if (userType === 'professeur') {
            await professeurCollection.insertOne(
                {
                    nom,
                    email,
                    address,
                    telephone,
                    password: hashPassword,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            )
        } else {
            await etudiantCollections.insertOne(
                {
                    nom,
                    email,
                    address,
                    telephone,
                    password: hashPassword,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            )
        }
        return res.status(201).send({ message: 'user inserted successfuly' })
    } catch (error) {
        return res.status(400).send({ message: 'error' })
    }

}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if(!email || !password) {
            return res.status(401).send({message: 'body missing'})
        }
        const userIsEtudiant = await etudiantCollections.findOne({ email });
        const userIsProf = await professeurCollection.findOne({ email });
        if (userIsEtudiant) {
            const isPasswordMatch = await bcrypt.compare(password, userIsEtudiant.password)
            if (isPasswordMatch) {
                const token = jwt.sign({ id: userIsEtudiant._id, username: userIsEtudiant.username }, 'eskdlfdsllamamfaf12456500122f132165465465dfsd');
                return res.status(200).send({ token, role: 'etudiant', id: userIsEtudiant._id });
            }
            return res.status(404).json({ message: 'invalid password' })
        }
        if (userIsProf) {
            const isPasswordMatch = await bcrypt.compare(password, userIsProf.password)
            if (isPasswordMatch) {
                const token = jwt.sign({ id: userIsProf._id, username: userIsProf.email }, 'eskdlfdsllamamfaf12456500122f132165465465dfsd');
                return res.status(200).json({ token, role: 'professeur',id: userIsProf._id });
            }
            return res.status(404).send({ message: 'invalid password' })
        }

        return res.status(404).json({ message: 'user not found' })
    } catch (error) {
        console.error('Failed to login:', error);
        res.status(500).send({ message: 'Failed to login:', error });
    }
}




