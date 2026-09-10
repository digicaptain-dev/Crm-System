const express = require("express");
const router = express.Router();
const multer = require("multer");
const XLSX = require("xlsx");
const { v4: uuidv4 } = require("uuid");
const db = require("../db");
const fs = require("fs");

// ======================================================
// MULTER
// ======================================================

const upload = multer({
  dest: "uploads/",
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
    .replace(/\s+/g, " ")
    .trim();
};

const parseNumber = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const cleaned = String(value)
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "");

  if (!cleaned) {
    return null;
  }

  const number = Number(cleaned);

  return Number.isFinite(number)
    ? number
    : null;
};

const parseProbability = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  if (!Number.isInteger(number)) {
    return null;
  }

  if (number < 0 || number > 100) {
    return null;
  }

  return number;
};

const normalizeDate = (value) => {
  if (!value) {
    return null;
  }

  // Excel serial date
  if (typeof value === "number") {
    const date =
      XLSX.SSF.parse_date_code(value);

    if (!date) {
      return null;
    }

    const year = date.y;
    const month = String(date.m).padStart(2, "0");
    const day = String(date.d).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const stringValue = String(value).trim();

  // Already YYYY-MM-DD
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      stringValue
    )
  ) {
    return stringValue;
  }

  // DD/MM/YYYY
  const slashMatch =
    stringValue.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );

  if (slashMatch) {
    const day = String(
      slashMatch[1]
    ).padStart(2, "0");

    const month = String(
      slashMatch[2]
    ).padStart(2, "0");

    const year = slashMatch[3];

    return `${year}-${month}-${day}`;
  }

  // Try normal JS date
  const date = new Date(
    stringValue
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// ======================================================
// EXCEL HEADER MAPPING
// ======================================================

const getCell = (row, possibleNames) => {
  const rowKeys = Object.keys(row);

  for (const possibleName of possibleNames) {
    const normalizedPossible =
      normalizeHeader(possibleName);

    const matchingKey =
      rowKeys.find(
        (key) =>
          normalizeHeader(key) ===
          normalizedPossible
      );

    if (matchingKey) {
      return row[matchingKey];
    }
  }

  return "";
};

// ======================================================
// CONVERT EXCEL ROW
// ======================================================

const convertExcelRow = (
  row,
  excelRowNumber
) => {
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
    ])
  );

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
      ])
    ),

    customer_email: normalize(
      getCell(row, [
        "Email Address",
        "EmailAddress",
        "Customer Email",
        "Email",
        "Email ID",
      ])
    ),

    customer_address: normalize(
      getCell(row, [
        "Address / Location",
        "Address/Location",
        "Address",
        "Location",
        "Customer Address",
      ])
    ),

    pipeline: normalize(
      getCell(row, [
        "Pipeline",
        "Pipeline Name",
      ])
    ),

    stage: normalize(
      getCell(row, [
        "Stage",
        "Stage Name",
      ])
    ),

    deal_source: normalize(
      getCell(row, [
        "Website",
        "Deal Source",
        "Source",
      ])
    ),

    deal_priority: normalize(
      getCell(row, [
        "Priority",
        "Deal Priority",
      ])
    ) || "Medium",

    deal_status: normalize(
      getCell(row, [
        "Status",
        "Deal Status",
      ])
    ) || "Open",

    deal_notes: normalize(
      getCell(row, [
        "Notes",
        "Deal Notes",
        "Comment",
      ])
    ),
  };

  return deal;
};

// ======================================================
// VALIDATE ONE DEAL
// ======================================================

const validateDeal = async (deal) => {
  const errors = [];

  // -----------------------------------------------
  // Mandatory Fields
  // -----------------------------------------------

  if (!deal.deal_organization && !deal.deal_name) {
    errors.push(
      "Business Name is required."
    );
  }

  if (!deal.deal_owner) {
    errors.push(
      "Owner Name is required."
    );
  }

  if (!deal.website) {
    errors.push(
      "Website is required."
    );
  }

  if (!deal.customer_number) {
    errors.push(
      "Phone Number is required."
    );
  }

  if (!deal.customer_email) {
    errors.push(
      "Email Address is required."
    );
  }

  if (!deal.customer_address) {
    errors.push(
      "Address / Location is required."
    );
  }

  if (!deal.pipeline) {
    errors.push(
      "Pipeline is required."
    );
  }

  if (!deal.stage) {
    errors.push(
      "Stage is required."
    );
  }

  // -----------------------------------------------
  // Validate priority
  // -----------------------------------------------

  if (
    deal.deal_priority &&
    ![
      "High",
      "Medium",
      "Low",
    ].includes(
      deal.deal_priority
    )
  ) {
    errors.push(
      "Priority must be High, Medium, or Low."
    );
  }

  // -----------------------------------------------
  // Validate status
  // -----------------------------------------------

  if (
    deal.deal_status &&
    ![
      "Open",
      "Closed Won",
      "Won",
      "Closed Lost",
      "Lost",
      "Removed",
    ].includes(
      deal.deal_status
    )
  ) {
    errors.push(
      "Status must be Open, Closed Won, Closed Lost, or Removed."
    );
  }

  // -----------------------------------------------
  // Find owner
  // -----------------------------------------------

  let owner = null;

  if (deal.deal_owner) {
    const [users] =
      await db.query(
        `
        SELECT user_id, name
        FROM users
        WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))
        LIMIT 1
        `,
        [deal.deal_owner]
      );

    if (!users.length) {
      errors.push(
        `Deal Owner "${deal.deal_owner}" was not found.`
      );
    } else {
      owner = users[0];
    }
  }

  // -----------------------------------------------
  // Find pipeline
  // -----------------------------------------------

  let pipeline = null;

  if (deal.pipeline) {
    const [pipelines] =
      await db.query(
        `
        SELECT pipeline_id, pipeline_name
        FROM pipelines
        WHERE LOWER(TRIM(pipeline_name)) =
              LOWER(TRIM(?))
        LIMIT 1
        `,
        [deal.pipeline]
      );

    if (!pipelines.length) {
      errors.push(
        `Pipeline "${deal.pipeline}" was not found.`
      );
    } else {
      pipeline = pipelines[0];
    }
  }

  // -----------------------------------------------
  // Find stage inside selected pipeline
  // -----------------------------------------------

  let stage = null;

  if (
    deal.stage &&
    pipeline
  ) {
    const [stages] =
      await db.query(
        `
        SELECT stage_id, stage_name
        FROM stages
        WHERE pipeline_id = ?
          AND LOWER(TRIM(stage_name)) =
              LOWER(TRIM(?))
        LIMIT 1
        `,
        [
          pipeline.pipeline_id,
          deal.stage,
        ]
      );

    if (!stages.length) {
      errors.push(
        `Stage "${deal.stage}" was not found in pipeline "${pipeline.pipeline_name}".`
      );
    } else {
      stage = stages[0];
    }
  }

  return {
    ...deal,

    valid: errors.length === 0,

    errors,

    // These are returned for preview only.
    // Frontend does not need to display them.
    resolved: {
      user_id:
        owner?.user_id || null,

      pipeline_id:
        pipeline?.pipeline_id || null,

      stage_id:
        stage?.stage_id || null,
    },
  };
};

// ======================================================
// PREVIEW EXCEL
//
// POST /api/deals/upload/preview
// ======================================================

router.post(
  "/preview",
  upload.single("dealsFile"),
  async (req, res) => {
    let filePath = null;

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "No Excel file uploaded.",
        });
      }

      filePath = req.file.path;

      // ---------------------------------------------
      // Check extension
      // ---------------------------------------------

      const fileName =
        req.file.originalname.toLowerCase();

      if (
        !fileName.endsWith(".xlsx")
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Only .xlsx Excel files are supported.",
        });
      }

      // ---------------------------------------------
      // Read workbook
      // ---------------------------------------------

      const workbook =
        XLSX.readFile(filePath);

      if (
        !workbook.SheetNames.length
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Excel file does not contain any worksheet.",
        });
      }

      const sheetName =
        workbook.SheetNames[0];

      const worksheet =
        workbook.Sheets[
          sheetName
        ];

      const rawRows =
        XLSX.utils.sheet_to_json(
          worksheet,
          {
            defval: "",
          }
        );

      if (
        !rawRows ||
        rawRows.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Excel file is empty.",
        });
      }

      // ---------------------------------------------
      // Validate headers
      // ---------------------------------------------

      const headers =
        Object.keys(
          rawRows[0]
        ).map(normalizeHeader);

      const requiredHeaders = [
        "deal name",
        "deal owner",
        "pipeline",
        "stage",
      ];

      const missingHeaders =
        requiredHeaders.filter(
          (header) =>
            !headers.includes(header)
        );

      if (
        missingHeaders.length > 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Required Excel columns are missing.",
          missingColumns:
            missingHeaders,
        });
      }

      // ---------------------------------------------
      // Convert + validate
      // ---------------------------------------------

      const validatedRows = [];

      for (
        let index = 0;
        index < rawRows.length;
        index++
      ) {
        const deal =
          convertExcelRow(
            rawRows[index],
            index + 2
          );

        const validated =
          await validateDeal(
            deal
          );

        validatedRows.push(
          validated
        );
      }

      const validCount =
        validatedRows.filter(
          (row) => row.valid
        ).length;

      const invalidCount =
        validatedRows.filter(
          (row) => !row.valid
        ).length;

      return res.json({
        success: true,

        total:
          validatedRows.length,

        valid:
          validCount,

        invalid:
          invalidCount,

        rows:
          validatedRows,
      });

    } catch (error) {
      console.error(
        "Excel preview error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to process Excel file.",
        error:
          error.message,
      });

    } finally {
      // ---------------------------------------------
      // Delete temporary Excel file
      // ---------------------------------------------

      if (filePath) {
        fs.unlink(
          filePath,
          (err) => {
            if (err) {
              console.error(
                "Failed to delete temporary Excel file:",
                err
              );
            }
          }
        );
      }
    }
  }
);

// ======================================================
// ACTUAL BULK IMPORT
//
// POST /api/deals/upload
// ======================================================

router.post(
  "/",
  async (req, res) => {
    try {
      const rows =
        req.body?.rows;

      if (
        !Array.isArray(rows) ||
        rows.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "No valid deal rows were provided.",
        });
      }

      // ---------------------------------------------
      // Revalidate everything on backend.
      //
      // Do NOT trust pipeline_id/stage_id
      // sent by frontend.
      // ---------------------------------------------

      const dealsToInsert = [];

      for (
        let index = 0;
        index < rows.length;
        index++
      ) {
        const row = rows[index];

        // Only accept normal user-facing fields.
        const deal = {
          deal_name:
            normalize(
              row.deal_name
            ),

          deal_owner:
            normalize(
              row.deal_owner
            ),

          pipeline:
            normalize(
              row.pipeline
            ),

          stage:
            normalize(
              row.stage
            ),

          deal_value:
            row.deal_value ??
            null,

          customer_email:
            normalize(
              row.customer_email
            ) || null,

          close_date:
            row.close_date ||
            null,

          deal_source:
            normalize(
              row.deal_source
            ) || null,

          deal_priority:
            normalize(
              row.deal_priority
            ) || "Medium",

          deal_status:
            normalize(
              row.deal_status
            ) || "Open",

          probability:
            row.probability ??
            null,

          tags:
            normalize(
              row.tags
            ) || null,

          currency:
            normalize(
              row.currency
            ) || null,

          team_members:
            normalize(
              row.team_members
            ) || null,

          deal_organization:
            normalize(
              row.deal_organization
            ) || null,

          contact_person:
            normalize(
              row.contact_person
            ) || null,

          assign_to:
            normalize(
              row.assign_to
            ) || null,

          time_zone:
            normalize(
              row.time_zone
            ) || null,

          customer_number:
            normalize(
              row.customer_number
            ) || null,

          customer_address:
            normalize(
              row.customer_address
            ) || null,

          products_services:
            normalize(
              row.products_services
            ) || null,

          deal_notes:
            normalize(
              row.deal_notes
            ) || null,
        };

        const validation =
          await validateDeal(
            deal
          );

        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            message:
              `Row ${
                row.excel_row ||
                index + 1
              } is invalid.`,
            errors:
              validation.errors,
          });
        }

        dealsToInsert.push({
          deal,
          resolved:
            validation.resolved,
        });
      }

      // ---------------------------------------------
      // START TRANSACTION
      // ---------------------------------------------

      await db.beginTransaction();

      try {
        let imported = 0;

        // -------------------------------------------
        // Insert each deal
        // -------------------------------------------

        for (
          const item of dealsToInsert
        ) {
          const {
            deal,
            resolved,
          } = item;

          const dealId =
            uuidv4();

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
              deal_stage,
              pipeline_id,
              deal_priority,
              deal_status,
              deal_notes,
              deal_source,
              assign_to
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const values = [
            dealId,
            deal.deal_name,
            deal.deal_organization,
            deal.deal_owner,
            deal.website || null,
            deal.customer_number || null,
            deal.customer_email || null,
            deal.customer_address || null,
            resolved.stage_id,
            resolved.pipeline_id,
            deal.deal_priority || "Medium",
            deal.deal_status || "Open",
            deal.deal_notes || null,
            deal.website || null,
            deal.assign_to || null,
          ];

          await db.query(
            sql,
            values
          );

          imported++;
        }

        // -------------------------------------------
        // COMMIT
        // -------------------------------------------

        await db.commit();

        return res.json({
          success: true,

          message:
            `Successfully imported ${imported} deals.`,

          imported,
        });

      } catch (dbError) {
        // -------------------------------------------
        // ROLLBACK
        // -------------------------------------------

        await db.rollback();

        throw dbError;
      }

    } catch (error) {
      console.error(
        "Bulk deal import error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to import deals.",
        error:
          error.message,
      });
    }
  }
);

module.exports = router;