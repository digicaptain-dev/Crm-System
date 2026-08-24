const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid'); // Import uuid for generating unique IDs
const db = require('../db');
const fs = require('fs');

// Set up multer to upload files
const upload = multer({ dest: 'uploads/' });

// Route to handle the file upload and data processing
router.post('/', upload.single('dealsFile'), async(req, res) => {
    const { deal_owner, pipeline_id, user_id } = req.body;

    console.log('Received data in uploadRoutes:', { deal_owner, pipeline_id, user_id });

    // Check if the file is uploaded
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    let workbook, worksheet, values, values2;

    try {
        // Read and parse Excel file
        workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // Validate Excel content
        if (!worksheet || worksheet.length === 0) {
            return res.status(400).send('Excel file is empty or improperly formatted');
        }

        // Prepare values for SQL insertion
        values = worksheet.map((row) => [
            uuidv4(), // Generate unique deal ID for each row
            row["Website"],
            row["Email ID"],
            row["Name"],
            row["Number"],
            row["Time Zone"],
            row["Address"],
            pipeline_id,
            deal_owner
        ]);

        // Prepare values2 for the comments table insertion
        values2 = worksheet.map((row, index) => [
            uuidv4(),
            values[index][0], // Use the generated deal_id from `values`
            row["Comment"],
            user_id,
            deal_owner,
            "admin"
        ]);

        // Log values to check structure
        console.log('Values for insertion:', values);

    } catch (error) {
        console.error('Error processing Excel file:', error);
        return res.status(500).send('Error processing Excel file');
    }

    try {
        // Start a transaction to ensure atomicity
        await db.beginTransaction();

        // Insert into the deals table
        const sqlDeals = `
          INSERT INTO deals 
          (deal_id, deal_name, customer_email, contact_person, customer_number, time_zone, customer_address, pipeline_id, deal_owner) 
          VALUES ?`;

        // Perform the deal insertion
        await db.query(sqlDeals, [values]);

        // Insert into the comments table
        const sqlComments = `
          INSERT INTO comments (comment_id, deal_id, comment, user_id, user_name, user_role) 
          VALUES ?`;
        await db.query(sqlComments, [values2]);

        // Commit the transaction
        await db.commit();

        res.status(200).json({ status: true, message: 'Deals successfully inserted' });

    } catch (err) {
        // Rollback the transaction in case of error
        await db.rollback();
        console.error('Database insertion error:', err);
        return res.status(500).send('Error inserting data into database');
    } finally {
        // Clean up the uploaded file
        fs.unlink(req.file.path, (err) => {
            if (err) {
                console.error('Error deleting the uploaded file:', err);
            }
        });
    }
});

module.exports = router;