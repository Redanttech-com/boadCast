import { getToken } from "@react-native-firebase/messaging";


export const tokenProvider = async () => {
  try {
    // Replace with your Firebase Cloud Function or API endpoint URL
    const functionUrl = "https://your-cloud-function-url/stream-token";

    // Fetch the Clerk session token
    const clerkToken = await getToken();

    const response = await fetch(functionUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clerkToken}`, // Include the Clerk token
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch token: ${response.statusText}`);
    }

    const data = await response.json();
    // Assuming the API response contains a `token` property
    return data.token;
  } catch (error) {
    console.error("Error in tokenProvider:", error);
    throw error;
  }
};
