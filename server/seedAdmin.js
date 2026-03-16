require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./models/Admin');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/akproject');
        console.log('Connected to DB');

        const email = 'alisuraj998@gmail.com';
        const password = 'Suraj123';

        const existing = await Admin.findOne({ email });
        if (existing) {
            console.log('User already exists');
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const admin = new Admin({ email, password: hashedPassword });
            await admin.save();
            console.log('User created successfully:', email);
        }
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
};

run();
