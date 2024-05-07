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
          TO_CHAR(AC.createdOn, 'HH24:MI:SS') AS complaintTime,
          TO_CHAR(AC.complaintSolvedOn, 'DD-MM-YYYY HH24:MI:SS') AS complaintSolvedOn
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

//API 2: Set the status of a complaint to in-progress
export const setStatusInProgress = async (req, res) => {
  const { complaintID } = req.body;

  try {
    // Check if the complaint exists
    const checkQuery = `SELECT * FROM AdminComplaint WHERE id = $1;`;
    const { rowCount } = await db.query(checkQuery, [complaintID]);

    if (rowCount === 0) {
      return res.status(400).json({ error: "Complaint does not exist" });
    }

    //Check if the complaint is pending
    const checkPendingQuery = `SELECT * FROM AdminComplaint WHERE id = $1 AND complaintStatus = 'P';`;
    const { rowCount: pendingCount } = await db.query(checkPendingQuery, [
      complaintID,
    ]);

    if (pendingCount === 0) {
      return res
        .status(400)
        .json({ error: "Complaint is not in pending status" });
    }

    // Update the status of the complaint to in-progress
    const updateQuery = `
        UPDATE AdminComplaint
        SET complaintStatus = 'I'
        WHERE id = $1;
      `;
    await db.query(updateQuery, [complaintID]);

    // Send success response
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error setting complaint status to in-progress:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// API 3: Set the status of a complaint to solved
export const setStatusSolved = async (req, res) => {
  const { complaintID } = req.body;

  try {
    // Check if the complaint exists
    const checkQuery = `SELECT * FROM AdminComplaint WHERE id = $1;`;
    const {
      rows: [complaint],
      rowCount,
    } = await db.query(checkQuery, [complaintID]);

    if (rowCount === 0) {
      return res.status(400).json({ error: "Complaint does not exist" });
    }

    //Check if the complaint is in-progress
    if (complaint.complaintstatus !== "I") {
      return res
        .status(400)
        .json({ error: "Complaint is not in in-progress status" });
    }

    // Update the status of the complaint to solved and set the complaintSolvedOn timestamp
    const updateQuery = `
        UPDATE AdminComplaint
        SET complaintStatus = 'S',
            complaintSolvedOn = CURRENT_TIMESTAMP
        WHERE id = $1;
      `;
    await db.query(updateQuery, [complaintID]);

    // Send success response
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error setting complaint status to solved:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//API 4: Reject a complaint
export const rejectComplaint = async (req, res) => {
  const { complaintID } = req.body;

  try {
    // Check if the complaint exists
    const checkQuery = `SELECT * FROM AdminComplaint WHERE id = $1;`;
    const {
      rows: [complaint],
      rowCount,
    } = await db.query(checkQuery, [complaintID]);

    if (rowCount === 0) {
      return res.status(400).json({ error: "Complaint does not exist" });
    }

    // Mapping of status codes to their descriptions
    const statusDescriptions = {
      P: "pending",
      I: "In-progress",
      S: "Solved",
      R: "Rejected",
    };

    //Check if the complaint is pending
    if (complaint.complaintstatus !== "P") {
      const currentStatus = statusDescriptions[complaint.complaintstatus];
      return res.status(400).json({
        error: `Complaint is in ${currentStatus} status, only pending complaints can be rejected`,
      });
    }

    // Update the status of the complaint to rejected
    const updateQuery = `
          UPDATE AdminComplaint
          SET complaintStatus = 'R'
          WHERE id = $1;
        `;
    await db.query(updateQuery, [complaintID]);

    // Send success response with the updated status
    res.status(200).json({ success: true, status: "R" });
  } catch (error) {
    console.error("Error rejecting complaint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
