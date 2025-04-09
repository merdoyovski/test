import axios from "axios";
import crypto from "crypto";

const BASE_URL = "https://localhost:7023";

// Create a singleton instance of axios with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface WorkflowAction {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: {
    label: string;
    isActive: boolean;
    args: Record<string, any>;
    groupId: number;
    orderId: number;
  };
  width: number;
  height: number;
  selected: boolean;
  positionAbsolute: {
    x: number;
    y: number;
  };
  dragging: boolean;
}

export interface WorkflowResponse {
  id: string;
  name: string;
  creationDate: string;
  actions: WorkflowAction[];
}

export interface SaveWorkflowRequest {
  ID?: string;
  Name?: string;
  Actions: {
    Type: number;
    Name?: string;
    Node: string;
  }[];
}

export const getAuthToken = async (userAddress: string): Promise<string> => {
  try {
    const response = await fetch(
      `/api/auth?userAddress=${encodeURIComponent(userAddress)}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch auth token");
    }

    const data = await response.json();
    const token = data.token;

    // Store the token in localStorage
    localStorage.setItem("auth_token", token);
    return token;
  } catch (error) {
    console.error("Error getting auth token:", error);
    throw error;
  }
};

export const fetchWorkflows = async (
  userAddress: string,
): Promise<WorkflowResponse[]> => {
  try {
    // First get the auth token
    await getAuthToken(userAddress);

    // Then fetch workflows with the token
    const response = await apiClient.get<WorkflowResponse[]>("/workflow/all");
    return response.data;
  } catch (error) {
    console.error("Error fetching workflows:", error);
    throw error;
  }
};

export const saveWorkflow = async (
  workflowData: SaveWorkflowRequest,
): Promise<void> => {
  try {
    await apiClient.post("/workflow", workflowData);
  } catch (error) {
    console.error("Error saving workflow:", error);
    throw error;
  }
};
