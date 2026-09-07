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


/* =========================================================
   GET ALL PIPELINES
   ========================================================= */

/**
 * @swagger
 * /pipelines:
 *   get:
 *     summary: Get all pipelines with their stages and deals
 *     tags: [Pipelines]
 */
router.get('/pipelines', async (req, res) => {

    console.log('\n========================================');
    console.log('GET ALL PIPELINES');
    console.log('========================================');

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

        console.log('STEP 1: Executing pipeline query');

        const [results] = await db.query(query);

        console.log('STEP 2: Query successful');
        console.log('Rows returned:', results.length);

        const pipelines = [];

        results.forEach((row) => {

            let pipeline = pipelines.find(
                (item) =>
                    String(item.pipeline_id) ===
                    String(row.pipeline_id)
            );

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

            let stage = pipeline.stages.find(
                (item) =>
                    String(item.stage_id) ===
                    String(row.stage_id)
            );

            if (!stage && row.stage_id !== null) {

                stage = {
                    stage_id: row.stage_id,
                    stage_name: row.stage_name,
                    stage_order: row.stage_order,
                    description: row.stage_description,
                    deals: []
                };

                pipeline.stages.push(stage);
            }

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

        console.log(
            'STEP 3: Pipelines formatted:',
            pipelines.length
        );

        console.log('GET ALL PIPELINES SUCCESS');

        return res.json(pipelines);

    } catch (err) {

        console.error('\n========================================');
        console.error('GET ALL PIPELINES ERROR');
        console.error('========================================');
        console.error('Message:', err.message);
        console.error('Code:', err.code);
        console.error('SQL State:', err.sqlState);
        console.error('SQL Message:', err.sqlMessage);
        console.error(err);

        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
});


/* =========================================================
   GET SINGLE PIPELINE
   ========================================================= */

/**
 * @swagger
 * /pipelines/{id}:
 *   get:
 *     summary: Get one pipeline
 *     tags: [Pipelines]
 */
router.get('/pipelines/:id', async (req, res) => {

    const { id } = req.params;

    console.log('\n========================================');
    console.log('GET SINGLE PIPELINE');
    console.log('Pipeline ID:', id);
    console.log('========================================');

    const query = `
        SELECT *
        FROM pipelines
        WHERE pipeline_id = ?
    `;

    try {

        console.log('STEP 1: Executing query');

        const [result] = await db.query(
            query,
            [id]
        );

        console.log(
            'STEP 2: Query completed. Rows:',
            result.length
        );

        if (result.length === 0) {

            console.log('ERROR: Pipeline not found');

            return res.status(404).json({
                success: false,
                error: 'Pipeline not found'
            });
        }

        console.log('Pipeline found');

        return res.json(result[0]);

    } catch (err) {

        console.error('GET SINGLE PIPELINE ERROR:', err);

        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
});


/* =========================================================
   CREATE PIPELINE
   ========================================================= */

/**
 * @swagger
 * /pipelines:
 *   post:
 *     summary: Create a pipeline with five default stages
 *     tags: [Pipelines]
 */
router.post('/pipelines', async (req, res) => {

    console.log('\n========================================');
    console.log('CREATE PIPELINE');
    console.log('========================================');

    const {
        pipeline_name,
        description
    } = req.body;

    console.log('Request body:', {
        pipeline_name,
        description
    });

    if (
        !pipeline_name ||
        typeof pipeline_name !== 'string' ||
        !pipeline_name.trim()
    ) {

        console.log('ERROR: Pipeline name is required');

        return res.status(400).json({
            success: false,
            error: 'Pipeline name is required'
        });
    }

    const pipeline_id = v4();

    console.log('Generated pipeline ID:', pipeline_id);

    /*
     * IMPORTANT:
     * Keep the existing hardcoded stage IDs.
     *
     * Do NOT replace these with v4().
     */
    const records = [
        [
            1,
            "Qualified",
            1,
            "Qualified",
            pipeline_id
        ],
        [
            2,
            "Content Made",
            2,
            "Content Made",
            pipeline_id
        ],
        [
            3,
            "Demo Scheduled",
            3,
            "Demo Scheduled",
            pipeline_id
        ],
        [
            4,
            "Proposal Made",
            4,
            "Proposal Made",
            pipeline_id
        ],
        [
            5,
            "Negotiations Started",
            5,
            "Negotiations Started",
            pipeline_id
        ]
    ];

    const pipelineQuery = `
        INSERT INTO pipelines
        (
            pipeline_name,
            description,
            pipeline_id
        )
        VALUES (?, ?, ?)
    `;

    const stageQuery = `
        INSERT INTO stages
        (
            stage_id,
            stage_name,
            stage_order,
            description,
            pipeline_id
        )
        VALUES ?
    `;

    let connection;

    try {

        console.log('STEP 1: Getting database connection');

        connection = await db.getConnection();

        console.log('STEP 2: Database connection acquired');

        await connection.beginTransaction();

        console.log('STEP 3: Transaction started');

        /* -----------------------------------------
           INSERT PIPELINE
           ----------------------------------------- */

        console.log('STEP 4: Inserting pipeline');

        const [pipelineResult] = await connection.query(
            pipelineQuery,
            [
                pipeline_name.trim(),
                description || null,
                pipeline_id
            ]
        );

        console.log(
            'Pipeline inserted:',
            pipelineResult
        );

        /* -----------------------------------------
           INSERT DEFAULT STAGES
           ----------------------------------------- */

        console.log('STEP 5: Inserting default stages');

        console.log('Default stage records:', records);

        const [stageResult] = await connection.query(
            stageQuery,
            [records]
        );

        console.log(
            'Stages inserted:',
            stageResult
        );

        /* -----------------------------------------
           COMMIT
           ----------------------------------------- */

        await connection.commit();

        console.log('STEP 6: Transaction committed');

        console.log('CREATE PIPELINE SUCCESS');

        return res.status(201).json({
            success: true,
            message: 'Pipeline created successfully',
            pipeline_id,
            stages: records
        });

    } catch (err) {

        console.error('\n========================================');
        console.error('CREATE PIPELINE ERROR');
        console.error('========================================');
        console.error('Message:', err.message);
        console.error('Code:', err.code);
        console.error('SQL State:', err.sqlState);
        console.error('SQL Message:', err.sqlMessage);
        console.error(err);

        if (connection) {

            try {

                await connection.rollback();

                console.log(
                    'Transaction rolled back successfully'
                );

            } catch (rollbackError) {

                console.error(
                    'Rollback error:',
                    rollbackError
                );
            }
        }

        return res.status(500).json({
            success: false,
            error: err.message
        });

    } finally {

        if (connection) {

            connection.release();

            console.log(
                'Database connection released'
            );
        }
    }
});


/* =========================================================
   UPDATE PIPELINE
   ========================================================= */

/**
 * @swagger
 * /pipelines/{id}:
 *   put:
 *     summary: Update a pipeline
 *     tags: [Pipelines]
 */
router.put('/pipelines/:id', async (req, res) => {

    const { id } = req.params;

    const {
        pipeline_name,
        description
    } = req.body;

    console.log('\n========================================');
    console.log('UPDATE PIPELINE');
    console.log('Pipeline ID:', id);
    console.log('========================================');

    console.log('Request body:', {
        pipeline_name,
        description
    });

    if (
        !pipeline_name ||
        typeof pipeline_name !== 'string' ||
        !pipeline_name.trim()
    ) {

        console.log(
            'ERROR: Pipeline name is required'
        );

        return res.status(400).json({
            success: false,
            error: 'Pipeline name is required'
        });
    }

    const query = `
        UPDATE pipelines
        SET
            pipeline_name = ?,
            description = ?
        WHERE pipeline_id = ?
    `;

    try {

        console.log('STEP 1: Updating pipeline');

        const [result] = await db.query(
            query,
            [
                pipeline_name.trim(),
                description || null,
                id
            ]
        );

        console.log(
            'Update result:',
            result
        );

        if (result.affectedRows === 0) {

            console.log(
                'ERROR: Pipeline not found'
            );

            return res.status(404).json({
                success: false,
                error: 'Pipeline not found'
            });
        }

        console.log(
            'UPDATE PIPELINE SUCCESS'
        );

        return res.json({
            success: true,
            message: 'Pipeline updated successfully'
        });

    } catch (err) {

        console.error(
            'UPDATE PIPELINE ERROR:',
            err
        );

        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
});


/* =========================================================
   DELETE PIPELINE
   ========================================================= */

/**
 * @swagger
 * /pipelines/{id}:
 *   delete:
 *     summary: Delete a pipeline
 *     tags: [Pipelines]
 */
router.delete('/pipelines/:id', async (req, res) => {

    const { id } = req.params;

    console.log('\n========================================');
    console.log('DELETE PIPELINE');
    console.log('Pipeline ID:', id);
    console.log('========================================');

    const query = `
        DELETE FROM pipelines
        WHERE pipeline_id = ?
    `;

    try {

        console.log('STEP 1: Deleting pipeline');

        const [result] = await db.query(
            query,
            [id]
        );

        console.log(
            'Delete result:',
            result
        );

        if (result.affectedRows === 0) {

            console.log(
                'ERROR: Pipeline not found'
            );

            return res.status(404).json({
                success: false,
                error: 'Pipeline not found'
            });
        }

        console.log(
            'DELETE PIPELINE SUCCESS'
        );

        return res.json({
            success: true,
            message: 'Pipeline deleted successfully'
        });

    } catch (err) {

        console.error('\n========================================');
        console.error('DELETE PIPELINE ERROR');
        console.error('========================================');
        console.error('Message:', err.message);
        console.error('Code:', err.code);
        console.error('SQL State:', err.sqlState);
        console.error('SQL Message:', err.sqlMessage);
        console.error(err);

        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
});


/* =========================================================
   GET ALL STAGES OF PIPELINE
   ========================================================= */

/**
 * @swagger
 * /pipelines/{pipelineId}/stages:
 *   get:
 *     summary: Get all stages for a pipeline
 *     tags: [Pipelines]
 */
router.get(
    '/pipelines/:pipelineId/stages',
    async (req, res) => {

        const { pipelineId } = req.params;

        console.log('\n========================================');
        console.log('GET PIPELINE STAGES');
        console.log('Pipeline ID:', pipelineId);
        console.log('========================================');

        const query = `
            SELECT
                s.stage_id,
                s.stage_name,
                s.stage_order,
                s.description,
                s.pipeline_id
            FROM stages s
            INNER JOIN pipelines p
                ON p.pipeline_id = s.pipeline_id
            WHERE p.pipeline_id = ?
            ORDER BY s.stage_order ASC
        `;

        try {

            console.log(
                'STEP 1: Fetching stages'
            );

            const [results] = await db.query(
                query,
                [pipelineId]
            );

            console.log(
                'Stages found:',
                results.length
            );

            return res.json(results);

        } catch (err) {

            console.error(
                'GET PIPELINE STAGES ERROR:',
                err
            );

            return res.status(500).json({
                success: false,
                error: err.message
            });
        }
    }
);


/* =========================================================
   CREATE STAGE
   ========================================================= */

/**
 * @swagger
 * /pipelines/{pipelineId}/stages:
 *   post:
 *     summary: Create a new stage
 *     tags: [Pipelines]
 */
router.post(
    '/pipelines/:pipelineId/stages',
    async (req, res) => {

        console.log('\n========================================');
        console.log('CREATE STAGE');
        console.log('========================================');

        const {
            pipelineId
        } = req.params;

        const {
            stage_name,
            stage_order,
            description
        } = req.body;

        console.log('STEP 1: Params/body parsed');

        console.log({
            pipelineId,
            stage_name,
            stage_order,
            description
        });

        /* -----------------------------------------
           VALIDATE STAGE NAME
           ----------------------------------------- */

        console.log(
            'STEP 2: Validating stage name'
        );

        if (
            !stage_name ||
            typeof stage_name !== 'string' ||
            !stage_name.trim()
        ) {

            console.log(
                'ERROR: Invalid stage name'
            );

            return res.status(400).json({
                success: false,
                error: 'Stage name is required'
            });
        }

        /* -----------------------------------------
           CHECK PIPELINE
           ----------------------------------------- */

        console.log(
            'STEP 3: Checking pipeline exists'
        );

        const pipelineCheckQuery = `
            SELECT pipeline_id
            FROM pipelines
            WHERE pipeline_id = ?
        `;

        let connection;

        try {

            const [pipelineResult] = await db.query(
                pipelineCheckQuery,
                [pipelineId]
            );

            console.log(
                'Pipeline check result:',
                pipelineResult
            );

            if (pipelineResult.length === 0) {

                console.log(
                    'ERROR: Pipeline not found'
                );

                return res.status(404).json({
                    success: false,
                    error: 'Pipeline not found'
                });
            }

            /* -----------------------------------------
               GET CURRENT STAGE COUNT
               ----------------------------------------- */

            console.log(
                'STEP 4: Getting stage count'
            );

            const countQuery = `
                SELECT COUNT(*) AS stage_count
                FROM stages
                WHERE pipeline_id = ?
            `;

            const [countResult] = await db.query(
                countQuery,
                [pipelineId]
            );

            const stageCount = Number(
                countResult[0].stage_count
            );

            console.log(
                'Current stage count:',
                stageCount
            );

            /* -----------------------------------------
               CALCULATE ORDER
               ----------------------------------------- */

            console.log(
                'STEP 5: Calculating stage order'
            );

            let finalOrder;

            if (
                stage_order === undefined ||
                stage_order === null ||
                stage_order === ''
            ) {

                finalOrder = stageCount + 1;

                console.log(
                    'No stage order supplied'
                );

                console.log(
                    'Adding stage at end:',
                    finalOrder
                );

            } else {

                finalOrder = Number(stage_order);

                console.log(
                    'Requested stage order:',
                    stage_order
                );

                if (
                    !Number.isInteger(finalOrder) ||
                    finalOrder < 1
                ) {

                    console.log(
                        'ERROR: Invalid stage order'
                    );

                    return res.status(400).json({
                        success: false,
                        error:
                            'stage_order must be a positive integer'
                    });
                }

                if (
                    finalOrder >
                    stageCount + 1
                ) {

                    console.log(
                        'Stage order too large'
                    );

                    console.log(
                        'Moving stage to end'
                    );

                    finalOrder =
                        stageCount + 1;
                }
            }

            console.log(
                'Final stage order:',
                finalOrder
            );

            /* -----------------------------------------
               SHIFT EXISTING STAGES
               ----------------------------------------- */

            console.log(
                'STEP 6: Shifting existing stages'
            );

            /*
             * If the stage is inserted in the middle,
             * existing stages are moved down.
             */
            if (finalOrder <= stageCount) {

                const shiftQuery = `
                    UPDATE stages
                    SET stage_order = stage_order + 1
                    WHERE pipeline_id = ?
                    AND stage_order >= ?
                `;

                const [shiftResult] = await db.query(
                    shiftQuery,
                    [
                        pipelineId,
                        finalOrder
                    ]
                );

                console.log(
                    'Stages shifted:',
                    shiftResult.affectedRows
                );
            }

            /* -----------------------------------------
               CREATE STAGE ID
               ----------------------------------------- */

            /*
             * IMPORTANT:
             *
             * KEEP THE EXISTING HARDCODED ID LOGIC.
             *
             * Default stages use:
             * 1, 2, 3, 4, 5
             *
             * New stages continue with the next number.
             *
             * DO NOT CHANGE THIS TO v4().
             */

            const stage_id = finalOrder;

            console.log(
                'Stage ID:',
                stage_id
            );

            /* -----------------------------------------
               INSERT STAGE
               ----------------------------------------- */

            console.log(
                'STEP 7: Inserting stage'
            );

            const insertQuery = `
                INSERT INTO stages
                (
                    stage_id,
                    stage_name,
                    stage_order,
                    description,
                    pipeline_id
                )
                VALUES (?, ?, ?, ?, ?)
            `;

            const insertValues = [
                stage_id,
                stage_name.trim(),
                finalOrder,
                description || null,
                pipelineId
            ];

            console.log(
                'Insert values:',
                insertValues
            );

            const [insertResult] = await db.query(
                insertQuery,
                insertValues
            );

            console.log(
                'Insert result:',
                insertResult
            );

            /* -----------------------------------------
               RESPONSE
               ----------------------------------------- */

            const createdStage = {
                stage_id,
                stage_name: stage_name.trim(),
                stage_order: finalOrder,
                description: description || null,
                pipeline_id: pipelineId,
                deals: []
            };

            console.log(
                'Created stage:',
                createdStage
            );

            console.log(
                'CREATE STAGE SUCCESS'
            );

            return res.status(201).json({
                success: true,
                message: 'Stage created successfully',
                stage: createdStage
            });

        } catch (err) {

            console.error('\n========================================');
            console.error('CREATE STAGE ERROR');
            console.error('========================================');
            console.error('Message:', err.message);
            console.error('Code:', err.code);
            console.error('SQL State:', err.sqlState);
            console.error('SQL Message:', err.sqlMessage);
            console.error(err);

            return res.status(500).json({
                success: false,
                error: 'Failed to create stage',
                message: err.message
            });
        }
    }
);


/* =========================================================
   UPDATE STAGE
   ========================================================= */

/**
 * @swagger
 * /pipelines/{pipelineId}/stages/{stageId}:
 *   put:
 *     summary: Update a stage
 *     tags: [Pipelines]
 */
router.put(
    '/pipelines/:pipelineId/stages/:stageId',
    async (req, res) => {

        const {
            pipelineId,
            stageId
        } = req.params;

        const {
            stage_name,
            description
        } = req.body;

        console.log('\n========================================');
        console.log('UPDATE STAGE');
        console.log('========================================');

        console.log({
            pipelineId,
            stageId,
            stage_name,
            description
        });

        if (
            !stage_name ||
            typeof stage_name !== 'string' ||
            !stage_name.trim()
        ) {

            console.log(
                'ERROR: Stage name is required'
            );

            return res.status(400).json({
                success: false,
                error: 'Stage name is required'
            });
        }

        /*
         * Stage order is intentionally NOT
         * changed here.
         *
         * Stage ordering is handled by
         * the reorder endpoint.
         */

        const query = `
            UPDATE stages
            SET
                stage_name = ?,
                description = ?
            WHERE stage_id = ?
            AND pipeline_id = ?
        `;

        try {

            console.log(
                'STEP 1: Updating stage'
            );

            const [result] = await db.query(
                query,
                [
                    stage_name.trim(),
                    description || null,
                    stageId,
                    pipelineId
                ]
            );

            console.log(
                'Update result:',
                result
            );

            if (result.affectedRows === 0) {

                console.log(
                    'ERROR: Stage not found in pipeline'
                );

                return res.status(404).json({
                    success: false,
                    error:
                        'Stage not found in this pipeline'
                });
            }

            console.log(
                'UPDATE STAGE SUCCESS'
            );

            return res.json({
                success: true,
                message: 'Stage updated successfully'
            });

        } catch (err) {

            console.error(
                'UPDATE STAGE ERROR:',
                err
            );

            return res.status(500).json({
                success: false,
                error: err.message
            });
        }
    }
);


/* =========================================================
   DELETE STAGE
   ========================================================= */

/**
 * @swagger
 * /pipelines/{pipelineId}/stages/{stageId}:
 *   delete:
 *     summary: Delete a stage
 *     tags: [Pipelines]
 */
router.delete(
    '/pipelines/:pipelineId/stages/:stageId',
    async (req, res) => {

        const {
            pipelineId,
            stageId
        } = req.params;

        console.log('\n========================================');
        console.log('DELETE STAGE');
        console.log('========================================');

        console.log({
            pipelineId,
            stageId
        });

        try {

            /* -----------------------------------------
               FIND STAGE
               ----------------------------------------- */

            console.log(
                'STEP 1: Finding stage'
            );

            const stageQuery = `
                SELECT
                    stage_id,
                    stage_order
                FROM stages
                WHERE stage_id = ?
                AND pipeline_id = ?
            `;

            const [stageResult] = await db.query(
                stageQuery,
                [
                    stageId,
                    pipelineId
                ]
            );

            console.log(
                'Stage result:',
                stageResult
            );

            if (stageResult.length === 0) {

                console.log(
                    'ERROR: Stage not found'
                );

                return res.status(404).json({
                    success: false,
                    error:
                        'Stage not found in this pipeline'
                });
            }

            const deletedOrder = Number(
                stageResult[0].stage_order
            );

            console.log(
                'Deleted stage order:',
                deletedOrder
            );

            /* -----------------------------------------
               CHECK DEALS
               ----------------------------------------- */

            console.log(
                'STEP 2: Checking assigned deals'
            );

            const checkDealsQuery = `
                SELECT
                    COUNT(*) AS deal_count
                FROM deals
                WHERE deal_stage = ?
                AND pipeline_id = ?
            `;

            const [dealResult] = await db.query(
                checkDealsQuery,
                [
                    stageId,
                    pipelineId
                ]
            );

            const dealCount = Number(
                dealResult[0].deal_count
            );

            console.log(
                'Assigned deals:',
                dealCount
            );

            if (dealCount > 0) {

                console.log(
                    'DELETE BLOCKED: Deals are assigned'
                );

                return res.status(409).json({
                    success: false,
                    error:
                        'Cannot delete this stage because deals are assigned to it.',
                    deal_count: dealCount
                });
            }

            /* -----------------------------------------
               DELETE STAGE
               ----------------------------------------- */

            console.log(
                'STEP 3: Deleting stage'
            );

            const deleteQuery = `
                DELETE FROM stages
                WHERE stage_id = ?
                AND pipeline_id = ?
            `;

            const [deleteResult] = await db.query(
                deleteQuery,
                [
                    stageId,
                    pipelineId
                ]
            );

            console.log(
                'Delete result:',
                deleteResult
            );

            if (deleteResult.affectedRows === 0) {

                return res.status(404).json({
                    success: false,
                    error: 'Stage not found'
                });
            }

            /* -----------------------------------------
               REORDER REMAINING STAGES
               ----------------------------------------- */

            console.log(
                'STEP 4: Reordering remaining stages'
            );

            const reorderQuery = `
                UPDATE stages
                SET stage_order = stage_order - 1
                WHERE pipeline_id = ?
                AND stage_order > ?
            `;

            const [reorderResult] = await db.query(
                reorderQuery,
                [
                    pipelineId,
                    deletedOrder
                ]
            );

            console.log(
                'Reordered stages:',
                reorderResult.affectedRows
            );

            console.log(
                'DELETE STAGE SUCCESS'
            );

            return res.json({
                success: true,
                message: 'Stage deleted successfully'
            });

        } catch (err) {

            console.error('\n========================================');
            console.error('DELETE STAGE ERROR');
            console.error('========================================');
            console.error('Message:', err.message);
            console.error('Code:', err.code);
            console.error('SQL State:', err.sqlState);
            console.error('SQL Message:', err.sqlMessage);
            console.error(err);

            return res.status(500).json({
                success: false,
                error: err.message
            });
        }
    }
);


/* =========================================================
   REORDER STAGES
   ========================================================= */

/**
 * @swagger
 * /pipelines/{pipelineId}/stages/reorder:
 *   put:
 *     summary: Reorder all stages in a pipeline
 *     tags: [Pipelines]
 */
router.put(
    '/pipelines/:pipelineId/stages/reorder',
    async (req, res) => {

        const {
            pipelineId
        } = req.params;

        const {
            stages
        } = req.body;

        console.log('\n========================================');
        console.log('REORDER STAGES');
        console.log('========================================');

        console.log(
            'Pipeline ID:',
            pipelineId
        );

        console.log(
            'Received stages:',
            stages
        );

        /* -----------------------------------------
           VALIDATE REQUEST
           ----------------------------------------- */

        if (
            !Array.isArray(stages) ||
            stages.length === 0
        ) {

            console.log(
                'ERROR: Invalid stages array'
            );

            return res.status(400).json({
                success: false,
                error:
                    'stages must be a non-empty array'
            });
        }

        const requestedStageIds =
            stages.map(
                (stage) =>
                    String(
                        stage?.stage_id || ''
                    )
            );

        if (
            requestedStageIds.some(
                (id) => !id
            )
        ) {

            return res.status(400).json({
                success: false,
                error:
                    'Every stage must contain a valid stage_id'
            });
        }

        /* -----------------------------------------
           CHECK DUPLICATES
           ----------------------------------------- */

        const uniqueStageIds =
            new Set(
                requestedStageIds
            );

        if (
            uniqueStageIds.size !==
            requestedStageIds.length
        ) {

            return res.status(400).json({
                success: false,
                error:
                    'Duplicate stage_id values are not allowed'
            });
        }

        let connection;

        try {

            /* -----------------------------------------
               GET CONNECTION
               ----------------------------------------- */

            console.log(
                'STEP 1: Getting database connection'
            );

            connection =
                await db.getConnection();

            console.log(
                'STEP 2: Starting transaction'
            );

            await connection.beginTransaction();

            /* -----------------------------------------
               CHECK PIPELINE
               ----------------------------------------- */

            console.log(
                'STEP 3: Checking pipeline'
            );

            const [
                pipelineResult
            ] = await connection.query(
                `
                    SELECT pipeline_id
                    FROM pipelines
                    WHERE pipeline_id = ?
                `,
                [pipelineId]
            );

            if (
                pipelineResult.length === 0
            ) {

                await connection.rollback();

                return res.status(404).json({
                    success: false,
                    error: 'Pipeline not found'
                });
            }

            /* -----------------------------------------
               GET EXISTING STAGES
               ----------------------------------------- */

            console.log(
                'STEP 4: Getting existing stages'
            );

            const [
                existingStages
            ] = await connection.query(
                `
                    SELECT
                        stage_id,
                        stage_order
                    FROM stages
                    WHERE pipeline_id = ?
                    ORDER BY stage_order ASC
                `,
                [pipelineId]
            );

            console.log(
                'Existing stages:',
                existingStages
            );

            /* -----------------------------------------
               CHECK STAGE COUNT
               ----------------------------------------- */

            if (
                existingStages.length !==
                stages.length
            ) {

                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    error:
                        'Reorder request must contain every stage in the pipeline'
                });
            }

            /* -----------------------------------------
               CHECK STAGE IDs
               ----------------------------------------- */

            const existingStageIds =
                existingStages
                    .map(
                        (stage) =>
                            String(
                                stage.stage_id
                            )
                    )
                    .sort();

            const requestedIdsSorted =
                [...requestedStageIds]
                    .sort();

            const sameStages =
                existingStageIds.length ===
                    requestedIdsSorted.length &&
                existingStageIds.every(
                    (id, index) =>
                        id ===
                        requestedIdsSorted[index]
                );

            if (!sameStages) {

                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    error:
                        'One or more stages do not belong to this pipeline'
                });
            }

            /* -----------------------------------------
               TEMPORARY NEGATIVE ORDERS
               ----------------------------------------- */

            console.log(
                'STEP 5: Applying temporary stage orders'
            );

            for (
                let index = 0;
                index < requestedStageIds.length;
                index++
            ) {

                await connection.query(
                    `
                        UPDATE stages
                        SET stage_order = ?
                        WHERE stage_id = ?
                        AND pipeline_id = ?
                    `,
                    [
                        -(index + 1),
                        requestedStageIds[index],
                        pipelineId
                    ]
                );
            }

            /* -----------------------------------------
               FINAL ORDERS
               ----------------------------------------- */

            console.log(
                'STEP 6: Applying final stage orders'
            );

            for (
                let index = 0;
                index < requestedStageIds.length;
                index++
            ) {

                await connection.query(
                    `
                        UPDATE stages
                        SET stage_order = ?
                        WHERE stage_id = ?
                        AND pipeline_id = ?
                    `,
                    [
                        index + 1,
                        requestedStageIds[index],
                        pipelineId
                    ]
                );
            }

            /* -----------------------------------------
               COMMIT
               ----------------------------------------- */

            await connection.commit();

            console.log(
                'STEP 7: Transaction committed'
            );

            console.log(
                'REORDER STAGES SUCCESS'
            );

            return res.json({
                success: true,
                message:
                    'Stages reordered successfully',
                stages:
                    requestedStageIds.map(
                        (
                            stage_id,
                            index
                        ) => ({
                            stage_id,
                            stage_order:
                                index + 1
                        })
                    )
            });

        } catch (err) {

            console.error('\n========================================');
            console.error('REORDER STAGES ERROR');
            console.error('========================================');
            console.error('Message:', err.message);
            console.error('Code:', err.code);
            console.error('SQL State:', err.sqlState);
            console.error('SQL Message:', err.sqlMessage);
            console.error(err);

            if (connection) {

                try {

                    await connection.rollback();

                    console.log(
                        'Transaction rolled back'
                    );

                } catch (rollbackError) {

                    console.error(
                        'Rollback error:',
                        rollbackError
                    );
                }
            }

            return res.status(500).json({
                success: false,
                error: err.message
            });

        } finally {

            if (connection) {

                connection.release();

                console.log(
                    'Database connection released'
                );
            }
        }
    }
);


/* =========================================================
   UPDATE DEAL STAGE
   ========================================================= */

/**
 * @swagger
 * /deals/{dealId}/stage:
 *   put:
 *     summary: Move a deal to another stage
 *     tags: [Pipelines]
 */
router.put(
    '/deals/:dealId/stage',
    async (req, res) => {

        const {
            dealId
        } = req.params;

        const {
            deal_stage
        } = req.body;

        console.log('\n========================================');
        console.log('UPDATE DEAL STAGE');
        console.log('========================================');

        console.log({
            dealId,
            deal_stage
        });

        /* -----------------------------------------
           VALIDATE STAGE
           ----------------------------------------- */

        if (
            deal_stage === undefined ||
            deal_stage === null ||
            deal_stage === ''
        ) {

            console.log(
                'ERROR: deal_stage is required'
            );

            return res.status(400).json({
                success: false,
                error: 'deal_stage is required'
            });
        }

        try {

            /* -----------------------------------------
               GET DEAL
               ----------------------------------------- */

            console.log(
                'STEP 1: Finding deal'
            );

            const dealQuery = `
                SELECT
                    deal_id,
                    pipeline_id,
                    deal_stage
                FROM deals
                WHERE deal_id = ?
            `;

            const [dealResult] = await db.query(
                dealQuery,
                [dealId]
            );

            console.log(
                'Deal result:',
                dealResult
            );

            if (
                dealResult.length === 0
            ) {

                console.log(
                    'ERROR: Deal not found'
                );

                return res.status(404).json({
                    success: false,
                    error: 'Deal not found'
                });
            }

            const deal =
                dealResult[0];

            console.log(
                'Deal pipeline:',
                deal.pipeline_id
            );

            /* -----------------------------------------
               VERIFY TARGET STAGE
               ----------------------------------------- */

            console.log(
                'STEP 2: Checking target stage'
            );

            const stageQuery = `
                SELECT
                    stage_id,
                    stage_name,
                    pipeline_id
                FROM stages
                WHERE stage_id = ?
                AND pipeline_id = ?
            `;

            const [stageResult] = await db.query(
                stageQuery,
                [
                    deal_stage,
                    deal.pipeline_id
                ]
            );

            console.log(
                'Target stage result:',
                stageResult
            );

            if (
                stageResult.length === 0
            ) {

                console.log(
                    'ERROR: Target stage does not belong to deal pipeline'
                );

                return res.status(400).json({
                    success: false,
                    error:
                        'Target stage does not belong to the deal pipeline'
                });
            }

            /* -----------------------------------------
               UPDATE DEAL
               ----------------------------------------- */

            console.log(
                'STEP 3: Updating deal stage'
            );

            const updateQuery = `
                UPDATE deals
                SET
                    deal_stage = ?,
                    last_updated =
                        CURRENT_TIMESTAMP
                WHERE deal_id = ?
            `;

            const [result] = await db.query(
                updateQuery,
                [
                    deal_stage,
                    dealId
                ]
            );

            console.log(
                'Update result:',
                result
            );

            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({
                    success: false,
                    error: 'Deal not found'
                });
            }

            console.log(
                'UPDATE DEAL STAGE SUCCESS'
            );

            return res.json({
                success: true,
                message:
                    'Deal stage updated successfully',
                deal_id: dealId,
                deal_stage
            });

        } catch (err) {

            console.error('\n========================================');
            console.error('UPDATE DEAL STAGE ERROR');
            console.error('========================================');
            console.error('Message:', err.message);
            console.error('Code:', err.code);
            console.error('SQL State:', err.sqlState);
            console.error('SQL Message:', err.sqlMessage);
            console.error(err);

            return res.status(500).json({
                success: false,
                error: err.message
            });
        }
    }
);


/* =========================================================
   EXPORT ROUTER
   ========================================================= */

module.exports = router;

