import db from "../../config/config.js";

// API 1: Fetch My Ratings
export const fetchMyRatings = async (req, res) => {
  try {
    const { userID, userType } = req.body;

    // Query to fetch ratings given to the user
    const query = `
      SELECT 
          rt.id,
          CONCAT(p.propertyAddress, ', ', a.areaName, ', ', c.cityName) AS address,
          CONCAT(ui.firstName, ' ', ui.lastName) AS userName,
          rt.ratedbyType As userType,
          rt.ratingStars,
          rt.ratingOpinon,
          rt.ratingComment,
          TO_CHAR(rt.ratedOn, 'DD-MM-YYYY HH24:MI') as ratedOn,
          EXTRACT(DAY FROM AGE(COALESCE(rt.ratingEndDate, CURRENT_TIMESTAMP), rt.ratingStartDate)) AS contractDays
      FROM Rating rt
      JOIN Property p ON rt.propertyID = p.id
      JOIN Area a ON p.areaID = a.id
      JOIN City c ON a.cityID = c.id
      JOIN UserInformation ui ON rt.ratedByID = ui.id
      WHERE rt.userID = $1 AND rt.userType = $2 AND rt.ratingStatus = 'R'
      ORDER BY rt.id DESC;
    `;

    // Execute the query
    const result = await db.query(query, [userID, userType]);

    // Send the ratings as the response
    return res.status(200).json({
      success: result.rows,
    });
  } catch (error) {
    console.error("Error fetching my ratings:", error);
    return res.status(500).json({
      success: error.message,
    });
  }
};

// API 2: Fetch Given Ratings
export const fetchGivenRatings = async (req, res) => {
  try {
    const { userID, userType } = req.body;

    // Query to fetch ratings given by the user
    const query = `
    SELECT 
        rt.id,
        CONCAT(p.propertyAddress, ', ', a.areaName, ', ', c.cityName) AS address,
        CONCAT(ui.firstName, ' ', ui.lastName) AS userName,
        rt.userType As userType,
        rt.ratingStars,
        rt.ratingOpinon,
        rt.ratingComment,
        TO_CHAR(rt.ratedOn, 'DD-MM-YYYY HH24:MI') as ratedOn,
        EXTRACT(DAY FROM AGE(COALESCE(rt.ratingEndDate, CURRENT_TIMESTAMP), rt.ratingStartDate)) AS contractDays
    FROM Rating rt
    JOIN Property p ON rt.propertyID = p.id
    JOIN Area a ON p.areaID = a.id
    JOIN City c ON a.cityID = c.id
    JOIN UserInformation ui ON rt.userID = ui.id
    WHERE rt.ratedByID = $1 AND rt.ratedByType = $2 AND rt.ratingStatus = 'R'
    ORDER BY rt.id DESC;
    `;

    // Execute the query
    const result = await db.query(query, [userID, userType]);

    // Send the ratings as the response
    return res.status(200).json({
      success: result.rows,
    });
  } catch (error) {
    console.error("Error fetching given ratings:", error);
    return res.status(500).json({
      success: error.message,
    });
  }
};

// API 3: Fetch Pending Ratings
export const fetchPendingRatings = async (req, res) => {
  try {
    const { userID, userType } = req.body;

    // Query to fetch pending ratings for the user
    const query = `
    SELECT
        rt.id,
        CONCAT(p.propertyAddress, ', ', a.areaName, ', ', c.cityName) AS address,
        CONCAT(ui.firstName, ' ', ui.lastName) AS userName,
        rt.userType As userType,
        rt.ratedbyType As raterType,
        TO_CHAR(rt.ratingStartDate, 'DD-MM-YYYY HH24:MI') as ratingStartDate
    FROM Rating rt
    JOIN Property p ON rt.propertyID = p.id
    JOIN Area a ON p.areaID = a.id
    JOIN City c ON a.cityID = c.id
    JOIN UserInformation ui ON rt.userID = ui.id
    WHERE rt.ratedByID = $1 AND rt.ratedByType = $2 AND rt.ratingStatus = 'P'
    ORDER BY rt.id DESC;
    `;

    // Execute the query
    const result = await db.query(query, [userID, userType]);

    // Send the ratings as the response
    return res.status(200).json({
      success: result.rows,
    });
  } catch (error) {
    console.error("Error fetching pending ratings:", error);
    return res.status(500).json({
      success: "Failed to fetch pending ratings.",
      message: error.message,
    });
  }
};

// API 4: Submit Rating
export const submitRating = async (req, res) => {
  try {
    const { ratingID, ratingStars, ratingOpinon, ratingComment } = req.body;

    // Check if the variables are not empty
    if (!ratingID || !ratingStars || !ratingOpinon || !ratingComment) {
      return res.status(400).json({
        success: "Please fill all the fields.",
      });
    }

    // Query to update the rating
    const query = `
    UPDATE Rating
    SET
        ratingStars = $1,
        ratingOpinon = $2,
        ratingComment = $3,
        ratingStatus = 'R',
        ratedOn = CURRENT_TIMESTAMP
    WHERE id = $4;
    `;

    // Execute the query
    await db.query(query, [ratingStars, ratingOpinon, ratingComment, ratingID]);

    // Send the success response
    return res.status(200).json({
      success: "Rating submitted successfully.",
    });
  } catch (error) {
    console.error("Error submitting rating:", error);
    return res.status(500).json({
      success: "Failed to submit rating.",
      message: error.message,
    });
  }
};
