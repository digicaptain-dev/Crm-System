import { useState } from "react";

function CreateDeal({
  onClose,
  onCreate,
  pipelines = [],
}) {
  const [form, setForm] = useState({
    deal_name: "",
    deal_organization: "",
    customer_email: "",
    deal_owner: "",
    deal_value: "",
    deal_priority: "Medium",

    pipeline_id: "",
    deal_stage: "",

    deal_status: "Open",

    contact_person: "",
    customer_number: "",
    customer_address: "",
    deal_notes: "",
  });

  // =====================================================
  // ROLE CHECK
  // =====================================================

  let currentUser = null;

  try {
    currentUser = JSON.parse(
      localStorage.getItem("user")
    );
  } catch (error) {
    console.error(
      "Failed to read logged-in user:",
      error
    );
  }

  const isAdmin =
    currentUser?.role === "admin";

  // =====================================================
  // HANDLE INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm((current) => ({
      ...current,

      [name]: value,

      /*
       * Pipeline change hone par
       * stage reset.
       */
      ...(name === "pipeline_id"
        ? {
            deal_stage: "",
          }
        : {}),
    }));
  };

  // =====================================================
  // SELECTED PIPELINE
  // =====================================================

  const selectedPipeline =
    pipelines.find(
      (pipeline) =>
        pipeline.pipeline_id ===
        form.pipeline_id
    );

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = (e) => {
    e.preventDefault();

    /*
     * Additional frontend permission guard.
     */

    if (!isAdmin) {
      alert(
        "You do not have permission to create deals."
      );
      return;
    }

    // Deal name validation

    if (
      !form.deal_name.trim()
    ) {
      alert(
        "Please enter deal name."
      );
      return;
    }

    // Pipeline validation

    if (!form.pipeline_id) {
      alert(
        "Please select a pipeline."
      );
      return;
    }

    // Stage validation

    if (!form.deal_stage) {
      alert(
        "Please select a stage."
      );
      return;
    }

    // ===================================================
    // PREPARE DEAL DATA
    // ===================================================

    const dealData = {
      deal_name:
        form.deal_name.trim(),

      deal_organization:
        form.deal_organization.trim() ||
        null,

      customer_email:
        form.customer_email.trim() ||
        null,

      deal_owner:
        form.deal_owner.trim() ||
        null,

      deal_value:
        form.deal_value
          ? Number(
              form.deal_value
            )
          : null,

      deal_priority:
        form.deal_priority,

      pipeline_id:
        form.pipeline_id,

      deal_stage:
        Number(
          form.deal_stage
        ),

      deal_status:
        form.deal_status,

      contact_person:
        form.contact_person.trim() ||
        null,

      customer_number:
        form.customer_number.trim() ||
        null,

      customer_address:
        form.customer_address.trim() ||
        null,

      deal_notes:
        form.deal_notes.trim() ||
        null,
    };

    console.log(
      "Deal data being sent:",
      dealData
    );

    onCreate(dealData);
  };

  // =====================================================
  // RENDER
  // =====================================================

  /*
   * This component should normally never be rendered
   * for a normal user because Deals.jsx protects it.
   *
   * This is an additional safety layer.
   */

  if (!isAdmin) {
    return null;
  }

  return (
    <form
      onSubmit={handleSubmit}
    >

      {/* =================================================
          PIPELINE
      ================================================= */}

      <div className="form-group">

        <label>
          Pipeline
        </label>

        <select
          name="pipeline_id"
          value={
            form.pipeline_id
          }
          onChange={
            handleChange
          }
          required
        >

          <option value="">
            Select Pipeline
          </option>

          {pipelines.map(
            (pipeline) => (
              <option
                key={
                  pipeline.pipeline_id
                }
                value={
                  pipeline.pipeline_id
                }
              >
                {
                  pipeline.pipeline_name
                }
              </option>
            )
          )}

        </select>

      </div>

      {/* =================================================
          STAGE
      ================================================= */}

      <div className="form-group">

        <label>
          Stage
        </label>

        <select
          name="deal_stage"
          value={
            form.deal_stage
          }
          onChange={
            handleChange
          }
          required
          disabled={
            !selectedPipeline
          }
        >

          <option value="">
            {selectedPipeline
              ? "Select Stage"
              : "Select Pipeline First"}
          </option>

          {selectedPipeline?.stages
            ?.slice()
            .sort(
              (a, b) =>
                a.stage_order -
                b.stage_order
            )
            .map(
              (stage) => (
                <option
                  key={
                    stage.stage_id
                  }
                  value={
                    stage.stage_id
                  }
                >
                  {
                    stage.stage_name
                  }
                </option>
              )
            )}

        </select>

      </div>

      {/* =================================================
          DEAL NAME
      ================================================= */}

      <div className="form-group">

        <label>
          Deal Name
        </label>

        <input
          name="deal_name"
          value={
            form.deal_name
          }
          onChange={
            handleChange
          }
          placeholder="Enter deal name"
          required
        />

      </div>

      {/* =================================================
          ORGANIZATION
      ================================================= */}

      <div className="form-group">

        <label>
          Organization
        </label>

        <input
          name="deal_organization"
          value={
            form.deal_organization
          }
          onChange={
            handleChange
          }
          placeholder="Enter organization"
        />

      </div>

      {/* =================================================
          EMAIL
      ================================================= */}

      <div className="form-group">

        <label>
          Email
        </label>

        <input
          type="email"
          name="customer_email"
          value={
            form.customer_email
          }
          onChange={
            handleChange
          }
          placeholder="customer@example.com"
        />

      </div>

      {/* =================================================
          CONTACT PERSON
      ================================================= */}

      <div className="form-group">

        <label>
          Contact Person
        </label>

        <input
          name="contact_person"
          value={
            form.contact_person
          }
          onChange={
            handleChange
          }
          placeholder="Enter contact person"
        />

      </div>

      {/* =================================================
          PHONE
      ================================================= */}

      <div className="form-group">

        <label>
          Phone
        </label>

        <input
          name="customer_number"
          value={
            form.customer_number
          }
          onChange={
            handleChange
          }
          placeholder="Enter phone number"
        />

      </div>

      {/* =================================================
          OWNER
      ================================================= */}

      <div className="form-group">

        <label>
          Owner
        </label>

        <input
          name="deal_owner"
          value={
            form.deal_owner
          }
          onChange={
            handleChange
          }
          placeholder="Enter owner"
        />

      </div>

      {/* =================================================
          DEAL VALUE
      ================================================= */}

      <div className="form-group">

        <label>
          Deal Value
        </label>

        <input
          type="number"
          name="deal_value"
          value={
            form.deal_value
          }
          onChange={
            handleChange
          }
          placeholder="10000"
        />

      </div>

      {/* =================================================
          PRIORITY
      ================================================= */}

      <div className="form-group">

        <label>
          Priority
        </label>

        <select
          name="deal_priority"
          value={
            form.deal_priority
          }
          onChange={
            handleChange
          }
        >

          <option value="High">
            High
          </option>

          <option value="Medium">
            Medium
          </option>

          <option value="Low">
            Low
          </option>

        </select>

      </div>

      {/* =================================================
          STATUS
      ================================================= */}

      <div className="form-group">

        <label>
          Status
        </label>

        <select
          name="deal_status"
          value={
            form.deal_status
          }
          onChange={
            handleChange
          }
        >

          <option value="Open">
            Open
          </option>

          <option value="Won">
            Won
          </option>

          <option value="Lost">
            Lost
          </option>

        </select>

      </div>

      {/* =================================================
          ADDRESS
      ================================================= */}

      <div className="form-group">

        <label>
          Customer Address
        </label>

        <input
          name="customer_address"
          value={
            form.customer_address
          }
          onChange={
            handleChange
          }
          placeholder="Enter address"
        />

      </div>

      {/* =================================================
          NOTES
      ================================================= */}

      <div className="form-group">

        <label>
          Notes
        </label>

        <textarea
          name="deal_notes"
          value={
            form.deal_notes
          }
          onChange={
            handleChange
          }
          placeholder="Enter deal notes"
          rows="3"
        />

      </div>

      {/* =================================================
          ACTIONS
      ================================================= */}

      <div className="form-actions">

        <button
          type="button"
          className="secondary-button"
          onClick={
            onClose
          }
        >
          Cancel
        </button>

        <button
          type="submit"
          className="primary-button"
        >
          Create Deal
        </button>

      </div>

    </form>
  );
}

export default CreateDeal;