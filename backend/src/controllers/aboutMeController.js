const AboutMe = require('../models/AboutMe');

exports.getAboutMe = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }

    const data = await AboutMe.find({}).sort({ createdAt: -1 });

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

    // Check if key already exists
    const existing = await AboutMe.findOne({ key: key.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Key already exists. Use update instead.' });
    }

    const item = await AboutMe.create({
      key: key.toLowerCase(),
      value,
      category: category || 'other',
      addedBy: req.user.id
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

    const item = await AboutMe.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (value) item.value = value;
    if (category) item.category = category;
    item.updatedAt = Date.now();

    await item.save();

    res.status(200).json({
      success: true,
      data: item
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

    const item = await AboutMe.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Item deleted'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
