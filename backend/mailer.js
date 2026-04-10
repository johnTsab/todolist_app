const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Simpl" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

const templates = {
  taskCreated: (username, title) => ({
    subject: 'New Task Created',
    html: `<p>Hi <b>${username}</b>, your task <b>"${title}"</b> was created successfully.</p>`
  }),
  taskDeleted: (username, title) => ({
    subject: 'Task Deleted',
    html: `<p>Hi <b>${username}</b>, your task <b>"${title}"</b> was deleted.</p>`
  }),
  taskCompleted: (username, title) => ({
    subject: 'Task Completed',
    html: `<p>Hi <b>${username}</b>, your task <b>"${title}"</b> was marked as complete. 🎉</p>`
  }),
  subtaskCreated: (username, title) => ({
    subject: 'New Subtask Created',
    html: `<p>Hi <b>${username}</b>, subtask <b>"${title}"</b> was added.</p>`
  }),
  adminNotif: (action, username, title) => ({
    subject: `[Admin] ${action}`,
    html: `<p>User <b>${username}</b> performed: <b>${action}</b> on <b>"${title}"</b>.</p>`
  })
};


module.exports = {sendEmail,templates};