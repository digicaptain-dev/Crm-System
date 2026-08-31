const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4 } = require('uuid');

/**
 * @swagger
 * tags:
 *   name: Pipelines
 *   description: Pipeline and pipeline-stage management
 */

// Get all pipelines
/**
 * @swagger
 * /pipelines:
 *   get:
 *     summary: Get all pipelines with their stages and deals
 *     tags: [Pipelines]
 *     responses:
 *       200:
 *         description: A list of pipelines
 *       500:
 *         description: Server error
 */
router.get('/pipelines', async (req, res) => {

    const query = `
        SELECT 
            p.pipeline_id,
            p.pipeline_name,
            p.description,
            p.created_at,

            s.stage_id,
            s.stage_name,
            s.stage_order,
            s.description AS stage_description,

            d.deal_id,
            d.deal_name,
            d.deal_value,
            d.deal_stage,
            d.deal_owner,
            d.customer_email,
            d.close_date,
            d.deal_priority,
            d.deal_status,
            d.pipeline_id AS deal_pipeline_id

        FROM pipelines p

        LEFT JOIN stages s
            ON p.pipeline_id = s.pipeline_id

        LEFT JOIN deals d
            ON s.pipeline_id = d.pipeline_id
            AND s.stage_id = d.deal_stage

        ORDER BY
            p.created_at DESC,
            s.stage_order ASC
    `;

    try {

        const [results] = await db.query(query);

        const pipelines = [];

        results.forEach((row) => {

            let pipeline = pipelines.find(
                (item) => item.pipeline_id === row.pipeline_id
            );

            // Create pipeline
            if (!pipeline) {

                pipeline = {
                    pipeline_id: row.pipeline_id,
                    pipeline_name: row.pipeline_name,
                    description: row.description,
                    created_at: row.created_at,
                    stages: []
                };

                pipelines.push(pipeline);
            }

            // Find stage
            let stage = pipeline.stages.find(
                (item) => item.stage_id === row.stage_id
            );

            // Create stage
            if (!stage && row.stage_id) {

                stage = {
                    stage_id: row.stage_id,
                    stage_name: row.stage_name,
                    stage_order: row.stage_order,
                    description: row.stage_description,
                    deals: []
                };

                pipeline.stages.push(stage);
            }

            // Add deal to stage
            if (stage && row.deal_id) {

                stage.deals.push({
                    deal_id: row.deal_id,
                    deal_name: row.deal_name,
                    deal_value: row.deal_value,
                    deal_stage: row.deal_stage,
                    deal_owner: row.deal_owner,
                    customer_email: row.customer_email,
                    close_date: row.close_date,
                    deal_priority: row.deal_priority,
                    deal_status: row.deal_status
                });
            }
        });

        return res.json(pipelines);

    } catch (err) {

        console.error("Fetch pipelines error:", err);

        return res.status(500).json({
            error: err.message
        });
    }
});



// Get a specific pipeline by ID
/**
 * @swagger
 * /pipelines/{id}:
 *   get:
 *     summary: Get one pipeline
 *     tags: [Pipelines]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pipeline ID
 *     responses:
 *       200:
 *         description: Pipeline details
 *       404:
 *         description: Pipeline not found
 *       500:
 *         description: Server error
 */
router.get('/pipelines/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM pipelines WHERE pipeline_id = ?';

    db.query(query, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'Pipeline not found' });
        }
        res.json(result[0]);
    });
});

// Create a new pipeline
/**
 * @swagger
 * /pipelines:
 *   post:
 *     summary: Create a pipeline with five default stages
 *     tags: [Pipelines]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pipeline_name]
 *             properties:
 *               pipeline_name:
 *                 type: string
 *                 example: Sales pipeline
 *               description:
 *                 type: string
 *                 example: Pipeline for new sales opportunities
 *     responses:
 *       201:
 *         description: Pipeline created
 *       500:
 *         description: Server error
 */
router.post('/pipelines', (req, res) => {
    const { pipeline_name, description } = req.body;
    var pipeline_id = v4();

    const query = 'INSERT INTO pipelines (pipeline_name, description, pipeline_id) VALUES (?, ?, ?)';

    const query_pre = 'INSERT INTO stages (stage_id, stage_name, stage_order, description, pipeline_id) VALUES ?';

    const records = [
        [1, "Qualified", 1, "Qualified", pipeline_id],
        [2, "Content Made", 2, "Content Made", pipeline_id],
        [3, "Demo Scheduled", 3, "Demo Scheduled", pipeline_id],
        [4, "Proposal Made", 4, "Proposal Made", pipeline_id],
        [5, "Negotiations Started", 5, "Negotiations Started", pipeline_id]
    ];

    // First create pipeline
    db.query(query, [pipeline_name, description, pipeline_id], (err, result) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        // Then create stages
        db.query(query_pre, [records], (err, result) => {

            if (err) {
                return res.status(500).json({
                    on: "1",
                    error: err.message
                });
            }

            res.status(201).json({
                message: 'Pipeline created successfully',
                pipeline_id: pipeline_id,
                stages: records
            });
        });
    });
});

// Update a pipeline by ID
/**
 * @swagger
 * /pipelines/{id}:
 *   put:
 *     summary: Update a pipeline
 *     tags: [Pipelines]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pipeline ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pipeline_name]
 *             properties:
 *               pipeline_name:
 *                 type: string
 *                 example: Updated sales pipeline
 *               description:
 *                 type: string
 *                 example: Updated pipeline description
 *     responses:
 *       200:
 *         description: Pipeline updated
 *       404:
 *         description: Pipeline not found
 *       500:
 *         description: Server error
 */
router.put('/pipelines/:id', (req, res) => {
    const { id } = req.params;
    const { pipeline_name, description } = req.body;
    const query = 'UPDATE pipelines SET pipeline_name = ?, description = ? WHERE pipeline_id = ?';

    db.query(query, [pipeline_name, description, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Pipeline not found' });
        }
        res.json({ message: 'Pipeline updated successfully' });
    });
});

// Delete a pipeline by ID
/**
 * @swagger
 * /pipelines/{id}:
 *   delete:
 *     summary: Delete a pipeline
 *     tags: [Pipelines]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pipeline ID
 *     responses:
 *       200:
 *         description: Pipeline deleted
 *       404:
 *         description: Pipeline not found
 *       500:
 *         description: Server error
 */
router.delete('/pipelines/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM pipelines WHERE pipeline_id = ?';

    db.query(query, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Pipeline not found' });
        }
        res.json({ message: 'Pipeline deleted successfully' });
    });
});

// Get all stages for a specific pipeline
/**
 * @swagger
 * /pipelines/{pipelineId}/stages:
 *   get:
 *     summary: Get all stages in a pipeline
 *     tags: [Pipelines]
 *     parameters:
 *       - in: path
 *         name: pipelineId
 *         required: true
 *         schema:
 *           type: string
 *         description: Pipeline ID
 *     responses:
 *       200:
 *         description: Pipeline stages ordered by stage order
 *       500:
 *         description: Server error
 */
router.get('/pipelines/:pipelineId/stages', (req, res) => {
    const { pipelineId } = req.params;
    const query = `
    SELECT s.stage_name, s.stage_order, s.description
    FROM stages s
    JOIN pipelines p ON p.pipeline_id = s.pipeline_id
    WHERE p.pipeline_id = ?
    ORDER BY s.stage_order;
  `;

    db.query(query, [pipelineId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

module.exports = router;
