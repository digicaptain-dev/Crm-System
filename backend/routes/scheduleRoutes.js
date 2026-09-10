const express = require("express");
const router = express.Router();

const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const { notifyUser, notifyAdmins } = require("../utils/notificationService");

/*
|--------------------------------------------------------------------------
| GET ALL SCHEDULED ACTIVITIES
|--------------------------------------------------------------------------
*/
router.get("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const userRole = req.user.role;

        let sql = `
            SELECT
                s.id,
                s.deal_id,
                s.user_id,
                s.title,
                s.activity_type,
                s.description,
                s.start_time,
                s.end_time,
                s.status,
                s.created_at,

                d.deal_name,

                u.name AS user_name,
                u.email AS user_email

            FROM schedules s

            INNER JOIN deals d
                ON s.deal_id = d.deal_id

            LEFT JOIN users u
                ON s.user_id = u.user_id
        `;

        const params = [];

        if (userRole !== "admin") {
            sql += `
                WHERE d.assign_to = ?
            `;

            params.push(userId);
        }

        sql += `
            ORDER BY s.start_time ASC
            LIMIT 100
        `;

        const [rows] = await db.query(sql, params);

        return res.json({
            success: true,
            schedules: rows
        });

    } catch (error) {
        console.error("GET ALL SCHEDULES ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch scheduled activities"
        });
    }
});


/*
|--------------------------------------------------------------------------
| GET SCHEDULES FOR DEAL
|--------------------------------------------------------------------------
*/
router.get("/:dealId", authMiddleware, async (req, res) => {
    try {
        const { dealId } = req.params;

        const userId = req.user.user_id;
        const userRole = req.user.role;

        let sql = `
            SELECT
                s.id,
                s.deal_id,
                s.user_id,
                s.title,
                s.activity_type,
                s.description,
                s.start_time,
                s.end_time,
                s.status,
                s.created_at,

                d.deal_name,

                u.name AS user_name,
                u.email AS user_email

            FROM schedules s

            INNER JOIN deals d
                ON s.deal_id = d.deal_id

            LEFT JOIN users u
                ON s.user_id = u.user_id

            WHERE s.deal_id = ?
        `;

        const params = [dealId];

        if (userRole !== "admin") {
            sql += `
                AND d.assign_to = ?
            `;

            params.push(userId);
        }

        sql += `
            ORDER BY s.start_time ASC
        `;

        const [rows] = await db.query(sql, params);

        return res.json({
            success: true,
            schedules: rows
        });

    } catch (error) {
        console.error("GET SCHEDULES ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch scheduled activities"
        });
    }
});


/*
|--------------------------------------------------------------------------
| CREATE SCHEDULE
|--------------------------------------------------------------------------
*/
router.post("/", authMiddleware, async (req, res) => {
    try {
        const {
            deal_id,
            title,
            activity_type,
            description,
            start_time,
            end_time
        } = req.body;

        const userId = req.user.user_id;
        const userRole = req.user.role;

        if (
            !deal_id ||
            !activity_type ||
            !start_time ||
            !end_time
        ) {
            return res.status(400).json({
                success: false,
                message: "Deal, activity type, start time and end time are required"
            });
        }

        const allowedTypes = [
            "call",
            "meeting",
            "follow_up"
        ];

        if (!allowedTypes.includes(activity_type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid activity type"
            });
        }

        const start = new Date(start_time);
        const end = new Date(end_time);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime())
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid date or time"
            });
        }

        if (end <= start) {
            return res.status(400).json({
                success: false,
                message: "End time must be after start time"
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Check deal access
        |--------------------------------------------------------------------------
        */

        let dealSql = `
            SELECT
                deal_id,
                deal_name,
                assign_to
            FROM deals
            WHERE deal_id = ?
        `;

        const dealParams = [deal_id];

        if (userRole !== "admin") {
            dealSql += `
                AND assign_to = ?
            `;

            dealParams.push(userId);
        }

        const [dealRows] = await db.query(
            dealSql,
            dealParams
        );

        if (!dealRows.length) {
            return res.status(404).json({
                success: false,
                message: "Deal not found or access denied"
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Create schedule
        |--------------------------------------------------------------------------
        */

        const [result] = await db.query(
            `
            INSERT INTO schedules
            (
                deal_id,
                user_id,
                title,
                activity_type,
                description,
                start_time,
                end_time,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')
            `,
            [
                deal_id,
                userId,
                title ||
                    (
                        activity_type === "call"
                            ? "Call"
                            : activity_type === "meeting"
                                ? "Meeting"
                                : "Follow-up"
                    ),
                activity_type,
                description || null,
                start_time,
                end_time
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Create activity log entry
        |--------------------------------------------------------------------------
        */

        await db.query(
            `
            INSERT INTO activities
            (
                deal_id,
                user_id,
                activity_type,
                details
            )
            VALUES (?, ?, 'task', ?)
            `,
            [
                deal_id,
                userId,
                `${activity_type.replace("_", " ")} scheduled`
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Return created schedule
        |--------------------------------------------------------------------------
        */

        const [createdRows] = await db.query(
            `
            SELECT
                s.id,
                s.deal_id,
                s.user_id,
                s.title,
                s.activity_type,
                s.description,
                s.start_time,
                s.end_time,
                s.status,
                s.created_at,

                d.deal_name,

                u.name AS user_name,
                u.email AS user_email

            FROM schedules s

            INNER JOIN deals d
                ON s.deal_id = d.deal_id

            LEFT JOIN users u
                ON s.user_id = u.user_id

            WHERE s.id = ?
            `,
            [result.insertId]
        );

        const scheduleData = createdRows[0];
        const dealName = scheduleData?.deal_name || "Lead";
        const typeLabel = activity_type === "meeting" ? "Meeting" : activity_type === "call" ? "Call" : "Task";

        // Notify deal assignee or admins
        if (dealRows[0]?.assign_to && String(dealRows[0]?.assign_to) !== String(userId)) {
            notifyUser({
                userId: dealRows[0].assign_to,
                title: `New ${typeLabel} Scheduled`,
                message: `"${title || typeLabel}" scheduled for "${dealName}".`,
                type: "meeting",
                entityType: "schedule",
                entityId: deal_id,
                io: req.app.get("io")
            }).catch(e => console.warn("Schedule notif error:", e.message));
        }

        return res.status(201).json({
            success: true,
            message: "Activity scheduled successfully",
            schedule: scheduleData
        });

    } catch (error) {
        console.error("CREATE SCHEDULE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to schedule activity"
        });
    }
});


/*
|--------------------------------------------------------------------------
| UPDATE SCHEDULE STATUS
|--------------------------------------------------------------------------
*/
router.put("/:id/status", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const userId = req.user.user_id;
        const userRole = req.user.role;

        const allowedStatuses = [
            "scheduled",
            "completed",
            "cancelled"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid schedule status"
            });
        }

        let sql = `
            UPDATE schedules s
            INNER JOIN deals d
                ON s.deal_id = d.deal_id

            SET s.status = ?

            WHERE s.id = ?
        `;

        const params = [
            status,
            id
        ];

        if (userRole !== "admin") {
            sql += `
                AND d.assign_to = ?
            `;

            params.push(userId);
        }

        const [result] = await db.query(
            sql,
            params
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Schedule not found or access denied"
            });
        }

        return res.json({
            success: true,
            message: "Schedule status updated"
        });

    } catch (error) {
        console.error("UPDATE SCHEDULE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update schedule"
        });
    }
});


/*
|--------------------------------------------------------------------------
| DELETE SCHEDULE
|--------------------------------------------------------------------------
*/
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const userId = req.user.user_id;
        const userRole = req.user.role;

        let sql = `
            DELETE s
            FROM schedules s

            INNER JOIN deals d
                ON s.deal_id = d.deal_id

            WHERE s.id = ?
        `;

        const params = [id];

        if (userRole !== "admin") {
            sql += `
                AND d.assign_to = ?
            `;

            params.push(userId);
        }

        const [result] = await db.query(
            sql,
            params
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Schedule not found or access denied"
            });
        }

        return res.json({
            success: true,
            message: "Scheduled activity deleted"
        });

    } catch (error) {
        console.error("DELETE SCHEDULE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete scheduled activity"
        });
    }
});


module.exports = router;