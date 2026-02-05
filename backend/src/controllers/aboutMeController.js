const AboutMe = require('../models/AboutMe');

/**
 * AboutMe Controller - Firestore-based
 * Admin-only access
 * Data stored per admin: aboutMe/{adminUid}/facts/{factId}
 */

exports.getAboutMe = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }

    // Get facts for the current admin
    const data = await AboutMe.getAllFacts(req.user.uid);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addAboutMe = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }

    const { key, value, category } = req.body;

    // Check if key already exists for this admin
    const existing = await AboutMe.searchByKey(req.user.uid, key.toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: 'Key already exists. Use update instead.' });
    }

    // Add fact for current admin
    const item = await AboutMe.addFact(req.user.uid, {
      key: key.toLowerCase(),
      value,
      category: category || 'other'
    });

    res.status(201).json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAboutMe = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }

    const { id } = req.params;
    const { value, category } = req.body;

    const item = await AboutMe.getFact(req.user.uid, id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const updates = {};
    if (value) updates.value = value;
    if (category) updates.category = category;

    const updated = await AboutMe.updateFact(req.user.uid, id, updates);

    res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAboutMe = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }

    const { id } = req.params;

    const item = await AboutMe.getFact(req.user.uid, id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    await AboutMe.deleteFact(req.user.uid, id);

    res.status(200).json({
      success: true,
      message: 'Item deleted'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
