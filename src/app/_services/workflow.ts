export const createWorkflow = async (workflowData) => {
  return;
  const response = await fetch("http://localhost:7265/workflow", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(workflowData),
  });
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

export const fetchWorkflowData = async ({ queryKey }) => {
  return;
  // Extract userAddress from queryKey[1], since queryKey will be ['workflowSave', userAddress]
  const userAddress = queryKey[1];

  // Use the dynamic userAddress in the API URL
  const response = await fetch(
    `https://localhost:7265/workflow/all?userAddress=${userAddress}`,
  );

  // Error handling
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const workflows = await response.json();

  if (workflows.length === 0) {
    const payload = {
      workFlowId: 0,
      name: "New Workflow",
      actions: [],
    };
    try {
      const putResponse = await fetch(
        `http://localhost:7265/workflow/save?userAddress=${userAddress}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      console.log("putResponse", putResponse);
    } catch (error) {
      console.log("errrr", error);
    }
  }

  console.log(await response.json());
  return response.json();
};
