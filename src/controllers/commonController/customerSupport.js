import db from "../../config/config.js";

//API 1: Customer Support
export const customerSupport = async (req, res) => {
  const { senderID, senderType, complaintTitle, complaintDescription } =
    req.body;

  try {
    // Insert the input data into the AdminComplaint table
    await db.query(
      "INSERT INTO AdminComplaint (senderID, senderType, complaintTitle, complaintDescription, complaintStatus) VALUES ($1, $2, $3, $4, $5)",
      [senderID, senderType, complaintTitle, complaintDescription, "P"]
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error: ", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

//API 2: View Customer Support Request Status
export const CustomerSupportStatus = async (req, res) => {
  const { userID, userType } = req.body;

  try {
    // Check if the user exists
    const checkUserQuery = `
      SELECT * FROM UserInformation 
      WHERE id = $1;
    `;
    const { rowCount: userCount, rows } = await db.query(checkUserQuery, [
      userID,
    ]);

    if (userCount === 0) {
      return res.status(400).json({ error: "User does not exist" });
    }

    // Retrieve customer support requests submitted by the user
    const customerSupportRequestsQuery = `
      SELECT 
      id,
      complaintTitle AS Title, 
      complaintDescription AS Description, 
      complaintStatus AS Status,
      TO_CHAR(createdOn, 'DD-MM-YYYY HH24:MI:SS') AS createdOn,
      TO_CHAR(complaintSolvedOn, 'DD-MM-YYYY HH24:MI:SS') AS complaintSolvedOn
      FROM AdminComplaint 
      WHERE senderID = $1 AND senderType = $2
      ORDER BY id DESC;
    `;
    const { rows: customerSupportRequests } = await db.query(
      customerSupportRequestsQuery,
      [userID, userType]
    );

    // Send the customer support requests as JSON
    res.status(200).json({ customerSupportRequests });
  } catch (error) {
    console.error("Error viewing customer support request status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
