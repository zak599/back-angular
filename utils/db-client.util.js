const { MongoClient } = require('mongodb');
//mongodb://user:pass@localhost

const url = `mongodb://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@${process.env.MONGO_DB_HOST}:${process.env.MONGO_DB_PORT}`;
//const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

(async () => {
    try {
        await client.connect();
        console.log('connected successfully');
    } catch (err) {
        console.error('error connecting:', err);
        process.exit(1);
    }
})();

module.exports = client;
