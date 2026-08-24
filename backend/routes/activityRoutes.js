const express = require('express');
const db = require('../db');
const router = express.Router();

// Middleware function to track activity
const activityTracker = () => {
    db.query("INSERT INTO activities (deal_id, user_id, activity_type, details) VALUES (?, ?, ?)", [deal_id, user_id, activity_type, `Activity Recorded ${new Date().toUTCString()} by User Id: ${user_id} on Deal Id ${deal_id}`], () => {
        console.log(`Activity Recorded ${new Date().toUTCString()} by User Id: ${user_id} on Deal Id ${deal_id}`)
    });
};

router.get('/activities', (req, res) => {
    db.query("SELECT * FROM activities WHERE activity_type = ? ORDER BY created_at DESC ", ["comment"], (err, result) => {
        if (err) {
            return res.json([]);
        };
        res.json(result);
    });
});

// Example route to demonstrate activity tracking
router.get('/activity-demo/:user_id', activityTracker, (req, res) => {
    res.status(200).send(`Activity tracked for user with ID: ${req.params.user_id}`);
});

// Example POST route
router.post('/submit-activity', activityTracker, (req, res) => {
    res.status(200).json({ message: `Activity tracked for user with ID: ${req.body.user_id}` });
});

module.exports = router;