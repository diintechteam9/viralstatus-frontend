Client API Key Documentation
This document outlines how to use the new Client API Key feature to securely authenticate clients across your different projects without requiring an email and password.

1. Login with API Key
This is the primary endpoint your external project will call to log in a user and retrieve their JWT session token.

Endpoint: POST /api/client/login-with-key
Description: Authenticates a client using their secret 32-character API key and returns a valid JWT token and client details.

Request Body
json

{
  "clientKey": "ce53b60bcf5042f86fb364bbedccc9dd" // Replace with the actual key
}
Response (Success 200)
json

{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "client": {
    "_id": "6a8dc803f24cd086e1a06ff9",
    "name": "Diintechteam9",
    "email": "mobishala@gmail.com",
    "businessName": "Mobishaala Edutech Private Limited",
    "gstNo": "NAN",
    "panNo": "NAN",
    "city": "Banglore",
    "pincode": "560034",
    "websiteUrl": "https://diintech.com"
  }
}
Example Usage (JavaScript / Node.js)
javascript

async function loginWithKey(secretKey) {
  try {
    const response = await fetch("http://YOUR_BACKEND_URL/api/client/login-with-key", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ clientKey: secretKey })
    });
    const data = await response.json();
    if (data.success) {
      console.log("Login Successful!");
      console.log("Save this token for future requests:", data.token);
      return data;
    } else {
      console.error("Login Failed:", data.message);
    }
  } catch (error) {
    console.error("Network Error:", error);
  }
}
2. API Key Management Endpoints (Internal)
These endpoints are used internally by the React frontend (Client Dashboard) to manage the keys. They require a valid JWT token (Authorization: Bearer <token>).

NOTE

You likely don't need to call these from your external project, as they are already integrated into your frontend dashboard.

Fetch Current Key
Endpoint: GET /api/client/key
Description: Returns the client's current active key.
Generate New Key
Endpoint: POST /api/client/key/generate
Description: Securely generates a brand new 32-character key and overwrites the old one. Any system using the old key will instantly be disconnected.
Revoke (Delete) Key
Endpoint: DELETE /api/client/key
Description: Permanently deletes the client's key from the database. After calling this, the client cannot log in via API key until a new one is generated.
