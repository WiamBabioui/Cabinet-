import ActivityLog from '../models/ActivityLog.js';

// ─── Helper: create activity log (can be used by other controllers) ──
export const createActivityLog = async (userId, action, module, description, patientId = null, metadata = {}) => {
  try {
    const newLog = new ActivityLog({
      userId,
      patientId,
      action,
      module,
      description,
      metadata
    });
    await newLog.save();
    return newLog;
  } catch (err) {
    console.error('createActivityLog error:', err);
    // Optionally, re-throw or handle error as appropriate for your application
  }
};

// ─── GET /api/activitylogs ───────────────────────────────
export const getActivityLogs = async (req, res) => {
  const { patientId, module, action, startDate, endDate, limit = 50, skip = 0 } = req.query;
  const userId = req.user.id; // Assuming user ID for filtering if needed

  try {
    let query = {};

    // Filter by patientId if provided
    if (patientId) {
      query.patientId = parseInt(patientId);
    }

    // Filter by module if provided
    if (module) {
      query.module = module;
    }

    // Filter by action if provided
    if (action) {
      query.action = action;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // You might want to filter by userId if logs are user-specific
    // For example, if a user can only see their own actions or actions related to patients they manage
    // query.userId = userId;

    const logs = await ActivityLog.find(query)
                                  .sort({ createdAt: -1 })
                                  .skip(parseInt(skip))
                                  .limit(parseInt(limit));

    const total = await ActivityLog.countDocuments(query);

    res.json({ logs, total });
  } catch (err) {
    console.error('getActivityLogs error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};