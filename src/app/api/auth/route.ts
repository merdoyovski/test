import { NextResponse } from "next/server";
import crypto from "crypto";
import https from "https";
import axios from "axios";

const BASE_URL = "https://localhost:7023";
const API_KEY = process.env.API_KEY || "";

// Create an axios instance with SSL verification disabled
const apiClient = axios.create({
  baseURL: BASE_URL,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get("userAddress");

    if (!userAddress) {
      return NextResponse.json(
        { error: "User address is required" },
        { status: 400 },
      );
    }

    // Create query string with all parameters except 'q'
    const queryParams = new URLSearchParams();
    queryParams.append("userAddress", userAddress);

    // Create the hash for 'q' parameter
    const queryString = queryParams.toString();
    const stringToHash = queryString + "&apiKey=" + API_KEY;
    console.log("stringToHash", stringToHash);

    const hash = crypto.createHash("sha512").update(stringToHash).digest("hex");

    // Add the hash to the query parameters
    queryParams.append("q", hash);

    // Make request to the authentication endpoint
    const response = await apiClient.get("/auth/token", {
      params: Object.fromEntries(queryParams),
    });

    return NextResponse.json({ token: response.data });
  } catch (error) {
    console.error("Error getting auth token:", error);
    return NextResponse.json(
      { error: "Failed to get auth token" },
      { status: 500 },
    );
  }
}
