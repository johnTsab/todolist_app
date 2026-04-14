const db = require("../src/config/database");
require("dotenv").config();
const { sendEmail, templates } = require('../mailer');

const getUserEmail = async (userId) => {
  const [rows] = await db.query('SELECT email FROM users WHERE id = ?', [userId]);
  return rows?.[0]?.email || null;
};

const getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM users");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteUser = async (req, res) => {
  const adminId = req.user.userId;
  const userId = Number(req.params.userid);
  try {
    const [users] = await db.query('SELECT username FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });
    const username = users[0].username; 

    const [result] = await db.query('DELETE FROM users WHERE id = ?', [userId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
  
    await db.query(
      "INSERT INTO logs (user_id, action, activity_type) VALUES (?, ?, ?)",
      [adminId, `ADMIN DELETED USER: ${username}`, "ADMIN"]
    );

    res.status(204).json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getTasksOfUser = async (req, res) => {
  const userId = Number(req.params.userid);
  try {
    // idx_tasks_user_id 
    const [result] = await db.query("SELECT * FROM tasks WHERE user_id = ?", [userId]);
    for (let task of result) {
      // idx_subtasks_task_id 
      const [subtaskCount] = await db.query(
        "SELECT COUNT(*) as count FROM subtasks WHERE task_id = ?",
        [task.id]
      );
      task.subtaskCount = subtaskCount[0].count;
    }
    res.json(result);
  } catch (error) {
    console.error('ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateTaskofUser = async (req, res) => {
  const io = req.app.get('io');
  const adminId = req.user.userId;
  const userId = Number(req.params.userid);
  const taskId = Number(req.params.taskid);
  const { newtitle, newdescription } = req.body;
  try {
    // idx_tasks_user_id
    const [tasres] = await db.query(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );
    if (tasres.length === 0) return res.status(404).json({ message: 'Task or user not found' });
    const foundTask = tasres[0];

    await db.query(
      'UPDATE tasks SET title = ?, description = ? WHERE id = ? AND user_id = ?',
      [newtitle || foundTask.title, newdescription || foundTask.description, taskId, userId]
    );

    // idx_logs_user_id
    await db.query(
      "INSERT INTO logs (user_id, action, activity_type) VALUES (?, ?, ?)",
      [adminId, `ADMIN MODIFIED TASK: ${foundTask.title}`, "ADMIN"]
    );

    io.to(`user_${userId}`).emit('notification', {
      message: `Your task "${foundTask.title}" was edited by an admin`,
      type: 'info'
    });
    io.to(`user_${adminId}`).emit('admin_refresh', {});
    io.to(`user_${adminId}`).emit('notification', {
      message: `Task "${foundTask.title}" of user ${userId} was edited`,
      type: 'info'
    });

    const useremail = await getUserEmail(userId);
    if (useremail) {
      const { subject, html } = templates.taskUpdated(req.user.username, foundTask.title);
      const { subject: aSubj, html: aHtml } = templates.adminNotif('Task Updated', req.user.username, foundTask.title);
      sendEmail(useremail, subject, html);
      sendEmail(process.env.ADMIN_EMAIL, aSubj, aHtml);
    }

    return res.status(200).json({ message: 'Task modified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTaskofUser = async (req, res) => {
  const io = req.app.get('io');
  const adminId = req.user.userId;
  const userId = Number(req.params.userid);
  const taskId = Number(req.params.taskid);
  try {
    // idx_tasks_user_id
    const [rows] = await db.query(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Task not found' });
    const taskTitle = rows[0].title;

    const [result] = await db.query(
      'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Task not found' });

    await db.query(
      "INSERT INTO logs (user_id, action, activity_type) VALUES (?, ?, ?)",
      [adminId, `ADMIN DELETED TASK: ${taskTitle} FROM USER: ${userId}`, "ADMIN"]
    );

    io.to(`user_${userId}`).emit('notification', {
      message: `Your task "${taskTitle}" was deleted by an admin`,
      type: 'warning'
    });
    io.to(`user_${adminId}`).emit('admin_refresh', {});
    io.to(`user_${adminId}`).emit('notification', {
      message: `Task "${taskTitle}" of user ${userId} was deleted`,
      type: 'info'
    });

    const useremail = await getUserEmail(userId);
    if (useremail) {
      const { subject, html } = templates.taskDeleted(req.user.username, taskTitle);
      const { subject: aSubj, html: aHtml } = templates.adminNotif('Task Deleted', req.user.username, taskTitle);
      sendEmail(useremail, subject, html);
      sendEmail(process.env.ADMIN_EMAIL, aSubj, aHtml);
    }

    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleCompletionadmin = async (req, res) => {
  const adminId = req.user.userId;
  const userId = Number(req.params.userid);
  const taskId = Number(req.params.taskid);
  try {
    // idx_tasks_user_id
    const [rows] = await db.query(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Task not found" });
    const task = rows[0];

    const newStatus = task.is_completed ? 0 : 1;
    await db.query(
      "UPDATE tasks SET is_completed = ? WHERE id = ? AND user_id = ?",
      [newStatus, taskId, userId]
    );

    await db.query(
      "INSERT INTO logs (user_id, action, activity_type) VALUES (?, ?, ?)",
      [adminId, `ADMIN ${newStatus ? 'COMPLETED' : 'UNCOMPLETED'} TASK: ${task.title}`, "ADMIN"]
    );

    if (newStatus === 1) {
      const useremail = await getUserEmail(userId);
      if (useremail) {
        const { subject, html } = templates.taskCompleted(req.user.username, task.title);
        const { subject: aSubj, html: aHtml } = templates.adminNotif('Task Completed', req.user.username, task.title);
        sendEmail(useremail, subject, html);
        sendEmail(process.env.ADMIN_EMAIL, aSubj, aHtml);
      }
    }

    io.to(`user_${userId}`).emit('notification', {
      message: `Your task "${task.title}" was ${newStatus ? 'completed' : 'uncompleted'} by an admin`,
      type: 'info'
    });
    io.to(`user_${adminId}`).emit('admin_refresh', {});
    io.to(`user_${adminId}`).emit('notification', {
      message: `Task "${task.title}" of user ${userId} marked as ${newStatus ? 'completed' : 'uncompleted'}`,
      type: 'success'
    });

    res.status(200).json({ is_completed: newStatus });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSubtasksofUser = async (req, res) => {
  const taskId = Number(req.params.taskid);
  try {
    // idx_subtasks_task_id 
    const [rows] = await db.query("SELECT * FROM subtasks WHERE task_id = ?", [taskId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSubtaskofUser = async (req, res) => {
  const io = req.app.get('io');
  const adminId = req.user.userId;
  const userId = Number(req.params.userid);
  const subtaskId = Number(req.params.subtaskid);
  const { newtitle, newdescription } = req.body;
  try {
    // JOIN gives us the subtask + parent task title in one query
    // idx_subtasks_task_id
    const [rows] = await db.query(
      `SELECT s.*, t.title AS parentTaskTitle
       FROM subtasks s
       JOIN tasks t ON s.task_id = t.id
       WHERE s.id = ?`,
      [subtaskId]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Subtask not found" });
    const subtask = rows[0];

    await db.query(
      "UPDATE subtasks SET title = ?, description = ? WHERE id = ?",
      [newtitle || subtask.title, newdescription || subtask.description, subtaskId]
    );
    await db.query(
      "INSERT INTO logs (user_id, action, activity_type) VALUES (?, ?, ?)",
      [adminId, `ADMIN MODIFIED SUBTASK: ${subtask.title}`, "ADMIN"]
    );
    io.to(`user_${userId}`).emit('notification', {
      message: `Your subtask "${subtask.title}" was edited by an admin`,
      type: 'info'
    });
    io.to(`user_${adminId}`).emit('admin_refresh', {});
    io.to(`user_${adminId}`).emit('notification', {
      message: `Subtask "${subtask.title}" of user ${userId} was edited`,
      type: 'info'
    });
    const useremail = await getUserEmail(userId);
    if (useremail) {
      const { subject, html } = templates.subtaskUpdated(req.user.username, newtitle || subtask.title, subtask.parentTaskTitle);
      const { subject: aSubj, html: aHtml } = templates.adminNotif('Subtask Updated', req.user.username, subtask.title);
      sendEmail(useremail, subject, html);
      sendEmail(process.env.ADMIN_EMAIL, aSubj, aHtml);
    }

    return res.status(200).json({ message: "Subtask updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteSubtaskofUser = async (req, res) => {
  const io = req.app.get('io');
  const adminId = req.user.userId;
  const userId = Number(req.params.userid);
  const subtaskId = Number(req.params.subtaskid);
  try {
    // JOIN gives us the subtask + parent task title in one query
    // idx_subtasks_task_id
    const [rows] = await db.query(
      `SELECT s.*, t.title AS parentTaskTitle
       FROM subtasks s
       JOIN tasks t ON s.task_id = t.id
       WHERE s.id = ?`,
      [subtaskId]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Subtask not found" });
    const subtask = rows[0];

    await db.query("DELETE FROM subtasks WHERE id = ?", [subtaskId]);

    await db.query(
      "INSERT INTO logs (user_id, action, activity_type) VALUES (?, ?, ?)",
      [adminId, `ADMIN DELETED SUBTASK: ${subtask.title}`, "ADMIN"]
    );

    io.to(`user_${userId}`).emit('notification', {
      message: `Your subtask "${subtask.title}" was deleted by an admin`,
      type: 'warning'
    });
    io.to(`user_${adminId}`).emit('admin_refresh', {});
    io.to(`user_${adminId}`).emit('notification', {
      message: `Subtask "${subtask.title}" of user ${userId} was deleted`,
      type: 'info'
    });

    const useremail = await getUserEmail(userId);
    if (useremail) {
      const { subject, html } = templates.subtaskDeleted(req.user.username, subtask.title, subtask.parentTaskTitle);
      const { subject: aSubj, html: aHtml } = templates.adminNotif('Subtask Deleted', req.user.username, subtask.title);
      sendEmail(useremail, subject, html);
      sendEmail(process.env.ADMIN_EMAIL, aSubj, aHtml);
    }

    return res.status(200).json({ message: "Subtask deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers, deleteUser,
  getTasksOfUser, updateTaskofUser, deleteTaskofUser, toggleCompletionadmin,
  getSubtasksofUser, updateSubtaskofUser, deleteSubtaskofUser
};