const express = require("express");
const router = express.Router();
const multer = require("multer");
const XLSX = require("xlsx");
const { v4: uuidv4 } = require("uuid");
const db = require("../db");
const fs = require("fs");
const path = require("path");
const { formatCompanyName } = require("../utils/companyNameFormatter");

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
// ======================================================
// CONVERT EXCEL / CSV ROW
// ======================================================

const convertExcelRow = (row, excelRowNumber) => {
  const companyName = normalize(
    getCell(row, [
      "Company Name",
      "CompanyName",
      "Company",
      "Organization",
      "Deal Organization",
      "Business Name",
      "Account Name",
      "Account_Name",
      "AccountName",
      "Account",
      "Client Name",
    ])
  );

  const firstName = normalize(getCell(row, ["First Name", "First_Name", "FirstName"]));
  const lastName = normalize(getCell(row, ["Last Name", "Last_Name", "LastName"]));
  const combinedFullName = [firstName, lastName].filter(Boolean).join(" ");

  const contactName = normalize(
    getCell(row, [
      "Full Name",
      "Full_Name",
      "FullName",
      "Contact Name",
      "Contact Person",
      "ContactName",
      "Contact",
      "Lead Name",
      "Client",
    ])
  ) || combinedFullName || normalize(getCell(row, ["Deal Owner", "Owner", "Created_By", "Modified_By"]));

  const dealName = normalize(
    getCell(row, [
      "Deal Name",
      "DealName",
      "Name",
      "Business Name",
      "Company Name",
      "Account Name",
      "Account_Name",
    ])
  ) || companyName || contactName || "Untitled Deal";

  const rawStatus = normalize(
    getCell(row, ["Status", "Deal Status", "Lead Status", "Stage Status"])
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

  // Parse amount/value
  const rawAmount = normalize(
    getCell(row, [
      "Amount",
      "Deal Value",
      "Deal Amount",
      "Value",
      "Revenue",
    ])
  );
  let dealValue = null;
  if (rawAmount) {
    const num = parseFloat(rawAmount.replace(/[^0-9.-]+/g, ""));
    if (!Number.isNaN(num)) dealValue = num;
  }

  // Parse closing date
  const rawCloseDate = normalize(
    getCell(row, [
      "Closing Date",
      "Close Date",
      "Expected Close Date",
      "CloseDate",
    ])
  );

  // Parse address fields
  const directAddress = normalize(
    getCell(row, [
      "Address / Location",
      "Address/Location",
      "Address",
      "Location",
      "Customer Address",
      "Company Address",
    ])
  );
  const mailingStreet = normalize(getCell(row, ["Mailing_Street", "Mailing Street", "Street"]));
  const mailingCity = normalize(getCell(row, ["Mailing_City", "Mailing City", "City"]));
  const mailingState = normalize(getCell(row, ["Mailing_State", "Mailing State", "State"]));
  const mailingZip = normalize(getCell(row, ["Mailing_Zip", "Mailing Zip", "Zip", "Postal Code", "Zipcode"]));
  const mailingCountry = normalize(getCell(row, ["Mailing_Country", "Mailing Country", "Country"]));
  const compositeAddress = [mailingStreet, mailingCity, mailingState, mailingZip, mailingCountry].filter(Boolean).join(", ");
  const finalAddress = directAddress || compositeAddress || "";

  // Parse combined notes/description
  const description = normalize(getCell(row, ["Description", "Deal Description"]));
  const title = normalize(getCell(row, ["Title", "Job Title"]));
  const notes = normalize(
    getCell(row, [
      "Notes",
      "Note",
      "Comments",
      "Comment",
      "Deal Notes",
      "Lead Notes",
      "Remarks",
      "Remark",
      "Feedback",
    ])
  );
  const noteParts = [];
  if (title) noteParts.push(`Title: ${title}`);
  if (description) noteParts.push(`Description: ${description}`);
  if (notes) noteParts.push(`Notes: ${notes}`);
  const combinedNotes = noteParts.join("\n\n") || null;

  const rawCompany = companyName || dealName || contactName || "General";
  const formattedCompany = formatCompanyName(rawCompany, contactName);

  const deal = {
    excel_row: excelRowNumber,
    deal_name: dealName,
    deal_organization: formattedCompany,
    contact_person: contactName || "Unknown",
    deal_owner: contactName || "Unknown",
    deal_value: dealValue,
    close_date: rawCloseDate || null,
    tags: normalize(getCell(row, ["Tag", "Tags", "Label", "Category"])) || null,
    website: normalize(
      getCell(row, [
        "Website",
        "Company Website",
        "Contact Website",
        "Site",
        "Web",
        "URL",
        "Business Website",
      ])
    ),
    customer_number: normalize(
      getCell(row, [
        "Phone Number",
        "Contact Phone",
        "Company Phone",
        "PhoneNumber",
        "Phone",
        "Customer Number",
        "Number",
        "Mobile",
        "Contact Number",
        "Cell Phone",
      ])
    ),
    customer_email: normalize(
      getCell(row, [
        "Email Address",
        "Contact Email",
        "Company Email",
        "EmailAddress",
        "Customer Email",
        "Email",
        "Email ID",
        "Mail",
      ])
    ),
    customer_address: finalAddress,
    pipeline: normalize(
      getCell(row, ["Pipeline", "Pipeline Name"])
    ),
    stage: normalize(
      getCell(row, ["Stage", "Stage Name", "Deal Stage"])
    ),
    deal_priority: normalize(
      getCell(row, ["Priority", "Deal Priority"])
    ) || "Medium",
    deal_status: cleanStatus,
    deal_notes: combinedNotes,
    created_time: normalize(
      getCell(row, [
        "Created_Time",
        "Created Time",
        "Created Date",
        "Created Date Time",
        "CreatedTime",
        "Creation Date",
        "CreatedAt",
        "Created At",
      ])
    ) || null,
    created_by: normalize(
      getCell(row, [
        "Created_By",
        "Created By",
        "CreatedBy",
        "Creator",
      ])
    ) || null,
    last_activity_time: normalize(
      getCell(row, [
        "Last_Activity_Time",
        "Last Activity Time",
        "Last Activity",
        "LastActivityTime",
        "Activity Time",
        "Modified_Time",
        "Modified Time",
        "ModifiedTime",
        "Last Modified Time",
        "UpdatedAt",
      ])
    ) || null,
    modified_by: normalize(
      getCell(row, [
        "Modified_By",
        "Modified By",
        "ModifiedBy",
        "Last Modified By",
      ])
    ) || null,
    assigned_user: normalize(
      getCell(row, [
        "Assigned User",
        "Assigned To",
        "Assign To",
        "Assigned",
        "Sales Rep",
        "Assigned Employee",
        "Assignee",
        "Representative",
        "Deal Owner",
        "DealOwner",
        "Owner Name",
        "OwnerName",
        "Owner",
        "Created By",
        "Created_By",
        "Modified By",
        "Modified_By",
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

  // Mandatory Check: At least one identifying information must be present
  const hasIdentifier = Boolean(
    deal.deal_organization ||
    deal.deal_name ||
    (deal.contact_person && deal.contact_person !== "Unknown") ||
    deal.customer_number ||
    deal.customer_email
  );

  if (!hasIdentifier) {
    errors.push("Row has no Name, Company, Phone or Email.");
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

  // 4. Resolve Assigned User (if provided in CSV or Deal Owner matches employee)
  let resolvedAssignTo = null;
  let resolvedAssignedUserName = null;
  let autoMatched = false;

  if (deal.assigned_user) {
    try {
      const qUser = deal.assigned_user.trim().toLowerCase();
      const [userRows] = await db.query(
        `SELECT user_id, name, email FROM users 
         WHERE LOWER(TRIM(name)) = ? OR LOWER(TRIM(email)) = ? OR LOWER(name) LIKE ? OR LOWER(email) LIKE ?
         ORDER BY CASE 
           WHEN LOWER(TRIM(name)) = ? THEN 1 
           WHEN LOWER(TRIM(email)) = ? THEN 2 
           ELSE 3 
         END LIMIT 1`,
        [qUser, qUser, `${qUser}%`, `${qUser}%`, qUser, qUser]
      );
      if (userRows.length > 0) {
        resolvedAssignTo = userRows[0].user_id;
        resolvedAssignedUserName = userRows[0].name;
      }
    } catch (e) {
      console.warn("User lookup err:", e.message);
    }
  }

  // 5. Smart Duplicate Client Match: If not explicitly assigned, check if Phone, Email, or Website matches an existing assigned deal
  if (!resolvedAssignTo) {
    try {
      const matchPhone = deal.customer_number ? deal.customer_number.trim() : null;
      const matchEmail = deal.customer_email ? deal.customer_email.trim().toLowerCase() : null;
      const matchWebsite = deal.website ? deal.website.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "") : null;

      const whereOrs = [];
      const matchParams = [];

      if (matchPhone && matchPhone.length >= 6) {
        whereOrs.push("d.customer_number = ?");
        matchParams.push(matchPhone);
      }
      if (matchEmail && matchEmail.includes("@")) {
        whereOrs.push("LOWER(d.customer_email) = ?");
        matchParams.push(matchEmail);
      }
      if (matchWebsite && matchWebsite.length >= 4) {
        whereOrs.push("LOWER(d.website) LIKE ?");
        matchParams.push(`%${matchWebsite}%`);
      }

      if (whereOrs.length > 0) {
        const [existingDeal] = await db.query(
          `SELECT d.assign_to, u.name as assigned_user_name 
           FROM deals d
           JOIN users u ON d.assign_to = u.user_id
           WHERE d.assign_to IS NOT NULL AND (${whereOrs.join(" OR ")})
           ORDER BY d.creation_date DESC
           LIMIT 1`,
          matchParams
        );

        if (existingDeal.length > 0) {
          resolvedAssignTo = existingDeal[0].assign_to;
          resolvedAssignedUserName = existingDeal[0].assigned_user_name;
          autoMatched = true;
        }
      }
    } catch (matchErr) {
      console.warn("Smart client match lookup err:", matchErr.message);
    }
  }

  return {
    ...deal,
    pipeline: resolvedPipelineName,
    stage: resolvedStageName,
    assigned_user_name: resolvedAssignedUserName,
    auto_matched: autoMatched,
    valid: errors.length === 0,
    errors,
    resolved: {
      pipeline_id: resolvedPipelineId,
      stage_id: resolvedStageId,
      assign_to: resolvedAssignTo,
      assigned_user_name: resolvedAssignedUserName,
      auto_matched: autoMatched,
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

function formatMysqlDatetime(dateInput) {
  if (!dateInput) return null;
  try {
    if (
      typeof dateInput === "number" ||
      (!isNaN(dateInput) &&
        !String(dateInput).includes("-") &&
        !String(dateInput).includes(":") &&
        !String(dateInput).includes("/"))
    ) {
      const excelEpoch = new Date(1899, 11, 30);
      const d = new Date(excelEpoch.getTime() + Number(dateInput) * 86400000);
      if (!isNaN(d.getTime())) {
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      }
    }

    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) {
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
  } catch (e) {}
  return null;
}

async function executeImportDeals(rows) {
  let fallbackPipelineId = null;
  let fallbackStageId = null;

  try {
    const [pRows] = await db.query(
      `SELECT pipeline_id FROM pipelines ORDER BY pipeline_id ASC LIMIT 1`
    );
    if (pRows.length > 0) {
      fallbackPipelineId = pRows[0].pipeline_id;
      const [sRows] = await db.query(
        `SELECT stage_id FROM stages WHERE pipeline_id = ? ORDER BY stage_order ASC, stage_id ASC LIMIT 1`,
        [fallbackPipelineId]
      );
      if (sRows.length > 0) {
        fallbackStageId = sRows[0].stage_id;
      }
    }

    if (!fallbackStageId) {
      const [anyStage] = await db.query(`SELECT stage_id FROM stages LIMIT 1`);
      if (anyStage.length > 0) {
        fallbackStageId = anyStage[0].stage_id;
      }
    }
  } catch (err) {
    console.warn("Fallback lookup err:", err.message);
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    let imported = 0;
    const BATCH_SIZE = 500;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batchRows = rows.slice(i, i + BATCH_SIZE);
      const dealValuesBatch = [];
      const activityValuesBatch = [];
      const commentValuesBatch = [];

      for (const row of batchRows) {
        const contactPerson = normalize(row.contact_person || row.deal_owner).substring(0, 255) || "Unknown";
        const rawBusiness = normalize(row.deal_organization || row.deal_name).substring(0, 255);
        if (!rawBusiness) continue;
        const businessName = formatCompanyName(rawBusiness, contactPerson);

        const dealId = uuidv4();
        const pipelineId = row.resolved?.pipeline_id || row.pipeline_id || fallbackPipelineId || null;
        const stageId = row.resolved?.stage_id || row.stage_id || fallbackStageId || null;
        const assignTo = row.resolved?.assign_to || row.assign_to || null;
        const notes = normalize(row.deal_notes);

        const dealName = normalize(row.deal_name).substring(0, 255) || businessName;
        
        let dealValue = null;
        if (row.deal_value !== undefined && row.deal_value !== null && row.deal_value !== "") {
          const num = parseFloat(String(row.deal_value).replace(/[^0-9.-]+/g, ""));
          if (!isNaN(num)) dealValue = num;
        }

        let validCloseDate = null;
        if (row.close_date) {
          const d = new Date(row.close_date);
          if (!isNaN(d.getTime())) {
            validCloseDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          }
        }
        const tags = normalize(row.tags).substring(0, 255) || null;
        const website = normalize(row.website).substring(0, 255) || null;
        const customerNumber = normalize(row.customer_number).substring(0, 100) || null;
        const customerEmail = normalize(row.customer_email).substring(0, 255) || null;
        const customerAddress = normalize(row.customer_address) || null;
        const priority = normalize(row.deal_priority).substring(0, 50) || "Medium";
        const status = normalize(row.deal_status).substring(0, 50) || "Open";
        const dealSource = normalize(row.deal_source || row.source).substring(0, 50) || "Import";

        const nowIso = formatMysqlDatetime(new Date());
        const parsedCreatedDate = formatMysqlDatetime(row.created_time) || nowIso;
        const parsedLastActivityDate = formatMysqlDatetime(row.last_activity_time || row.modified_time) || parsedCreatedDate;
        const creatorName = normalize(row.created_by) || normalize(row.deal_owner) || "System";
        const modifierName = normalize(row.modified_by) || creatorName;

        dealValuesBatch.push([
          dealId,
          dealName,
          businessName,
          contactPerson,
          contactPerson,
          dealValue,
          validCloseDate,
          tags,
          website,
          customerNumber,
          customerEmail,
          customerAddress,
          pipelineId,
          stageId,
          priority,
          status,
          notes || null,
          dealSource,
          assignTo,
          parsedCreatedDate,
          parsedLastActivityDate,
          creatorName,
        ]);

        activityValuesBatch.push([
          dealId,
          assignTo || null,
          "comment",
          `Lead created by ${creatorName}`,
          parsedCreatedDate,
        ]);

        if (row.last_activity_time || row.modified_by) {
          activityValuesBatch.push([
            dealId,
            assignTo || null,
            "comment",
            `Last activity / Modified by ${modifierName}`,
            parsedLastActivityDate,
          ]);
        }

        if (notes) {
          const commentId = uuidv4();
          commentValuesBatch.push([
            commentId,
            dealId,
            notes,
            assignTo || null,
            "Import System",
            "system",
            parsedCreatedDate,
          ]);
        }

        imported++;
      }

      if (dealValuesBatch.length > 0) {
        await connection.query(
          `INSERT INTO deals (
            deal_id, deal_name, deal_organization, contact_person, deal_owner,
            deal_value, close_date, tags, website, customer_number,
            customer_email, customer_address, pipeline_id, deal_stage,
            deal_priority, deal_status, deal_notes, deal_source, assign_to,
            creation_date, last_updated, created_by
          ) VALUES ?`,
          [dealValuesBatch]
        );
      }

      if (activityValuesBatch.length > 0) {
        try {
          await connection.query(
            `INSERT INTO activities (deal_id, user_id, activity_type, details, created_at) VALUES ?`,
            [activityValuesBatch]
          );
        } catch (actErr) {
          console.warn("[BATCH ACTIVITY LOG ERR]", actErr.message);
        }
      }

      if (commentValuesBatch.length > 0) {
        try {
          await connection.query(
            `INSERT INTO comments (comment_id, deal_id, comment, user_id, user_name, user_role, created_at) VALUES ?`,
            [commentValuesBatch]
          );
        } catch (commErr) {
          console.warn("[BATCH COMMENT LOG ERR]", commErr.message);
        }
      }
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