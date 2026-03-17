const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: '/Users/empid016/Documents/Ravi/ravi_zoho/backend/.env' });

const Employee = require('../backend/src/models/Employee');
const User = require('../backend/src/models/User');

async function fixRolesAndData() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // 1. Update all Employees to have the role from their User record
        const employees = await Employee.find();
        console.log(`Checking roles for ${employees.length} employees...`);

        for (const emp of employees) {
            const user = await User.findOne({ email: emp.email });
            if (user) {
                if (emp.role !== user.role) {
                    emp.role = user.role;
                    await emp.save();
                    console.log(`Updated role for ${emp.firstName} ${emp.lastName} to ${user.role}`);
                }
            } else {
                console.log(`No user found for employee ${emp.email}`);
            }
        }

        // 2. Specific fix for Senthil Kumar (Managing Director)
        const senthil = await Employee.findOne({ email: 'senthil.kumar@sunrisesolar.tn' });
        if (senthil) {
            senthil.role = 'Admin';
            await senthil.save();
            console.log('Ensured Senthil Kumar is Admin in Employee record');
        }

        await mongoose.disconnect();
        console.log('Fix complete');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixRolesAndData();
