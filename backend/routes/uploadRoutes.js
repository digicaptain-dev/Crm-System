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
  const deal = {
    excel_row: excelRowNumber,

    deal_name: normalize(
      getCell(row, [
        "Deal Name",
        "DealName",
      ])
    ),

    deal_owner: normalize(
      getCell(row, [
        "Deal Owner",
        "DealOwner",
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

    deal_value: parseNumber(
      getCell(row, [
        "Deal Value",
        "Value",
      ])
    ),

    customer_email: normalize(
      getCell(row, [
        "Customer Email",
        "Email",
        "Email ID",
      ])
    ),

    close_date: normalizeDate(
      getCell(row, [
        "Close Date",
        "CloseDate",
      ])
    ),

    deal_source: normalize(
      getCell(row, [
        "Deal Source",
        "Source",
      ])
    ),

    deal_priority: normalize(
      getCell(row, [
        "Priority",
        "Deal Priority",
      ])
    ),

    deal_status: normalize(
      getCell(row, [
        "Status",
        "Deal Status",
      ])
    ),

    probability: parseProbability(
      getCell(row, [
        "Probability",
      ])
    ),

    tags: normalize(
      getCell(row, [
        "Tags",
      ])
    ),

    currency: normalize(
      getCell(row, [
        "Currency",
      ])
    ),

    team_members: normalize(
      getCell(row, [
        "Team Members",
        "TeamMembers",
      ])
    ),

    deal_organization: normalize(
      getCell(row, [
        "Organization",
        "Deal Organization",
      ])
    ),

    contact_person: normalize(
      getCell(row, [
        "Contact Person",
        "ContactPerson",
        "Name",
      ])
    ),

    assign_to: normalize(
      getCell(row, [
        "Assign To",
        "AssignTo",
      ])
    ),

    time_zone: normalize(
      getCell(row, [
        "Time Zone",
        "Timezone",
      ])
    ),

    customer_number: normalize(
      getCell(row, [
        "Customer Number",
        "Number",
        "Phone",
      ])
    ),

    customer_address: normalize(
      getCell(row, [
        "Customer Address",
        "Address",
      ])
    ),

    products_services: normalize(
      getCell(row, [
        "Products/Services",
        "Products Services",
        "Products",
        "Services",
      ])
    ),

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
  // Required fields
  // -----------------------------------------------

  if (!deal.deal_name) {
    errors.push(
      "Deal Name is required."
    );
  }

  if (!deal.deal_owner) {
    errors.push(
      "Deal Owner is required."
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
  // Validate email
  // -----------------------------------------------

  if (
    deal.customer_email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      deal.customer_email
    )
  ) {
    errors.push(
      "Customer Email is invalid."
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
      "Closed Lost",
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
  // Validate value
  // -----------------------------------------------

  const rawValue =
    deal.deal_value;

  if (
    rawValue !== null &&
    rawValue !== undefined &&
    rawValue !== ""
  ) {
    if (
      !Number.isFinite(
        Number(rawValue)
      )
    ) {
      errors.push(
        "Deal Value must be a valid number."
      );
    }
  }

  // -----------------------------------------------
  // Validate probability
  // -----------------------------------------------

  if (
    deal.probability !== null &&
    deal.probability !== undefined
  ) {
    if (
      deal.probability < 0 ||
      deal.probability > 100
    ) {
      errors.push(
        "Probability must be between 0 and 100."
      );
    }
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
              deal_value,
              deal_stage,
              deal_owner,
              customer_email,
              close_date,
              deal_source,
              deal_priority,
              deal_status,
              deal_notes,
              products_services,
              pipeline_id,
              probability,
              tags,
              currency,
              team_members,
              deal_organization,
              contact_person,
              assign_to,
              time_zone,
              customer_number,
              customer_address
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const values = [
            dealId,

            deal.deal_name,

            deal.deal_value,

            resolved.stage_id,

            deal.deal_owner,

            deal.customer_email,

            deal.close_date,

            deal.deal_source,

            deal.deal_priority,

            deal.deal_status,

            deal.deal_notes,

            deal.products_services,

            resolved.pipeline_id,

            deal.probability,

            deal.tags,

            deal.currency,

            deal.team_members,

            deal.deal_organization,

            deal.contact_person,

            deal.assign_to,

            deal.time_zone,

            deal.customer_number,

            deal.customer_address,
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