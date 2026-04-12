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
      from: `"Simpl" <${process.env.ADMIN_EMAIL}>`,
      to,
      subject,
      html
    });
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

const emailLayout = (content) => `
  <div style="font-family: Arial, sans-serif; background:#f5f5f5; padding:30px 0;">
    <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e5e5e5;">
      
      <div style="padding:18px 24px; border-bottom:1px solid #e5e5e5; font-size:16px; font-weight:600; color:#222;">
        Simpl
      </div>
      
      <div style="padding:24px; color:#333; font-size:14px; line-height:1.6;">
        ${content}
      </div>
      
      <div style="padding:16px 24px; border-top:1px solid #e5e5e5; font-size:12px; color:#777; text-align:center;">
        This is an automated notification.
      </div>
      
    </div>
  </div>
`;

const templates = {
    welcomeEmail: (username) => ({
    subject: 'Welcome to Simpl',
    html: emailLayout(`
      <p>Hello <b>${username}</b>,</p>
      <p>Welcome to <b>Simpl</b> — your account has been created successfully.</p>
      <p>You can now log in and start managing your tasks.</p>
      <p style="margin-top:24px; color:#777;">If you didn't create this account, please contact us.</p>
    `)
  }),
  taskCreated: (username, title) => ({
    subject: 'Task Created',
    html: emailLayout(`
      <p>Hello <b>${username}</b>,</p>
      <p>Your task "<b>${title}</b>" was created successfully.</p>
    `)
  }),
  taskDeleted: (username, title) => ({
    subject: 'Task Deleted',
    html: emailLayout(`
      <p>Hello <b>${username}</b>,</p>
      <p>Your task "<b>${title}</b>" was deleted.</p>
    `)
  }),
  taskUpdated: (username, title) => ({
    subject: 'Task Updated',
    html: emailLayout(`
      <p>Hello <b>${username}</b>,</p>
      <p>Your task "<b>${title}</b>" was updated.</p>
    `)
  }),
  taskCompleted: (username, title) => ({
    subject: 'Task Completed',
    html: emailLayout(`
      <p>Hello <b>${username}</b>,</p>
      <p>Your task "<b>${title}</b>" has been marked as completed.</p>
    `)
  }),
  subtaskCreated: (username, title, parentTask) => ({
    subject: 'New Subtask Created',
    html: emailLayout(`
      <p>Hello <b>${username}</b>,</p>
      <p>The subtask "<b>${title}</b>" was added to "<b>${parentTask}</b>".</p>
    `)
  }),
  subtaskUpdated: (username, title, parentTask) => ({
    subject: 'Subtask Updated',
    html: emailLayout(`
      <p>Hello <b>${username}</b>,</p>
      <p>The subtask "<b>${title}</b>" in "<b>${parentTask}</b>" was updated.</p>
    `)
  }),
  subtaskDeleted: (username, title, parentTask) => ({
    subject: 'Subtask Deleted',
    html: emailLayout(`
      <p>Hello <b>${username}</b>,</p>
      <p>The subtask "<b>${title}</b>" was removed from "<b>${parentTask}</b>".</p>
    `)
  }),
  subtaskCompleted: (username, title, parentTask) => ({
    subject: 'Subtask Completed',
    html: emailLayout(`
      <p>Hello <b>${username}</b>,</p>
      <p>The subtask "<b>${title}</b>" in "<b>${parentTask}</b>" has been completed.</p>
    `)
  }),
  adminNotif: (action, username, title) => ({
    subject: 'Admin Notification',
    html: emailLayout(`
      <p><b>User:</b> ${username}</p>
      <p><b>Action:</b> ${action}</p>
      <p><b>Item:</b> "${title}"</p>
    `)
  }),
};

module.exports = { sendEmail, templates };