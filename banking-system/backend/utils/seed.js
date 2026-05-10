require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const Project = require('../models/Project.model');
const Task = require('../models/Task.model');
const Notification = require('../models/Notification.model');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Clearing old data...');
  await Promise.all([User.deleteMany(), Project.deleteMany(), Task.deleteMany(), Notification.deleteMany()]);

  const pass = await bcrypt.hash('demo1234', 12);
  const [admin, u2, u3, u4] = await User.insertMany([
    { name: 'Priya Mehta',  email: 'admin@taskflow.io', password: pass, role: 'admin',  isActive: true },
    { name: 'Arjun Shah',   email: 'arjun@taskflow.io', password: pass, role: 'member', isActive: true },
    { name: 'Kavya Rao',    email: 'kavya@taskflow.io', password: pass, role: 'member', isActive: true },
    { name: 'Rahul Das',    email: 'rahul@taskflow.io', password: pass, role: 'member', isActive: true },
  ]);

  const p1 = await Project.create({
    name: 'PayFlow Redesign',
    description: 'Complete UI overhaul of the payment dashboard',
    color: '#58a6ff', createdBy: admin._id,
    members: [{ user: admin._id, role: 'lead' }, { user: u2._id, role: 'member' }, { user: u3._id, role: 'member' }],
  });
  const p2 = await Project.create({
    name: 'Mobile App v2',
    description: 'Native iOS and Android builds with offline support',
    color: '#bc8cff', createdBy: admin._id,
    members: [{ user: admin._id, role: 'lead' }, { user: u2._id, role: 'member' }, { user: u4._id, role: 'member' }],
  });
  const p3 = await Project.create({
    name: 'API Gateway',
    description: 'Migrate all services to GraphQL federation',
    color: '#3fb950', createdBy: admin._id,
    members: [{ user: admin._id, role: 'lead' }, { user: u3._id, role: 'member' }, { user: u4._id, role: 'member' }],
  });

  const now = new Date();
  const past = d => new Date(now - d * 86400000);
  const future = d => new Date(+now + d * 86400000);

  const tasks = await Task.insertMany([
    { title: 'Set up component library',    project: p1._id, createdBy: admin._id, assignee: u2._id, status: 'done',        priority: 'high',   dueDate: past(15),    completedAt: past(16), statusHistory: [{ from: null, to: 'done', changedBy: admin._id }] },
    { title: 'Design token system',         project: p1._id, createdBy: admin._id, assignee: u3._id, status: 'done',        priority: 'medium', dueDate: past(10),    completedAt: past(11), statusHistory: [{ from: null, to: 'done', changedBy: admin._id }] },
    { title: 'Dashboard wireframes',        project: p1._id, createdBy: admin._id, assignee: u2._id, status: 'in-progress', priority: 'high',   dueDate: future(6),   statusHistory: [{ from: null, to: 'in-progress', changedBy: admin._id }] },
    { title: 'User research interviews',    project: p1._id, createdBy: admin._id, assignee: admin._id, status: 'todo',     priority: 'medium', dueDate: future(10),  statusHistory: [{ from: null, to: 'todo', changedBy: admin._id }] },
    { title: 'Onboarding flow screens',     project: p2._id, createdBy: admin._id, assignee: u3._id, status: 'in-progress', priority: 'high',   dueDate: future(4),   statusHistory: [{ from: null, to: 'in-progress', changedBy: admin._id }] },
    { title: 'Offline sync architecture',   project: p2._id, createdBy: admin._id, assignee: u4._id, status: 'todo',        priority: 'high',   dueDate: future(15),  statusHistory: [{ from: null, to: 'todo', changedBy: admin._id }] },
    { title: 'Push notification setup',     project: p2._id, createdBy: admin._id, assignee: u2._id, status: 'todo',        priority: 'low',    dueDate: future(20),  statusHistory: [{ from: null, to: 'todo', changedBy: admin._id }] },
    { title: 'GraphQL schema design',       project: p3._id, createdBy: admin._id, assignee: admin._id, status: 'done',    priority: 'high',   dueDate: past(8),     completedAt: past(9), statusHistory: [{ from: null, to: 'done', changedBy: admin._id }] },
    { title: 'Auth service migration',      project: p3._id, createdBy: admin._id, assignee: u4._id, status: 'in-progress', priority: 'high',   dueDate: future(7),   statusHistory: [{ from: null, to: 'in-progress', changedBy: admin._id }] },
    { title: 'Rate limiting middleware',    project: p3._id, createdBy: admin._id, assignee: u3._id, status: 'todo',        priority: 'medium', dueDate: past(2),     statusHistory: [{ from: null, to: 'todo', changedBy: admin._id }] },
    { title: 'Error monitoring setup',      project: p3._id, createdBy: admin._id, assignee: u4._id, status: 'todo',        priority: 'high',   dueDate: past(1),     statusHistory: [{ from: null, to: 'todo', changedBy: admin._id }] },
    { title: 'Write API documentation',     project: p1._id, createdBy: admin._id, assignee: u3._id, status: 'in-review',  priority: 'medium', dueDate: future(3),   statusHistory: [{ from: null, to: 'in-review', changedBy: admin._id }] },
  ]);

  // Seed notifications for all users
  const notifDocs = [
    { recipient: u2._id, actor: admin._id, type: 'task_assigned',       title: 'New task assigned',         message: 'Priya assigned "Dashboard wireframes" to you',              link: `/tasks/${tasks[2]._id}`, read: false },
    { recipient: u3._id, actor: admin._id, type: 'task_assigned',       title: 'New task assigned',         message: 'Priya assigned "Write API documentation" to you',           link: `/tasks/${tasks[11]._id}`, read: false },
    { recipient: u4._id, actor: admin._id, type: 'task_overdue',        title: 'Task overdue',              message: '"Error monitoring setup" is past its due date',             link: `/tasks/${tasks[10]._id}`, read: false },
    { recipient: u3._id, actor: admin._id, type: 'task_overdue',        title: 'Task overdue',              message: '"Rate limiting middleware" is past its due date',           link: `/tasks/${tasks[9]._id}`, read: true },
    { recipient: u2._id, actor: admin._id, type: 'project_member_added', title: 'Added to project',        message: 'You were added to "PayFlow Redesign"',                      link: `/projects/${p1._id}`,    read: true },
    { recipient: u4._id, actor: admin._id, type: 'project_member_added', title: 'Added to project',        message: 'You were added to "Mobile App v2"',                         link: `/projects/${p2._id}`,    read: true },
    { recipient: admin._id, actor: u2._id, type: 'comment_added',       title: 'New comment',              message: 'Arjun commented on "Dashboard wireframes"',                 link: `/tasks/${tasks[2]._id}`, read: false },
  ];
  await Notification.insertMany(notifDocs);

  console.log('\n✅  Seed complete!\n');
  console.log('  admin@taskflow.io / demo1234  →  Admin (Priya Mehta)');
  console.log('  arjun@taskflow.io / demo1234  →  Member');
  console.log('  kavya@taskflow.io / demo1234  →  Member');
  console.log('  rahul@taskflow.io / demo1234  →  Member\n');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
