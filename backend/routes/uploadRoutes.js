const express = require("express");
const router = express.Router();
const multer = require("multer");
const XLSX = require("xlsx");
const { v4: uuidv4 } = require("uuid");
const db = require("../db");
const fs = require("fs");
const path = require("path");

// ======================================================
// MULTER SETUP
// ======================================================

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

// ======================================================
// HELPERS
// ======================================================

const normalize = (value) => {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value).trim();
};

const normalizeHeader = (value) => {
  return normalize(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
};

const getCell = (row, possibleNames) => {
  const rowKeys = Object.keys(row);

  for (const possibleName of possibleNames) {
    const normalizedPossible = normalizeHeader(possibleName);

    const matchingKey = rowKeys.find(
      (key) => normalizeHeader(key) === normalizedPossible
    );

    if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null) {
      return String(row[matchingKey]).trim();
    }
  }

  return "";
};

// ======================================================
// CONVERT EXCEL / CSV ROW
// ======================================================

const convertExcelRow = (row, excelRowNumber) => {
  const businessName = normalize(
    getCell(row, [
      "Business Name",
      "BusinessName",
      "Organization",
      "Deal Organization",
      "Company",
      "Company Name",
      "Deal Name",
      "DealName",
      "Name",
    ])
  );

  const rawStatus = normalize(
    getCell(row, ["Status", "Deal Status", "Lead Status"])
  );

  let cleanStatus = "Open";
  const lowerStatus = rawStatus.toLowerCase();
  if (lowerStatus.includes("won")) {
    cleanStatus = "Closed Won";
  } else if (lowerStatus.includes("lost")) {
    cleanStatus = "Closed Lost";
  } else if (lowerStatus === "open") {
    cleanStatus = "Open";
  }

  const deal = {
    excel_row: excelRowNumber,
    deal_name: businessName,
    deal_organization: businessName,
    deal_owner: normalize(
      getCell(row, [
        "Owner Name",
        "OwnerName",
        "Deal Owner",
        "DealOwner",
        "Owner",
        "Contact Person",
      ])
    ),
    website: normalize(
      getCell(row, [
        "Website",
        "Site",
        "Web",
        "URL",
        "Business Website",
      ])
    ),
    customer_number: normalize(
      getCell(row, [
        "Phone Number",
        "PhoneNumber",
        "Phone",
        "Customer Number",
        "Number",
        "Mobile",
        "Contact Number",
      ])
    ),
    customer_email: normalize(
      getCell(row, [
        "Email Address",
        "EmailAddress",
        "Customer Email",
        "Email",
        "Email ID",
        "Mail",
      ])
    ),
    customer_address: normalize(
      getCell(row, [
        "Address / Location",
        "Address/Location",
        "Address",
        "Location",
        "Customer Address",
        "City",
        "State",
      ])
    ),
    pipeline: normalize(
      getCell(row, ["Pipeline", "Pipeline Name"])
    ),
    stage: normalize(
      getCell(row, ["Stage", "Stage Name"])
    ),
    deal_priority: normalize(
      getCell(row, ["Priority", "Deal Priority"])
    ) || "Medium",
    deal_status: cleanStatus,
    deal_notes: normalize(
      getCell(row, [
        "Comments",
        "Comment",
        "Notes",
        "Deal Notes",
        "Lead Notes",
        "Note",
        "Remarks",
        "Remark",
        "Description",
        "Feedback",
      ])
    ),
  };

  return deal;
};

// ======================================================
// VALIDATE ONE DEAL
// ======================================================

const validateDeal = async (deal, defaultPipeline, defaultStage) => {
  const errors = [];

  // 1. Mandatory Fields
  if (!deal.deal_organization && !deal.deal_name) {
    errors.push("Business Name is required.");
  }

  if (!deal.deal_owner) {
    errors.push("Owner Name is required.");
  }

  if (!deal.website) {
    errors.push("Website is required.");
  }

  if (!deal.customer_number) {
    errors.push("Phone Number is required.");
  }

  if (!deal.customer_email) {
    errors.push("Email Address is required.");
  }

  if (!deal.customer_address) {
    errors.push("Address / Location is required.");
  }

  // 2. Resolve Pipeline
  let resolvedPipelineId = defaultPipeline?.pipeline_id || null;
  let resolvedPipelineName = defaultPipeline?.pipeline_name || "Default";

  if (deal.pipeline) {
    try {
      const [pipelines] = await db.query(
        `SELECT pipeline_id, pipeline_name FROM pipelines WHERE LOWER(TRIM(pipeline_name)) = LOWER(TRIM(?)) LIMIT 1`,
        [deal.pipeline]
      );
      if (pipelines.length > 0) {
        resolvedPipelineId = pipelines[0].pipeline_id;
        resolvedPipelineName = pipelines[0].pipeline_name;
      }
    } catch (e) {
      console.warn("Pipeline lookup err:", e.message);
    }
  }

  // 3. Resolve Stage
  let resolvedStageId = defaultStage?.stage_id || null;
  let resolvedStageName = defaultStage?.stage_name || "Stage 1";

  if (deal.stage && resolvedPipelineId) {
    try {
      const [stages] = await db.query(
        `SELECT stage_id, stage_name FROM stages WHERE pipeline_id = ? AND LOWER(TRIM(stage_name)) = LOWER(TRIM(?)) LIMIT 1`,
        [resolvedPipelineId, deal.stage]
      );
      if (stages.length > 0) {
        resolvedStageId = stages[0].stage_id;
        resolvedStageName = stages[0].stage_name;
      }
    } catch (e) {
      console.warn("Stage lookup err:", e.message);
    }
  }

  return {
    ...deal,
    pipeline: resolvedPipelineName,
    stage: resolvedStageName,
    valid: errors.length === 0,
    errors,
    resolved: {
      pipeline_id: resolvedPipelineId,
      stage_id: resolvedStageId,
    },
  };
};

// ======================================================
// HELPER: PROCESS UPLOADED FILE (CSV or XLSX)
// ======================================================

async function processUploadedFile(filePath) {
  const workbook = XLSX.readFile(filePath, {
    raw: false,
    cellDates: true,
  });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error("File does not contain any readable sheets.");
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const rawRows = XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
    raw: false,
  });

  if (!rawRows || rawRows.length === 0) {
    throw new Error("Uploaded file is empty.");
  }

  // Fetch default pipeline & stage
  let defaultPipeline = null;
  let defaultStage = null;
  try {
    const [pRows] = await db.query(`SELECT pipeline_id, pipeline_name FROM pipelines ORDER BY pipeline_id ASC LIMIT 1`);
    if (pRows.length > 0) {
      defaultPipeline = pRows[0];
      const [sRows] = await db.query(
        `SELECT stage_id, stage_name FROM stages WHERE pipeline_id = ? ORDER BY stage_order ASC, stage_id ASC LIMIT 1`,
        [defaultPipeline.pipeline_id]
      );
      if (sRows.length > 0) defaultStage = sRows[0];
    }
  } catch (dbErr) {
    console.warn("Default pipeline lookup err:", dbErr.message);
  }

  const validatedRows = [];

  for (let index = 0; index < rawRows.length; index++) {
    const deal = convertExcelRow(rawRows[index], index + 2);
    const validated = await validateDeal(deal, defaultPipeline, defaultStage);
    validatedRows.push(validated);
  }

  const validCount = validatedRows.filter((r) => r.valid).length;
  const invalidCount = validatedRows.filter((r) => !r.valid).length;

  return {
    total: validatedRows.length,
    valid: validCount,
    invalid: invalidCount,
    rows: validatedRows,
  };
}

// ======================================================
// HELPER: EXECUTE DEALS INSERTION
// ======================================================

async function executeImportDeals(rows) {
  let fallbackPipelineId = null;
  let fallbackStageId = null;

  try {
    const [pRows] = await db.query(`SELECT pipeline_id FROM pipelines ORDER BY pipeline_id ASC LIMIT 1`);
    if (pRows.length > 0) {
      fallbackPipelineId = pRows[0].pipeline_id;
      const [sRows] = await db.query(
        `SELECT stage_id FROM stages WHERE pipeline_id = ? ORDER BY stage_order ASC, stage_id ASC LIMIT 1`,
        [fallbackPipelineId]
      );
      if (sRows.length > 0) fallbackStageId = sRows[0].stage_id;
    }
  } catch (err) {
    console.warn("Fallback lookup err:", err.message);
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    let imported = 0;

    for (const row of rows) {
      const businessName = normalize(row.deal_organization || row.deal_name);
      if (!businessName) continue;

      const dealId = uuidv4();
      const pipelineId = row.resolved?.pipeline_id || row.pipeline_id || fallbackPipelineId;
      const stageId = row.resolved?.stage_id || row.stage_id || fallbackStageId;
      const notes = normalize(row.deal_notes);

      const sql = `
        INSERT INTO deals (
          deal_id,
          deal_name,
          deal_organization,
          deal_owner,
          website,
          customer_number,
          customer_email,
          customer_address,
          pipeline_id,
          deal_stage,
          deal_priority,
          deal_status,
          deal_notes,
          deal_source
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        dealId,
        businessName,
        businessName,
        normalize(row.deal_owner) || "Unknown",
        normalize(row.website) || null,
        normalize(row.customer_number) || null,
        normalize(row.customer_email) || null,
        normalize(row.customer_address) || null,
        pipelineId,
        stageId,
        normalize(row.deal_priority) || "Medium",
        normalize(row.deal_status) || "Open",
        notes || null,
        normalize(row.website) || null,
      ];

      await connection.query(sql, values);

      // If comments/notes exist in CSV, auto-insert into comments table
      if (notes) {
        try {
          const commentId = uuidv4();
          await connection.query(
            `INSERT INTO comments (comment_id, deal_id, comment, user_id, user_name, user_role, created_at)
             VALUES (?, ?, ?, 'import', 'Import System', 'system', NOW())`,
            [commentId, dealId, notes]
          );

          await connection.query(
            `INSERT INTO activities (deal_id, user_id, activity_type, details)
             VALUES (?, 'import', 'comment', ?)`,
            [dealId, `Imported comment: "${notes.substring(0, 80)}"`]
          );
        } catch (commErr) {
          console.warn("[IMPORT COMMENT ERROR]", commErr.message);
        }
      }

      imported++;
    }

    await connection.commit();
    connection.release();

    return {
      success: true,
      message: `Successfully imported ${imported} leads.`,
      imported,
    };
  } catch (dbError) {
    await connection.rollback().catch(() => {});
    connection.release();
    throw dbError;
  }
}

// ======================================================
// PREVIEW FILE ENDPOINT
// ======================================================

router.post("/preview", upload.any(), async (req, res) => {
  const file = req.files?.[0] || req.file;
  if (!file) {
    return res.status(400).json({ success: false, message: "No file uploaded." });
  }

  try {
    const result = await processUploadedFile(file.path);
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("Preview error:", error);
    return res.status(400).json({ success: false, message: error.message || "Failed to process file." });
  } finally {
    if (file && file.path) {
      fs.unlink(file.path, () => {});
    }
  }
});

// ======================================================
// COMMIT IMPORT ENDPOINT
// ======================================================

router.post("/commit", async (req, res) => {
  try {
    const rows = req.body?.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No rows provided for import.",
      });
    }

    const result = await executeImportDeals(rows);
    return res.json(result);
  } catch (error) {
    console.error("Import commit error:", error);
    return res.status(500).json({
      success: false,
      message: "Database error while saving imported leads.",
      error: error.message,
    });
  }
});

// ======================================================
// ROOT POST ROUTE (Dual handler for Preview and Commit)
// ======================================================

router.post("/", upload.any(), async (req, res) => {
  const file = req.files?.[0] || req.file;

  // Case 1: Multipart File -> Return preview
  if (file) {
    try {
      const result = await processUploadedFile(file.path);
      return res.json({ success: true, ...result });
    } catch (error) {
      console.error("Root upload preview error:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to parse file.",
      });
    } finally {
      if (file && file.path) {
        fs.unlink(file.path, () => {});
      }
    }
  }

  // Case 2: JSON payload with { rows } -> Perform commit
  if (req.body?.rows && Array.isArray(req.body.rows)) {
    try {
      const result = await executeImportDeals(req.body.rows);
      return res.json(result);
    } catch (dbError) {
      console.error("Root import commit error:", dbError);
      return res.status(500).json({
        success: false,
        message: "Failed to import deals into database.",
        error: dbError.message,
      });
    }
  }

  return res.status(400).json({
    success: false,
    message: "No file or valid rows provided.",
  });
});

module.exports = router;