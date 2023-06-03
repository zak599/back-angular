require('dotenv').config();
const bcrypt = require('bcrypt')

const dbClient = require('./utils/db-client.util');

const seed = async () => {
    const db = await dbClient.db(process.env.MONGO_DB_DATABASE);
    //const collections = ['professeurs', 'etudiants', 'cours', 'resultats'];
    const collections = ['professeurs', 'etudiants', 'cours'];

    const existingCollectionsCursor = await db.listCollections();
    const existingCollections = await existingCollectionsCursor.toArray();
    const existingCollectionNames = existingCollections.map((c) => c.name);

    for (const c of collections) {
        try {
            if (existingCollectionNames.includes(c)) {
                await db.dropCollection(c);
            }
            await db.createCollection(c);
        } catch (e) {
            console.error(c, e);
        }
    }
    const salt = await bcrypt.genSalt(10);
    const cryptedPassword = await bcrypt.hash('password', salt);
    const professeurDto = [
        {
            nom: 'robert',
            email: 'robert.reni@gmail.com',
            address: {
                street: 'Rue du nord',
                nbr: 67,
                postCode: 7700,
                city: 'Mouscron',
                country: 'Belgium',
            },
            password: cryptedPassword,
            telephone: '0465251465',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            nom: 'Pierre',
            email: 'pierre.reni@gmail.com',
            address: {
                street: 'Rue du sud',
                nbr: 80,
                postCode: 8012,
                city: 'Paris',
                country: 'France',
            },
            password: cryptedPassword,
            telephone: '0465251465',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];

    await db.collection('professeurs').insertMany(professeurDto);

    const etudiantDto = [
        {
            name: {
                first: 'jean',
                last: 'luc',
            },
            email: 'jean.luc@gmail.com',
            address: {
                street: 'Rue de la liberte',
                nbr: 11,
                postCode: 7700,
                city: 'Mouscron',
                country: 'Belgium',
            },
            password: cryptedPassword,
            telephone: '0467564654',
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    ];
    await db.collection('etudiants').insertMany(etudiantDto);
    
    process.exit();

};


seed();