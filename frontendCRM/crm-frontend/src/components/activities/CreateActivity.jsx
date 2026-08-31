import ActivityForm from "./ActivityForm";

function CreateActivity({
  onClose,
  onCreate,
  selectedDate,
}) {
  const handleCreated = (activity) => {
    if (onCreate) {
      onCreate(activity);
    }
  };

  return (
    <ActivityForm
      selectedDate={selectedDate}
      onClose={onClose}
      onCreated={handleCreated}
    />
  );
}

export default CreateActivity;