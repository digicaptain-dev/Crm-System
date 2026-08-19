import { useEffect, useState } from "react";
import axios from "axios";

import PipelineHeader from "../components/pipeline/PipelineHeader";
import PipelineBoard from "../components/pipeline/PipelineBoard";
import CreatePipelineModal from "../components/pipeline/CreatePipelineModal";

import "../styles/pipeline/pipeline.css";

const API_URL = "http://localhost:1000/api";

function Pipeline() {
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * Get pipelines from backend
   */
  const fetchPipelines = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/pipelines`
      );

      console.log("Pipelines:", response.data);

      const data = response.data;

      setPipelines(data);

      /*
       * Automatically select first pipeline
       */
      if (data.length > 0) {
        setSelectedPipelineId(
          data[0].pipeline_id
        );
      }
    } catch (err) {
      console.error(
        "Fetch pipelines error:",
        err
      );

      setError(
        err.response?.data?.error ||
        err.message ||
        "Failed to fetch pipelines"
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Load pipelines when page opens
   */
  useEffect(() => {
    fetchPipelines();
  }, []);

  /*
   * Find currently selected pipeline
   */
  const selectedPipeline = pipelines.find(
    (pipeline) =>
      pipeline.pipeline_id === selectedPipelineId
  );

  /*
   * Called after pipeline is successfully created
   */
  const handleCreatePipeline = async () => {
    await fetchPipelines();

    setShowCreateModal(false);
  };

  /*
   * Loading state
   */
  if (loading) {
    return (
      <div className="pipeline-page">
        <div className="pipeline-loading">
          Loading pipelines...
        </div>
      </div>
    );
  }

  return (
    <div className="pipeline-page">

      {error && (
        <div className="pipeline-error">
          {error}
        </div>
      )}

      <PipelineHeader
        pipelines={pipelines}
        selectedPipeline={selectedPipeline}
        selectedPipelineId={selectedPipelineId}
        onPipelineChange={setSelectedPipelineId}
        onCreatePipeline={() =>
          setShowCreateModal(true)
        }
      />

      <PipelineBoard
        pipeline={selectedPipeline}
      />

      {showCreateModal && (
        <CreatePipelineModal
          onClose={() =>
            setShowCreateModal(false)
          }
          onCreate={handleCreatePipeline}
        />
      )}

    </div>
  );
}

export default Pipeline;