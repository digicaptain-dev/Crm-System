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
            AND (CAST(s.stage_id AS CHAR) = CAST(d.deal_stage AS CHAR) OR LOWER(s.stage_name) = LOWER(d.deal_stage))

        ORDER BY
            p.created_at DESC,
            s.stage_order ASC
    `;

    try {
        const [results] = await db.query(query);

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
        console.error(
            "Fetch pipelines error:",
            err
        );

        return res.status(500).json({
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
router.get('/pipelines/:id', (req, res) => {
    const { id } = req.params;

    const query = `
        SELECT *
        FROM pipelines
        WHERE pipeline_id = ?
    `;

    db.query(
        query,
        [id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (result.length === 0) {
                return res.status(404).json({
                    error: 'Pipeline not found'
                });
            }

            return res.json(result[0]);
        }
    );
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
router.post('/pipelines', (req, res) => {
    const {
        pipeline_name,
        description
    } = req.body;

    if (
        !pipeline_name ||
        !pipeline_name.trim()
    ) {
        return res.status(400).json({
            error:
                'Pipeline name is required'
        });
    }

    const pipeline_id = v4();

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

    /*
     * Keep the existing default stage IDs.
     * They are scoped by pipeline_id.
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

    db.query(
        pipelineQuery,
        [
            pipeline_name.trim(),
            description || null,
            pipeline_id
        ],
        (err) => {
            if (err) {
                console.error(
                    "Create pipeline error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            db.query(
                stageQuery,
                [records],
                (err) => {
                    if (err) {
                        console.error(
                            "Create default stages error:",
                            err
                        );

                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    return res.status(201).json({
                        message:
                            'Pipeline created successfully',
                        pipeline_id,
                        stages: records
                    });
                }
            );
        }
    );
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
router.put('/pipelines/:id', (req, res) => {
    const { id } = req.params;

    const {
        pipeline_name,
        description
    } = req.body;

    if (
        !pipeline_name ||
        !pipeline_name.trim()
    ) {
        return res.status(400).json({
            error:
                'Pipeline name is required'
        });
    }

    const query = `
        UPDATE pipelines
        SET
            pipeline_name = ?,
            description = ?
        WHERE pipeline_id = ?
    `;

    db.query(
        query,
        [
            pipeline_name.trim(),
            description || null,
            id
        ],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error:
                        'Pipeline not found'
                });
            }

            return res.json({
                message:
                    'Pipeline updated successfully'
            });
        }
    );
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
router.delete('/pipelines/:id', (req, res) => {
    const { id } = req.params;

    const query = `
        DELETE FROM pipelines
        WHERE pipeline_id = ?
    `;

    db.query(
        query,
        [id],
        (err, result) => {
            if (err) {
                console.error(
                    "Delete pipeline error:",
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error:
                        'Pipeline not found'
                });
            }

            return res.json({
                message:
                    'Pipeline deleted successfully'
            });
        }
    );
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
    (req, res) => {
        const {
            pipelineId
        } = req.params;

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

        db.query(
            query,
            [pipelineId],
            (err, results) => {
                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                return res.json(results);
            }
        );
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
    (req, res) => {
        const {
            pipelineId
        } = req.params;

        const {
            stage_name,
            stage_order,
            description
        } = req.body;

        if (
            !stage_name ||
            !stage_name.trim()
        ) {
            return res.status(400).json({
                error:
                    'Stage name is required'
            });
        }

        /*
         * Check pipeline exists.
         */
        const pipelineCheck = `
            SELECT pipeline_id
            FROM pipelines
            WHERE pipeline_id = ?
        `;

        db.query(
            pipelineCheck,
            [pipelineId],
            (err, pipelineResult) => {
                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                if (
                    pipelineResult.length === 0
                ) {
                    return res.status(404).json({
                        error:
                            'Pipeline not found'
                    });
                }

                /*
                 * Get current stage count.
                 */
                const countQuery = `
                    SELECT
                        COUNT(*) AS stage_count
                    FROM stages
                    WHERE pipeline_id = ?
                `;

                db.query(
                    countQuery,
                    [pipelineId],
                    (err, countResult) => {
                        if (err) {
                            return res.status(500).json({
                                error:
                                    err.message
                            });
                        }

                        const stageCount =
                            Number(
                                countResult[0]
                                    .stage_count
                            );

                        let finalOrder;

                        /*
                         * If no order is supplied,
                         * add stage at the end.
                         */
                        if (
                            stage_order ===
                                undefined ||
                            stage_order ===
                                null ||
                            stage_order === ""
                        ) {
                            finalOrder =
                                stageCount + 1;
                        } else {
                            finalOrder =
                                Number(
                                    stage_order
                                );

                            if (
                                !Number.isInteger(
                                    finalOrder
                                ) ||
                                finalOrder < 1
                            ) {
                                return res
                                    .status(
                                        400
                                    )
                                    .json({
                                        error:
                                            'stage_order must be a positive integer'
                                    });
                            }

                            /*
                             * If order is greater than
                             * current count + 1, put it
                             * at the end.
                             */
                            if (
                                finalOrder >
                                stageCount + 1
                            ) {
                                finalOrder =
                                    stageCount + 1;
                            }
                        }

                        /*
                         * Shift existing stages when
                         * inserting in the middle.
                         *
                         * Example:
                         *
                         * 1 Lead
                         * 2 Contacted
                         * 3 Proposal
                         *
                         * New stage at 2:
                         *
                         * 1 Lead
                         * 2 New Stage
                         * 3 Contacted
                         * 4 Proposal
                         */
                        const shiftQuery = `
                            UPDATE stages
                            SET stage_order =
                                stage_order + 1
                            WHERE pipeline_id = ?
                            AND stage_order >= ?
                        `;

                        db.query(
                            shiftQuery,
                            [
                                pipelineId,
                                finalOrder
                            ],
                            (err) => {
                                if (err) {
                                    return res
                                        .status(
                                            500
                                        )
                                        .json({
                                            error:
                                                err.message
                                        });
                                }

                                /*
                                 * Generate stage ID.
                                 */
                                const stage_id =
                                    v4();

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

                                db.query(
                                    insertQuery,
                                    [
                                        stage_id,
                                        stage_name.trim(),
                                        finalOrder,
                                        description ||
                                            null,
                                        pipelineId
                                    ],
                                    (err) => {
                                        if (
                                            err
                                        ) {
                                            return res
                                                .status(
                                                    500
                                                )
                                                .json({
                                                    error:
                                                        err.message
                                                });
                                        }

                                        return res
                                            .status(
                                                201
                                            )
                                            .json({
                                                message:
                                                    'Stage created successfully',
                                                stage: {
                                                    stage_id,
                                                    stage_name:
                                                        stage_name.trim(),
                                                    stage_order:
                                                        finalOrder,
                                                    description:
                                                        description ||
                                                        null,
                                                    pipeline_id:
                                                        pipelineId,
                                                    deals: []
                                                }
                                            });
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
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
    (req, res) => {
        const {
            pipelineId,
            stageId
        } = req.params;

        const {
            stage_name,
            description
        } = req.body;

        if (
            !stage_name ||
            !stage_name.trim()
        ) {
            return res.status(400).json({
                error:
                    'Stage name is required'
            });
        }

        /*
         * Stage order is intentionally NOT
         * changed here.
         *
         * Stage ordering is handled by the
         * reorder endpoint.
         */
        const query = `
            UPDATE stages
            SET
                stage_name = ?,
                description = ?
            WHERE stage_id = ?
            AND pipeline_id = ?
        `;

        db.query(
            query,
            [
                stage_name.trim(),
                description || null,
                stageId,
                pipelineId
            ],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                if (
                    result.affectedRows === 0
                ) {
                    return res.status(404).json({
                        error:
                            'Stage not found in this pipeline'
                    });
                }

                return res.json({
                    message:
                        'Stage updated successfully'
                });
            }
        );
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
    (req, res) => {
        const {
            pipelineId,
            stageId
        } = req.params;

        /*
         * First check that stage belongs
         * to this pipeline and get its order.
         */
        const stageQuery = `
            SELECT
                stage_id,
                stage_order
            FROM stages
            WHERE stage_id = ?
            AND pipeline_id = ?
        `;

        db.query(
            stageQuery,
            [
                stageId,
                pipelineId
            ],
            (err, stageResult) => {
                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                if (
                    stageResult.length === 0
                ) {
                    return res.status(404).json({
                        error:
                            'Stage not found in this pipeline'
                    });
                }

                const deletedOrder =
                    Number(
                        stageResult[0]
                            .stage_order
                    );

                /*
                 * Check whether deals are
                 * assigned to this stage.
                 *
                 * IMPORTANT:
                 * pipeline_id is also checked so
                 * another pipeline can never
                 * block this stage.
                 */
                const checkDealsQuery = `
                    SELECT
                        COUNT(*) AS deal_count
                    FROM deals
                    WHERE deal_stage = ?
                    AND pipeline_id = ?
                `;

                db.query(
                    checkDealsQuery,
                    [
                        stageId,
                        pipelineId
                    ],
                    (err, dealResult) => {
                        if (err) {
                            return res
                                .status(
                                    500
                                )
                                .json({
                                    error:
                                        err.message
                                });
                        }

                        const dealCount =
                            Number(
                                dealResult[0]
                                    .deal_count
                            );

                        /*
                         * Do not allow deletion
                         * if deals are using it.
                         */
                        if (
                            dealCount > 0
                        ) {
                            return res.status(
                                409
                            ).json({
                                error:
                                    'Cannot delete this stage because deals are assigned to it.',
                                deal_count:
                                    dealCount
                            });
                        }

                        /*
                         * Delete stage.
                         */
                        const deleteQuery = `
                            DELETE FROM stages
                            WHERE stage_id = ?
                            AND pipeline_id = ?
                        `;

                        db.query(
                            deleteQuery,
                            [
                                stageId,
                                pipelineId
                            ],
                            (err, result) => {
                                if (
                                    err
                                ) {
                                    return res
                                        .status(
                                            500
                                        )
                                        .json({
                                            error:
                                                err.message
                                        });
                                }

                                if (
                                    result.affectedRows ===
                                    0
                                ) {
                                    return res
                                        .status(
                                            404
                                        )
                                        .json({
                                            error:
                                                'Stage not found'
                                        });
                                }

                                /*
                                 * Close the stage
                                 * order gap.
                                 *
                                 * Example:
                                 *
                                 * 1 Lead
                                 * 2 Contacted
                                 * 3 Proposal
                                 *
                                 * Delete 2:
                                 *
                                 * 1 Lead
                                 * 2 Proposal
                                 */
                                const reorderAfterDeleteQuery = `
                                    UPDATE stages
                                    SET stage_order =
                                        stage_order - 1
                                    WHERE pipeline_id = ?
                                    AND stage_order > ?
                                `;

                                db.query(
                                    reorderAfterDeleteQuery,
                                    [
                                        pipelineId,
                                        deletedOrder
                                    ],
                                    (err) => {
                                        if (
                                            err
                                        ) {
                                            return res
                                                .status(
                                                    500
                                                )
                                                .json({
                                                    error:
                                                        err.message
                                                });
                                        }

                                        return res
                                            .json({
                                                message:
                                                    'Stage deleted successfully'
                                            });
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
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

        /*
         * Validate request.
         */
        if (
            !Array.isArray(stages) ||
            stages.length === 0
        ) {
            return res.status(400).json({
                error:
                    'stages must be a non-empty array'
            });
        }

        /*
         * Validate that every item contains
         * a stage_id.
         */
        const requestedStageIds =
            stages.map(
                (stage) =>
                    String(
                        stage?.stage_id ||
                            ""
                    )
            );

        if (
            requestedStageIds.some(
                (id) => !id
            )
        ) {
            return res.status(400).json({
                error:
                    'Every stage must contain a valid stage_id'
            });
        }

        /*
         * Duplicate stage IDs are not allowed.
         */
        const uniqueStageIds =
            new Set(
                requestedStageIds
            );

        if (
            uniqueStageIds.size !==
            requestedStageIds.length
        ) {
            return res.status(400).json({
                error:
                    'Duplicate stage_id values are not allowed'
            });
        }

        /*
         * Get a database connection so the
         * entire reorder can happen in one
         * transaction.
         */
        let connection;

        try {
            connection =
                await db.getConnection();

            await connection.beginTransaction();

            /*
             * Verify pipeline exists.
             */
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
                    error:
                        'Pipeline not found'
                });
            }

            /*
             * Get all existing stages
             * belonging to this pipeline.
             */
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

            /*
             * Reorder request must contain
             * EVERY stage of this pipeline.
             */
            if (
                existingStages.length !==
                stages.length
            ) {
                await connection.rollback();

                return res.status(400).json({
                    error:
                        'Reorder request must contain every stage in the pipeline'
                });
            }

            const existingStageIds =
                existingStages
                    .map((stage) =>
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
                        requestedIdsSorted[
                            index
                        ]
                );

            if (!sameStages) {
                await connection.rollback();

                return res.status(400).json({
                    error:
                        'One or more stages do not belong to this pipeline'
                });
            }

            /*
             * -------------------------------------------------
             * STEP 1
             *
             * Temporarily use negative stage_order values.
             *
             * This prevents duplicate/unique-order conflicts
             * while changing the order.
             *
             * Example:
             *
             * -1, -2, -3, -4, -5
             * -------------------------------------------------
             */

            for (
                let index = 0;
                index <
                requestedStageIds.length;
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
                        requestedStageIds[
                            index
                        ],
                        pipelineId
                    ]
                );
            }

            /*
             * -------------------------------------------------
             * STEP 2
             *
             * Permanently assign:
             *
             * 1
             * 2
             * 3
             * 4
             * ...
             * -------------------------------------------------
             */

            for (
                let index = 0;
                index <
                requestedStageIds.length;
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
                        requestedStageIds[
                            index
                        ],
                        pipelineId
                    ]
                );
            }

            /*
             * Commit all changes.
             */
            await connection.commit();

            return res.json({
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
            console.error(
                "Reorder stages error:",
                err
            );

            /*
             * Rollback if transaction
             * was started.
             */
            if (connection) {
                try {
                    await connection.rollback();
                } catch (
                    rollbackError
                ) {
                    console.error(
                        "Rollback error:",
                        rollbackError
                    );
                }
            }

            return res.status(500).json({
                error: err.message
            });

        } finally {
            /*
             * Always release connection.
             */
            if (connection) {
                connection.release();
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
    (req, res) => {
        const {
            dealId
        } = req.params;

        const {
            deal_stage
        } = req.body;

        if (
            deal_stage ===
                undefined ||
            deal_stage === null ||
            deal_stage === ''
        ) {
            return res.status(400).json({
                error:
                    'deal_stage is required'
            });
        }

        /*
         * First find the deal.
         */
        const dealQuery = `
            SELECT
                deal_id,
                pipeline_id,
                deal_stage
            FROM deals
            WHERE deal_id = ?
        `;

        db.query(
            dealQuery,
            [dealId],
            (err, dealResult) => {
                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                if (
                    dealResult.length ===
                    0
                ) {
                    return res.status(404).json({
                        error:
                            'Deal not found'
                    });
                }

                const deal =
                    dealResult[0];

                /*
                 * Verify target stage belongs
                 * to the same pipeline.
                 */
                const stageQuery = `
                    SELECT
                        stage_id,
                        stage_name,
                        pipeline_id
                    FROM stages
                    WHERE stage_id = ?
                    AND pipeline_id = ?
                `;

                db.query(
                    stageQuery,
                    [
                        deal_stage,
                        deal.pipeline_id
                    ],
                    (err, stageResult) => {
                        if (err) {
                            return res
                                .status(
                                    500
                                )
                                .json({
                                    error:
                                        err.message
                                });
                        }

                        if (
                            stageResult.length ===
                            0
                        ) {
                            return res
                                .status(
                                    400
                                )
                                .json({
                                    error:
                                        'Target stage does not belong to the deal pipeline'
                                });
                        }

                        /*
                         * Update deal stage.
                         */
                        const updateQuery = `
                            UPDATE deals
                            SET
                                deal_stage = ?,
                                last_updated =
                                    CURRENT_TIMESTAMP
                            WHERE deal_id = ?
                        `;

                        db.query(
                            updateQuery,
                            [
                                deal_stage,
                                dealId
                            ],
                            (
                                err,
                                result
                            ) => {
                                if (
                                    err
                                ) {
                                    return res
                                        .status(
                                            500
                                        )
                                        .json({
                                            error:
                                                err.message
                                        });
                                }

                                if (
                                    result.affectedRows ===
                                    0
                                ) {
                                    return res
                                        .status(
                                            404
                                        )
                                        .json({
                                            error:
                                                'Deal not found'
                                        });
                                }

                                return res.json({
                                    message:
                                        'Deal stage updated successfully',
                                    deal_id:
                                        dealId,
                                    deal_stage:
                                        deal_stage
                                });
                            }
                        );
                    }
                );
            }
        );
    }
);


module.exports = router;




































































// const express = require('express');
// const router = express.Router();
// const db = require('../db');
// const { v4 } = require('uuid');

// /**
//  * @swagger
//  * tags:
//  *   name: Pipelines
//  *   description: Pipeline and pipeline-stage management
//  */

// // Get all pipelines
// /**
//  * @swagger
//  * /pipelines:
//  *   get:
//  *     summary: Get all pipelines with their stages and deals
//  *     tags: [Pipelines]
//  *     responses:
//  *       200:
//  *         description: A list of pipelines
//  *       500:
//  *         description: Server error
//  */
// router.get('/pipelines', async (req, res) => {

//     const query = `
//         SELECT 
//             p.pipeline_id,
//             p.pipeline_name,
//             p.description,
//             p.created_at,

//             s.stage_id,
//             s.stage_name,
//             s.stage_order,
//             s.description AS stage_description,

//             d.deal_id,
//             d.deal_name,
//             d.deal_value,
//             d.deal_stage,
//             d.deal_owner,
//             d.customer_email,
//             d.close_date,
//             d.deal_priority,
//             d.deal_status,
//             d.pipeline_id AS deal_pipeline_id

//         FROM pipelines p

//         LEFT JOIN stages s
//             ON p.pipeline_id = s.pipeline_id

//         LEFT JOIN deals d
//             ON s.pipeline_id = d.pipeline_id
//             AND s.stage_id = d.deal_stage

//         ORDER BY
//             p.created_at DESC,
//             s.stage_order ASC
//     `;

//     try {

//         const [results] = await db.query(query);

//         const pipelines = [];

//         results.forEach((row) => {

//             let pipeline = pipelines.find(
//                 (item) => item.pipeline_id === row.pipeline_id
//             );

//             // Create pipeline
//             if (!pipeline) {

//                 pipeline = {
//                     pipeline_id: row.pipeline_id,
//                     pipeline_name: row.pipeline_name,
//                     description: row.description,
//                     created_at: row.created_at,
//                     stages: []
//                 };

//                 pipelines.push(pipeline);
//             }

//             // Find stage
//             let stage = pipeline.stages.find(
//                 (item) => item.stage_id === row.stage_id
//             );

//             // Create stage
//             if (!stage && row.stage_id) {

//                 stage = {
//                     stage_id: row.stage_id,
//                     stage_name: row.stage_name,
//                     stage_order: row.stage_order,
//                     description: row.stage_description,
//                     deals: []
//                 };

//                 pipeline.stages.push(stage);
//             }

//             // Add deal to stage
//             if (stage && row.deal_id) {

//                 stage.deals.push({
//                     deal_id: row.deal_id,
//                     deal_name: row.deal_name,
//                     deal_value: row.deal_value,
//                     deal_stage: row.deal_stage,
//                     deal_owner: row.deal_owner,
//                     customer_email: row.customer_email,
//                     close_date: row.close_date,
//                     deal_priority: row.deal_priority,
//                     deal_status: row.deal_status
//                 });
//             }
//         });

//         return res.json(pipelines);

//     } catch (err) {

//         console.error("Fetch pipelines error:", err);

//         return res.status(500).json({
//             error: err.message
//         });
//     }
// });



// // Get a specific pipeline by ID
// /**
//  * @swagger
//  * /pipelines/{id}:
//  *   get:
//  *     summary: Get one pipeline
//  *     tags: [Pipelines]
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Pipeline ID
//  *     responses:
//  *       200:
//  *         description: Pipeline details
//  *       404:
//  *         description: Pipeline not found
//  *       500:
//  *         description: Server error
//  */
// router.get('/pipelines/:id', (req, res) => {
//     const { id } = req.params;
//     const query = 'SELECT * FROM pipelines WHERE pipeline_id = ?';

//     db.query(query, [id], (err, result) => {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }
//         if (result.length === 0) {
//             return res.status(404).json({ error: 'Pipeline not found' });
//         }
//         res.json(result[0]);
//     });
// });

// // Create a new pipeline
// /**
//  * @swagger
//  * /pipelines:
//  *   post:
//  *     summary: Create a pipeline with five default stages
//  *     tags: [Pipelines]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required: [pipeline_name]
//  *             properties:
//  *               pipeline_name:
//  *                 type: string
//  *                 example: Sales pipeline
//  *               description:
//  *                 type: string
//  *                 example: Pipeline for new sales opportunities
//  *     responses:
//  *       201:
//  *         description: Pipeline created
//  *       500:
//  *         description: Server error
//  */
// router.post('/pipelines', (req, res) => {
//     const { pipeline_name, description } = req.body;
//     var pipeline_id = v4();

//     const query = 'INSERT INTO pipelines (pipeline_name, description, pipeline_id) VALUES (?, ?, ?)';

//     const query_pre = 'INSERT INTO stages (stage_id, stage_name, stage_order, description, pipeline_id) VALUES ?';

//     const records = [
//         [1, "Qualified", 1, "Qualified", pipeline_id],
//         [2, "Content Made", 2, "Content Made", pipeline_id],
//         [3, "Demo Scheduled", 3, "Demo Scheduled", pipeline_id],
//         [4, "Proposal Made", 4, "Proposal Made", pipeline_id],
//         [5, "Negotiations Started", 5, "Negotiations Started", pipeline_id]
//     ];

//     // First create pipeline
//     db.query(query, [pipeline_name, description, pipeline_id], (err, result) => {

//         if (err) {
//             return res.status(500).json({
//                 error: err.message
//             });
//         }

//         // Then create stages
//         db.query(query_pre, [records], (err, result) => {

//             if (err) {
//                 return res.status(500).json({
//                     on: "1",
//                     error: err.message
//                 });
//             }

//             res.status(201).json({
//                 message: 'Pipeline created successfully',
//                 pipeline_id: pipeline_id,
//                 stages: records
//             });
//         });
//     });
// });

// // Update a pipeline by ID
// /**
//  * @swagger
//  * /pipelines/{id}:
//  *   put:
//  *     summary: Update a pipeline
//  *     tags: [Pipelines]
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Pipeline ID
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required: [pipeline_name]
//  *             properties:
//  *               pipeline_name:
//  *                 type: string
//  *                 example: Updated sales pipeline
//  *               description:
//  *                 type: string
//  *                 example: Updated pipeline description
//  *     responses:
//  *       200:
//  *         description: Pipeline updated
//  *       404:
//  *         description: Pipeline not found
//  *       500:
//  *         description: Server error
//  */
// router.put('/pipelines/:id', (req, res) => {
//     const { id } = req.params;
//     const { pipeline_name, description } = req.body;
//     const query = 'UPDATE pipelines SET pipeline_name = ?, description = ? WHERE pipeline_id = ?';

//     db.query(query, [pipeline_name, description, id], (err, result) => {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ error: 'Pipeline not found' });
//         }
//         res.json({ message: 'Pipeline updated successfully' });
//     });
// });

// // Delete a pipeline by ID
// /**
//  * @swagger
//  * /pipelines/{id}:
//  *   delete:
//  *     summary: Delete a pipeline
//  *     tags: [Pipelines]
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Pipeline ID
//  *     responses:
//  *       200:
//  *         description: Pipeline deleted
//  *       404:
//  *         description: Pipeline not found
//  *       500:
//  *         description: Server error
//  */
// router.delete('/pipelines/:id', (req, res) => {
//     const { id } = req.params;
//     const query = 'DELETE FROM pipelines WHERE pipeline_id = ?';

//     db.query(query, [id], (err, result) => {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ error: 'Pipeline not found' });
//         }
//         res.json({ message: 'Pipeline deleted successfully' });
//     });
// });

// // Get all stages for a specific pipeline
// /**
//  * @swagger
//  * /pipelines/{pipelineId}/stages:
//  *   get:
//  *     summary: Get all stages in a pipeline
//  *     tags: [Pipelines]
//  *     parameters:
//  *       - in: path
//  *         name: pipelineId
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Pipeline ID
//  *     responses:
//  *       200:
//  *         description: Pipeline stages ordered by stage order
//  *       500:
//  *         description: Server error
//  */
// router.get('/pipelines/:pipelineId/stages', (req, res) => {
//     const { pipelineId } = req.params;
//     const query = `
//     SELECT s.stage_name, s.stage_order, s.description
//     FROM stages s
//     JOIN pipelines p ON p.pipeline_id = s.pipeline_id
//     WHERE p.pipeline_id = ?
//     ORDER BY s.stage_order;
//   `;

//     db.query(query, [pipelineId], (err, results) => {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }
//         res.json(results);
//     });
// });

// module.exports = router;
