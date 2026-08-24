const express = require('express');
const router = express.Router();
const db = require('../db');
const uuid = require('uuid');
const checkAdminRole = require('../middleware/isAdmin');

// Get all deals
router.get('/deals', (req, res) => {
    const sql = 'SELECT * FROM deals';
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Get deal by ID
router.get('/deal/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM deals WHERE deal_id = ?';
    db.query(sql, [id], (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});

// Add new deal
router.post("/deal", (req, res) => {
  const newDeal = {
    deal_id: uuid.v4(),
    ...req.body,
  };

  const sql = "INSERT INTO deals SET ?";

  db.query(sql, newDeal, (err, results) => {
    if (err) {
      console.error("Create deal error:", err);

      return res.status(400).json({
        error: "INVALID BODY INPUT",
        message: err.sqlMessage,
      });
    }

    // Return the complete newly created deal
    db.query(
      "SELECT * FROM deals WHERE deal_id = ?",
      [newDeal.deal_id],
      (selectErr, rows) => {
        if (selectErr) {
          console.error(
            "Error fetching created deal:",
            selectErr
          );

          return res.status(500).json({
            error: "DEAL_CREATED_BUT_FETCH_FAILED",
          });
        }

        return res.status(201).json({
          success: true,
          deal: rows[0],
        });
      }
    );
  });
});

// Update deal by ID
router.put('/deal/:id/:uid', (req, res) => {
    const { id, uid } = req.params;
    const updatedDeal = req.body;

    const sql = 'UPDATE deals SET ? WHERE deal_id = ?';
    db.query(sql, [updatedDeal, id], (err, results) => {
        if (err) throw err;
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Deal not found' });
        }

        db.query("INSERT INTO activities (deal_id, user_id, activity_type, details) VALUES (?, ?, ?, ?)", [id, uid, "stage change", `Deal updated on ${new Date().toUTCString()} by User Id: ${uid} Deal Id: ${id} Deal updated content ${JSON.stringify(updatedDeal)}`], () => {
            console.info(`UPDATE IN DEAL ACTIVITY RECORDED [UID: ${uid}, DID: ${JSON.stringify(updatedDeal)}]`)
        });

        res.json({ message: 'Deal updated successfully', updatedDeal });
    });
});

// Delete deal by ID
router.delete('/deal', (req, res) => {
    const deal_id = req.body.deal_id;
    console.log(deal_id)
    const sql = 'DELETE FROM deals WHERE deal_id = ?';
    db.query(sql, deal_id, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

router.get('/deals/pipeline/:pipelineId/:assigned_id', checkAdminRole, (req, res) => {
    const { pipelineId, assigned_id } = req.params;
    var query = "";

    if (req.isAdmin) {
        query = 'SELECT * FROM deals WHERE pipeline_id = ?';

        db.query(query, [pipelineId], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        });
    } else {
        query = 'SELECT * FROM deals WHERE pipeline_id = ? AND assign_to = ?';

        db.query(query, [pipelineId, assigned_id], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        });
    };
});

router.put('/deals/assign', async(req, res) => {
    const { deal_ids, user_id } = req.body;

    if (!deal_ids || !user_id || !Array.isArray(deal_ids)) {
        return res.status(400).json({ error: 'Invalid data format' });
    }

    try {
        // Assuming you have a deals table where you can update the user_id for each deal
        const query = `UPDATE deals SET assign_to = ? WHERE deal_id IN (?)`;

        await db.query(query, [user_id, deal_ids]);

        res.status(200).json({ message: 'Deals successfully assigned to user.' });
    } catch (error) {
        console.error('Error updating deals:', error);
        res.status(500).json({ error: 'An error occurred while assigning deals.' });
    }
});

module.exports = router;