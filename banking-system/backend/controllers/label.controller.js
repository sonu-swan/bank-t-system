const Label = require('../models/Label.model');
const { asyncHandler } = require('../middleware/error.middleware');

exports.getByProject = asyncHandler(async (req, res) => {
  const labels = await Label.find({ project: req.params.projectId }).sort('name');
  res.json({ success: true, data: labels });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, color } = req.body;
  const label = await Label.create({ name, color, project: req.params.projectId, createdBy: req.user._id });
  res.status(201).json({ success: true, data: label });
});

exports.update = asyncHandler(async (req, res) => {
  const label = await Label.findByIdAndUpdate(req.params.labelId, req.body, { new: true });
  if (!label) return res.status(404).json({ success: false, message: 'Label not found.' });
  res.json({ success: true, data: label });
});

exports.remove = asyncHandler(async (req, res) => {
  await Label.findByIdAndDelete(req.params.labelId);
  res.json({ success: true, message: 'Label deleted.' });
});
