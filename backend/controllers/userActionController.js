const express = require("express");
const db = require("../src/config/database");
require("dotenv").config();
const { sendEmail, templates } = require('../mailer');

const getUserEmail = async (userId) => {
  const [rows] = await db.query('SELECT email FROM users WHERE id = ?', [userId]);
  return rows?.[0]?.email || null;
};

const getTasks = async (req, res) => {
  const userId = req.user.userId;
  try {
    // idx_tasks_user_id 
    const [rows] = await db.query("SELECT * FROM tasks WHERE user_id = ?", [userId]);
    for (let task of rows) {
      // idx_subtasks_task_id
      const [subtaskCount] = await db.query(
        "SELECT COUNT(*) as count FROM subtasks WHERE task_id = ?",
        [task.id]
      );
      task.subtaskCount = subtaskCount[0].count;
    }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const addTask = async (req, res) => {
  const io = req.app.get('io');
  const userId = req.user.userId;
  const { title, description } = req.body;
  try {
    if (!title) return res.status(400).json({ message: "Title is required" });

    const useremail = await getUserEmail(userId);
    if (!useremail) return res.status(404).json({ message: "User email not found" });

    // idx_tasks_user_id
    const [result] = await db.query(
      "INSERT INTO tasks (user_id, title, description) VALUES (?, ?, ?)",
      [userId, title, description || null]
    );

    // idx_logs_user_id
    await db.query(
      "INSERT INTO logs (user_id, action, activity_type) VALUES (?, ?, ?)",
      [userId, `USER ADDED TASK: ${title}`, "CRUD"]
    );

    io.to(`user_${userId}`).emit('notification', {
      message: `Task "${title}" created successfully`,
      type: 'success'
    });
    io.to(`user_${process.env.ADMIN_USER_ID}`).emit('admin_refresh', {
      message: `User ${userId} added a new task`
    });

    const { subject, html } = templates.taskCreated(req.user.username, title);
    const { subject: aSubj, html: aHtml } = templates.adminNotif('Task', req.user.username, title);
    console.log('About to send email to:', userEmail);
    sendEmail(useremail, subject, html);
    sendEmail(process.env.ADMIN_EMAIL, aSubj, aHtml);

    return res.status(201).json({ message: "Task created", taskId: result.insertId });
  } catch (err) {
    console.error("CONTROLLER ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

const updateTask = async (req, res) => {
  const io = req.app.get('io');
  const userId = req.user.userId;
  const { newtitle, newdescription } = req.body;
  const id = Number(req.params.id);
  try {
    // idx_tasks_user_id
    const [tasres] = await db.query('SELECT * FROM tasks WHERE id = ?', [id]);
    if (tasres.length === 0) return res.status(404).json({ message: 'Task not found' });
    const foundTask = tasres[0];

    const useremail = await getUserEmail(userId);
    if (!useremail) return res.status(404).json({ message: "User email not found" });

    await db.query(
      'UPDATE tasks SET title = ?, description = ? WHERE id = ?',
      [newtitle || foundTask.title, newdescription, id]
    );

    await db.query(
      "INSERT INTO logs (user_id, action, activity_type) VALUES (?, ?, ?)",
      [userId, `USER MODIFIED TASK: ${foundTask.title}`, "CRUD"]
    );

    io.to(`user_${userId}`).emit('notification', {
      message: `Task "${foundTask.title}" updated successfully`,
      type: 'success'
    });
    io.to(`user_${process.env.ADMIN_USER_ID}`).emit('admin_refresh', {
      message: `User ${userId} updated a task`
    });

    const { subject, html } = templates.taskUpdated(req.user.username, foundTask.title);
    const { subject: aSubj, html: aHtml } = templates.adminNotif('Task', req.user.username, foundTask.title);
    sendEmail(useremail, subject, html);
    sendEmail(process.env.ADMIN_EMAIL, aSubj, aHtml);

    return res.status(200).json({ message: 'Task modified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTask = async (req, res) => {
  const io = req.app.get('io');
  const id = Number(req.params.id);
  const userId = req.user.userId;
  try {
    const [rows] = await db.query('SELECT * FROM tasks WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Task not found' });
    const taskTitle = rows[0].title;

    const useremail = await getUserEmail(userId);
    if (!useremail) return res.status(404).json({ message: "User email not found" });

    const [result] = await db.query('DELETE FROM tasks WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Task not found' });

    await db.query(
      "INSERT INTO logs (user_id, action, activity_type) VALUES (?, ?, ?)",
      [userId, `USER DELETED TASK: ${taskTitle}`, "CRUD"]
    );

    io.to(`user_${userId}`).emit('notification', {
      message: `Task "${taskTitle}" deleted successfully`,
      type: 'success'
    });
    io.to(`user_${process.env.ADMIN_USER_ID}`).emit('admin_refresh', {
      message: `User ${userId} deleted a task`
    });

    const { subject, html } = templates.taskDeleted(req.user.username, taskTitle);
    const { subject: aSubj, html: aHtml } = templates.adminNotif('Task', req.user.username, taskTitle);
    sendEmail(useremail, subject, html);
    sendEmail(process.env.ADMIN_EMAIL, aSubj, aHtml);

    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleCompletion = async (req, res) => {
  const io = req.app.get('io');
  const id = Number(req.params.id);
  const userId = req.user.userId;
  try {
    const [rows] = await db.query('SELECT * FROM tasks WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Task not found" });
    const task = rows[0];
    if (task.user_id !== userId) return res.status(403).json({ message: "Forbidden" });

    const newStatus = task.is_completed ? 0 : 1;
    await db.query("UPDATE tasks SET is_completed = ? WHERE id = ?", [newStatus, id]);

    await db.query(
      "INSERT INTO logs (user_id, action, activity_type) VALUES (?, ?, ?)",
      [userId, `USER ${newStatus ? 'COMPLETED' : 'UNRESOLVED'} TASK: ${task.title}`, "CRUD"]
    );

    io.to(`user_${userId}`).emit('notification', {
      message: `Task "${task.title}" ${newStatus ? 'completed' : 'unresolved'}`,
      type: 'success'
    });

    if (newStatus === 1) {
      const useremail = await getUserEmail(userId);
      if (useremail) {
        const { subject, html } = templates.taskCompleted(req.user.username, task.title);
        const { subject: aSubj, html: aHtml } = templates.adminNotif('Task', req.user.username, task.title);
        sendEmail(useremail, subject, html);
        sendEmail(process.env.ADMIN_EMAIL, aSubj, aHtml);
      }
    }

    res.status(200).json({ is_completed: newStatus });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSubtasks = async (req, res) => {
  try {
    const userId = req.user.userId;
    const taskId = Number(req.params.id);

    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [taskId]);
    if (!rows[0]) return res.status(404).json({ message: "Task not found" });
    if (rows[0].user_id !== userId) return res.status(403).json({ message: "Forbidden" });

    // idx_subtasks_task_id
    const [subtasks] = await db.query("SELECT * FROM subtasks WHERE task_id = ?", [taskId]);
    res.status(200).json(subtasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addSubtask = async (req, res) => {
  const io = req.app.get('io');
  try {
    const userId = req.user.userId;
    const { title, description } = req.body;
    const taskId = Number(req.params.id);

    if (!title) return res.status(400).json({ message: "Title is required" });

    // idx_tasks_user_id covers this; also gives us the parent title for the email
    const [taskRes] = await db.query("SELECT * FROM tasks WHERE id = ?", [taskId]);
    if (taskRes.length === 0) return res.status(404).json({ message: 'Task not found' });
    const task = taskRes[0];

    if (req.user.role === "USER" && task.user_id !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // idx_subtasks_task_id
    const [result] = await db.query(
      "INSERT INTO subtasks (task_id, title, description, user_id) VALUES (?, ?, ?, ?)",
      [taskId, title, description || null, userId]
    );

    await db.query(
      "INSERT INTO logs (user_id, action, activity_type) VALUES (?, ?, ?)",
      [userId, `USER ADDED SUBTASK: ${title}`, "CRUD"]
    );

    const useremail = await getUserEmail(userId);
    if (useremail) {
      const { subject, html } = templates.subtaskCreated(req.user.username, title, task.title);
      const { subject: aSubj, html: aHtml } = templates.adminNotif('Subtask', req.user.username, title);
      sendEmail(useremail, subject, html);
      sendEmail(process.env.ADMIN_EMAIL, aSubj, aHtml);
    }

    io.to(`user_${userId}`).emit('notification', {
      message: `Subtask "${title}" created successfully`,
      type: 'success'
    });
    io.to(`user_${process.env.ADMIN_USER_ID}`).emit('admin_refresh', {
      message: `User ${userId} added a subtask`
    });

    res.status(201).json({ message: "Subtask added", subtaskId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const deleteSubtask = async (req, res) => {
  const io = req.app.get('io');
  try {
    const subtaskId = Number(req.params.subtaskId);
    const userId = req.user.userId;

    // JOIN gives us the subtask + parent task title in one query
    // idx_subtasks_task_id
    const [rows] = await db.query(
      `SELECT s.*, t.user_id AS taskOwner, t.title AS parentTaskTitle
       FROM subtasks s
       JOIN tasks t ON s.task_id = t.id
       WHERE s.id = ?`,
      [subtaskId]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Subtask not found" });
    const subtask = rows[0];

    if (subtask.taskOwner !== userId && req.user.role === "USER") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const [result] = await db.query("DELETE FROM subtasks WHERE id = ?", [subtaskId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Subtask not found' });

    await db.query(
      "INSERT INTO logs (user_id, action, activity_type) VALUES (?, ?, ?)",
      [userId, `USER DELETED SUBTASK: ${subtask.title}`, "CRUD"]
    );

    io.to(`user_${userId}`).emit('notification', {
      message: `Subtask "${subtask.title}" deleted successfully`,
      type: 'success'
    });
    io.to(`user_${process.env.ADMIN_USER_ID}`).emit('admin_refresh', {
      message: `User ${userId} deleted a subtask`
    });

    const useremail = await getUserEmail(userId);
    if (useremail) {
      const { subject, html } = templates.subtaskDeleted(req.user.username, subtask.title, subtask.parentTaskTitle);
      const { subject: aSubj, html: aHtml } = templates.adminNotif('Subtask', req.user.username, subtask.title);
      sendEmail(useremail, subject, html);
      sendEmail(process.env.ADMIN_EMAIL, aSubj, aHtml);
    }

    res.status(200).json({ message: "Subtask deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const updateSubtask = async (req, res) => {
  const io = req.app.get('io');
  try {
    const subtaskId = Number(req.params.subtaskId);
    const userId = req.user.userId;
    const { newTitle, newDescription } = req.body;

    // JOIN gives us ownership + parent task title in one query
    // idx_subtasks_task_id 
    const [rows] = await db.query(
      `SELECT s.*, t.user_id AS taskOwner, t.title AS parentTaskTitle
       FROM subtasks s
       JOIN tasks t ON s.task_id = t.id
       WHERE s.id = ?`,
      [subtaskId]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Subtask not found" });
    const subtask = rows[0];

    if (subtask.taskOwner !== userId && req.user.role === "USER") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const [result] = await db.query(
      'UPDATE subtasks SET title = ?, description = ? WHERE id = ?',
      [newTitle || subtask.title, newDescription, subtaskId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Subtask not found' });

    await db.query(
      "INSERT INTO logs (user_id, action, activity_type) VALUES (?, ?, ?)",
      [userId, `USER MODIFIED SUBTASK: ${subtask.title}`, "CRUD"]
    );

    io.to(`user_${userId}`).emit('notification', {
      message: `Subtask "${subtask.title}" updated successfully`,
      type: 'success'
    });
    io.to(`user_${process.env.ADMIN_USER_ID}`).emit('admin_refresh', {
      message: `User ${userId} updated a subtask`
    });

    const useremail = await getUserEmail(userId);
    if (useremail) {
      const { subject, html } = templates.subtaskUpdated(req.user.username, newTitle || subtask.title, subtask.parentTaskTitle);
      const { subject: aSubj, html: aHtml } = templates.adminNotif('Subtask', req.user.username, subtask.title);
      sendEmail(useremail, subject, html);
      sendEmail(process.env.ADMIN_EMAIL, aSubj, aHtml);
    }

    return res.status(200).json({ message: 'Subtask modified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleSubtaskCompletion = async (req, res) => {
  const io = req.app.get('io');
  const id = Number(req.params.subtaskId);
  const userId = req.user.userId;
  try {
    // JOIN fetches subtask + parent task title + ownership in one shot
    // idx_subtasks_task_id
    const [rows] = await db.query(
      `SELECT s.*, t.user_id AS taskOwner, t.title AS parentTaskTitle
       FROM subtasks s
       JOIN tasks t ON s.task_id = t.id
       WHERE s.id = ?`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Subtask not found" });
    const subtask = rows[0];
    if (subtask.user_id !== userId) return res.status(403).json({ message: "Forbidden" });

    const newStatus = subtask.is_completed ? 0 : 1;
    await db.query("UPDATE subtasks SET is_completed = ? WHERE id = ?", [newStatus, id]);

    await db.query(
      "INSERT INTO logs (user_id, action, activity_type) VALUES (?, ?, ?)",
      [userId, `USER ${newStatus ? 'COMPLETED' : 'UNCOMPLETED'} SUBTASK: ${subtask.title}`, "CRUD"]
    );

    io.to(`user_${userId}`).emit('notification', {
      message: `Subtask "${subtask.title}" ${newStatus ? 'completed' : 'unresolved'}`,
      type: 'success'
    });

    if (newStatus === 1) {
      const useremail = await getUserEmail(userId);
      if (useremail) {
        const { subject, html } = templates.subtaskCompleted(req.user.username, subtask.title, subtask.parentTaskTitle);
        const { subject: aSubj, html: aHtml } = templates.adminNotif('Subtask', req.user.username, subtask.title);
        sendEmail(useremail, subject, html);
        sendEmail(process.env.ADMIN_EMAIL, aSubj, aHtml);
      }
    }

    res.status(200).json({ is_completed: newStatus });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLogs = async (req, res) => {
  const userId = req.user.userId;
  try {
    // idx_logs_user_id
    const [rows] = await db.query(
      "SELECT * FROM logs WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTasks, addTask, updateTask, deleteTask, toggleCompletion,
  getSubtasks, addSubtask, updateSubtask, deleteSubtask, toggleSubtaskCompletion,
  getLogs
};