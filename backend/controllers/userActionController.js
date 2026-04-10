const express = require("express");
const db = require("../src/config/database");
require("dotenv").config();
const {sendEmail,templates} = require('../mailer');

const getTasks = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log("REQ.USER =", req.user);
    const [rows] = await db.query("SELECT * FROM tasks WHERE user_id = ?", [
      userId,
    ]);
    for(let task of rows){
      const [subtaskCount] = await db.query("SELECT COUNT(*) as count FROM subtasks WHERE task_id=?",[task.id]);
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
  try {
    const userId = req.user.userId;
    const { title, description } = req.body;

    if (!title) return res.status(400).json({ message: "Title is required" });

    console.log("REQ.USER =", req.user);
    console.log("REQ.USER.userId =", req.user?.userId);

    const [result] = await db.query(
      "INSERT INTO tasks (user_id, title,description) VALUES (?, ?, ?)",
      [userId, title, description || null],
    );
    const [email] = await db.query('SELECT email FROM users WHERE id=?',[userId]);
    const useremail = email?.[0]?.email;
    if (!useremail) {
  console.error("❌ No email found for user:", userId);
  return res.status(404).json({ message: "User email not found" });
}

    //log activity
    const taskInfo = title;
    const logAction = `USER ADDED TASK: ${taskInfo}`;
    await db.query(
      "INSERT INTO logs (user_id,action,activity_type) VALUES (?,?,?)",
      [userId, logAction, "CRUD"],
    );
    io.to(`user_${req.user.userId}`).emit('notification', {
  message: `Task "${taskInfo}" created successfully`,
  type: 'success'
});
io.to(`user_${process.env.ADMIN_USER_ID}`).emit('admin_refresh', {
  message: `User ${req.user.userId} added a new task`
});
console.log("DB RESULT:", email);
console.log("USER ID:", userId);
const {subject,html} = templates.taskCreated(req.user.username,title);
const {subject: aSubj, html:aHtml} = templates.adminNotif('Task',req.user.username, title);
await sendEmail(useremail,subject,html);
await sendEmail (process.env.ADMIN_EMAIL,aSubj,aHtml);
    return res
      .status(201)
      .json({ message: "Task created", taskId: result.insertId });
  } catch (err) {
    console.error("CONTROLLER ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

const updateTask = async (req, res) => {
  const io = req.app.get('io');
  const {newtitle , newdescription} = req.body;
    const id = Number(req.params.id);
  try{
    const [tasres] = await db.query('SELECT * FROM tasks WHERE id =?',[id]);
    if(tasres.length === 0) return res.sendStatus(404).json({message:'Task not found'});
    const foundTask = tasres[0] ;
    const taskInfo = tasres[0].title;
    const userId = req.user.userId;
    await db.query('UPDATE tasks SET title=?, description=? WHERE id=?',[newtitle || foundTask.title,newdescription,id]);
    const logAction = `USER MODIFIED TASK: ${taskInfo}`;
    await db.query(
      "INSERT INTO logs (user_id,action,activity_type) VALUES (?,?,?)",
      [userId, logAction, "CRUD"],
    );
        io.to(`user_${req.user.userId}`).emit('notification', {
  message: `Task "${taskInfo}" updated successfully`,
  type: 'success'
});
io.to(`user_${process.env.ADMIN_USER_ID}`).emit('admin_refresh', {
  message: `User ${req.user.userId} updated a task`
});
    return res.status(204).json({message:'Task modified succesfully'});
  }catch(error){
    res.status(500).json({message:error.message});
  }
};

const deleteTask = async (req, res) => {
  const io = req.app.get('io');
  const id = Number(req.params.id);
  const userId = req.user.userId;
  try{

    const [rows] = await db.query('SELECT * FROM tasks WHERE id=?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Task not found' });
    const taskInfo = rows[0].title;

    const [result] = await db.query('DELETE FROM tasks WHERE id = ? ', [id]);
    if(result.affectedRows === 0) return res.sendStatus(404).json({message:'Task not found'});
    const logAction = `USER DELETED TASK: ${taskInfo}`;
    await db.query(
      "INSERT INTO logs (user_id,action,activity_type) VALUES (?,?,?)",
      [userId, logAction, "CRUD"],
    );
        io.to(`user_${req.user.userId}`).emit('notification', {
  message: `Task "${taskInfo}" deleted successfully`,
  type: 'success'
});
io.to(`user_${process.env.ADMIN_USER_ID}`).emit('admin_refresh', {
  message: `User ${req.user.userId} deleted a task`
});
    return res.status(204).json({message:'Task deleted succesfully'});
  }catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleCompletion = async (req,res)=>{
  const io = req.app.get('io');
  const id = Number(req.params.id);
  const userId = req.user.userId;
  try{
    const [rows] = await db.query('SELECT * FROM tasks WHERE id=?',[id]);
    if(rows.length===0)return res.status(404).json({message:"Task not found"});
    const task = rows[0];
    if(task.user_id!==userId)return res.status(403).json({message:"Forbidden"});
    const newStatus = task.is_completed?0:1;
    await db.query("UPDATE tasks SET is_completed=? WHERE id=?",[newStatus,id]);
    const logAction = `USER ${newStatus ? 'COMPLETED' : 'UNRESOLVED'} TASK: ${task.title}`;
    await db.query(
      "INSERT INTO logs (user_id,action,activity_type) VALUES (?,?,?)",
      [userId, logAction, "CRUD"],
    );
        io.to(`user_${req.user.userId}`).emit('notification', {
  message: `Task "${task.title}" ${newStatus ? 'completed' : 'unresolved'} `,
  type: 'success'
});
    res.status(200).json({is_completed:newStatus});

  }catch(error){
    res.status(500).json({message:error.message});
  }
}

const getSubtasks = async(req,res) => {
  const io = req.app.get('io');
   try {
    const userId = req.user.userId;
    const taskId = Number(req.params.id);
    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [
      taskId,
    ]);
    const task = rows[0];
    if(!task)return res.status(404).json({message:"Task not found"});
    if(task.user_id!==userId)return res.status(403).json({message:"Forbidden"});
    const [subtasks] = await db.query("SELECT * FROM subtasks WHERE task_id=?",[taskId]);
    res.status(200).json(subtasks);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

const addSubtask = async (req,res) => {
  const io = req.app.get('io');
  try{
    const userId = req.user.userId;
    const {title,description} = req.body;
    const taskId = Number(req.params.id);
    if (!title) return res.status(400).json({ message: "Title is required" });
    const [taskRes] = await db.query("SELECT * FROM tasks WHERE id=? ",[taskId]);
    if(taskRes.length === 0) return res.sendStatus(404).json({message:'Task not found'});
    const task = taskRes[0];
    if( req.user.role === "USER" && task.user_id !== userId){
      return res.status(403).json({ message: "Forbidden" });
    }
    const [result] = await db.query("INSERT INTO subtasks (task_id,title,description,user_id) VALUES (?,?,?,?)",[taskId,title,description || null,userId]);
    const taskInfo = title;
    const logAction = `USER ADDED SUBTASK: ${taskInfo}`;
    await db.query(
      "INSERT INTO logs (user_id,action,activity_type) VALUES (?,?,?)",
      [userId, logAction, "CRUD"],
    );
        io.to(`user_${req.user.userId}`).emit('notification', {
  message: `Subtask "${taskInfo}" created successfully`,
  type: 'success'
});
io.to(`user_${process.env.ADMIN_USER_ID}`).emit('admin_refresh', {
  message: `User ${req.user.userId} added a subtask`
});
     res.status(201).json({ message: "Subtask added", subtaskId: result.insertId }); 
  }catch(error){
    console.error(error);
    res.status(500).json({ message: err.message });
  }
}

const deleteSubtask = async (req,res) => {
  const io = req.app.get('io');
  try{
   const subtaskId = Number(req.params.subtaskId);
   const userId = req.user.userId;
  

    //THIS QUERY FINDS THE SUBTASK AND THE PARENT TASK 
    const [rows] = await db.query(
      `SELECT s.*, t.user_id AS taskOwner
       FROM subtasks s
       JOIN tasks t ON s.task_id = t.id
       WHERE s.id = ?`,
      [subtaskId]
    );
    if(rows.length==0)return res.status(401).json({message:"Subtask not found"});
    const subtask = rows[0];   

    if(subtask.taskOwner!==userId && req.user.role==="USER")return res.status(403).json({message:"Forbidden"});


    const [result] = await db.query("DELETE FROM subtasks WHERE id=?",[subtaskId]);
    if(result.affectedRows === 0) return res.sendStatus(404).json({message:'Subtask not found'});

    const logAction =`USER DELETED SUBTASK: ${subtask.title}`;
    await db.query("INSERT INTO logs (user_id,action,activity_type) VALUES (?,?,?)",[userId,logAction,"CRUD"]);
        io.to(`user_${req.user.userId}`).emit('notification', {
  message: `Subtask "${subtask.title}" deleted successfully`,
  type: 'success'
});
io.to(`user_${process.env.ADMIN_USER_ID}`).emit('admin_refresh', {
  message: `User ${req.user.userId} deleted a subtask`
});
    res.status(204).json({message:"Subtask deleted succesfuly"});
  
  }catch(error){
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

const updateSubtask = async(req,res) => {
  const io = req.app.get('io');
  try{
    const subtaskId= Number(req.params.subtaskId);
    const userId = req.user.userId;
    const {newTitle,newDescription} = req.body;

    const [rows] = await db.query(
      'SELECT s.* , t.user_id AS taskOwner FROM subtask s JOIN tasks t ON s.task_id = t.id WHERE s.id =?',[subtaskId]);
      if(rows.length==0)return res.status(401).json({message:"Subtask not found"});
      const subtask = rows[0];
      if(subtask.taskOwner!==userId && req.user.role==="USER")return res.status(403).json({message:"Forbidden"});
     const taskInfo = subtask.title;
     const [result] = await db.query('UPDATE subtasks SET title=? , description=? WHERE id=?',[newTitle,newDescription,subtaskId]);
     if(result.affectedRows===0)return res.sendStatus(404).json({message:'Task not found'});
     const logAction = `USER MODIFIED TASK: ${taskInfo}`;
     await db.query("INSERT INTO logs (user_id,action,activity_type) VALUES (?,?,?)",[userId,logAction,"CRUD"]);
         io.to(`user_${req.user.userId}`).emit('notification', {
  message: `Subtask "${taskInfo}" updated successfully`,
  type: 'success'
});
io.to(`user_${process.env.ADMIN_USER_ID}`).emit('admin_refresh', {
  message: `User ${req.user.userId} updated a subtask`
});

     return res.sendStatus(204).json({message:'Task modified succesfully'});
  }catch(error){
    res.status(500).json({message:error.message});
  }
}

const toggleSubtaskCompletion = async (req,res)=>{
  const io = req.app.get('io');
  const id = Number(req.params.subtaskId);
  const userId = req.user.userId;
  try{
    const [rows] = await db.query('SELECT * FROM subtasks WHERE id=?',[id]);
    if(rows.length===0)return res.status(404).json({message:"Subtask not found"});
    const subtask = rows[0];
    if(subtask.user_id!==userId)return res.status(403).json({message:"Forbidden"});
    const newStatus = subtask.is_completed?0:1;
    await db.query("UPDATE subtasks SET is_completed=? WHERE id=?",[newStatus,id]);
    const logAction = `USER ${newStatus ? 'COMPLETED' : 'UNCOMPLETED'} SUBTASK: ${subtask.title}`;
    await db.query(
      "INSERT INTO logs (user_id,action,activity_type) VALUES (?,?,?)",
      [userId, logAction, "CRUD"],
    );
     io.to(`user_${req.user.userId}`).emit('notification', {
  message: `Subtask "${subtask.title}" ${newStatus ? 'completed' : 'unresolved'} `,
  type: 'success'
});
    res.status(200).json({is_completed:newStatus});

  }catch(error){
    res.status(500).json({message:error.message});
  }
}

const getLogs=async(req,res) => {
  const userId = req.user.userId;
  try{
    const [rows] = await db.query("SELECT * FROM logs WHERE user_id=? ORDER BY created_at DESC",[userId]);
    res.json(rows);
  }catch(error){
    res.status(500).json({message:error.message});
  }
}



module.exports ={getTasks,addTask,updateTask,deleteTask,toggleCompletion,getSubtasks,addSubtask,updateSubtask,deleteSubtask,toggleSubtaskCompletion,getLogs};
