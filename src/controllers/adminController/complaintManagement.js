import db from "../../config/config.js";

//API 1: Complaint List
export const getAdminComplaints = async (req, res) => {
  try {
    // Query to retrieve admin complaints ordered by ID in descending order
    const adminComplaintsQuery = `
        SELECT 
          AC.id,
          AC.senderID,
          CONCAT(UI.firstName, ' ', UI.lastName) AS senderName,
          AC.senderType,
          AC.complaintTitle,
          AC.complaintDescription,
          AC.complaintStatus,
          TO_CHAR(AC.createdOn, 'DD-MM-YYYY') AS complaintDate,
          TO_CHAR(AC.createdOn, 'HH24:MI:SS') AS complaintTime
        FROM AdminComplaint AC
        JOIN UserInformation UI ON AC.senderID = UI.id
        ORDER BY AC.id DESC;
      `;

    const { rows } = await db.query(adminComplaintsQuery);

    // Send admin complaints as JSON
    res.status(200).json({ adminComplaints: rows });
  } catch (error) {
    console.error("Error retrieving admin complaints:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
