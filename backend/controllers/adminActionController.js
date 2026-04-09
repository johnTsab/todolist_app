const express = require("express");
const db = require("../src/config/database");
require("dotenv").config();

//get a list of the users (will be able to get a list of all the users and then proceed to select one of them )
const getAllUsers = async (req,res) => {
    try{
        const [rows] = await db.query("SELECT * FROM  users");
        res.json(rows);
    }catch(err){
        console.error(err);
        res.status(500).json({message:"Server error"});
    }
}

//delete a specific user (drop a user)
const deleteUser = async (req,res) => {
    const adminId = req.user.userId;
    try{
        const userId =  Number(req.params.userid);
        const [users] = await db.query('SELECT username FROM users WHERE id=?'[userId]);
        username = users[0];
        const [resultU] = await db.query('DELETE FROM users WHERE id=?',[userId]);
        if(resultU.affectedRows===0)return res.sendStatus(404),json({message:'User not found'});
        //delete the users tasks and subtasks due to the cascade in the database
        await db.query('DELETE FROM tasks WHERE user_id=?',[userId]);
        const logAction = `ADMIN DELETED USER ${username}`;
        await db.query("INSERT INTO logs (user_id,action,activity_type) VALUES (?,?,?)",[adminId,logAction,"ADMIN"]);
        res.status(204).json({message:'User deleted succesfully'});
    }catch(err){
        res.status(500).json({message:err.message});
    }
}


//get tasks by user (get the full list of tasks of a user 
const getTasksOfUser = async(req, res) => {
  const userId = Number(req.params.userid);
  try {
    const [result] = await db.query("SELECT * FROM tasks WHERE user_id=?", [userId]);
    for(let task of result){
      const [subtaskCount] = await db.query("SELECT COUNT(*) as count FROM subtasks WHERE task_id=?",[task.id]);
      task.subtaskCount = subtaskCount[0].count;
    }
    res.json(result);
  } catch(error) {
    console.error('ERROR:', error); 
    res.status(500).json({ message: error.message });
  }
}


//update a users task
const updateTaskofUser = async(req,res) => {
     const {newtitle , newdescription} = req.body;
        const userId = Number(req.params.userid);
        const taskId = Number(req.params.taskid);
    try{
        const [tasres] = await db.query('SELECT * FROM tasks WHERE id=? AND user_id=?',[taskId,userId]);
        if(tasres.length ===0) return res.sendStatus(404).json({message: 'Task or user not found'});
        const foundTask = tasres[0] ;
    const taskInfo = tasres[0].title;
    const adminId = req.user.userId;
    await db.query('UPDATE tasks SET title=?, description=? WHERE id=? AND user_id=?',[newtitle || foundTask.title,newdescription || foundTask.description,taskId,userId]);
    const logAction = `ADMIN MODIFIED TASK: ${taskInfo}`;
    await db.query(
      "INSERT INTO logs (user_id,action,activity_type) VALUES (?,?,?)",
      [adminId, logAction, "CRUD"],
    );
    return res.status(204).json({ message: 'Task modified successfully' });
    }catch(error){
        res.status(500).json({message:error.message});
    }
} 

//delete a users task 
const deleteTaskofUser = async(req,res) => {
    const adminId = req.user.userId;
    const userId = Number(req.params.userid);
    const taskId = req.params.taskid;
    try{
        const [rows] = await db.query('SELECT * FROM tasks WHERE id=? AND user_id=?',[taskId,userId]);
        if(rows.length===0)return res.status(404).json({message:'Task not found'});
        const taskInfo = rows[0].title;
        const [result] = await db.query('DELETE FROM tasks WHERE id=? AND user_id=?',[taskId,userId]);
        if(result.affectedRows===0) return res.status(404).json({message:'Task not found'});
        const [users] = await db.query('SELECT username FROM users WHERE id=?'[userId]);
        username = users[0];
        const logAction = `ADMIN DELETED TASK: ${taskInfo} FROM USER: ${username}`;
        await db.query(
              "INSERT INTO logs (user_id,action,activity_type) VALUES (?,?,?)",
              [adminId, logAction, "CRUD"],
            );
        return res.status(200).json({message:'Task deleted succesfully'});
    }catch(error){
        res.status(500).json({ message: error.message });
    }

}

const toggleCompletionadmin = async (req,res)=>{
    const adminId = req.user.userId;
    const userId = Number(req.params.userid);
    const taskId = req.params.taskid;
    try{
        const [rows] = await db.query('SELECT ** FROM tasks WHERE id=? AND user_id=?',[taskId,userId]);
        if(rows.length===0)return res.status(404).json({message:"Task not found"});
        const task = rows[0];
        const newStatus = task.is_completed?0:1;
        await db.query("UPDATE tasks SET is_completed=? WHERE id=? AND user_id=?",[newStatus,taskId,userId]);
        const logAction = `ADMIN ${newStatus ? 'COMPLETED' : 'UNCOMPLETED'} TASK: ${task.title}`;
        await db.query(
      "INSERT INTO logs (user_id,action,activity_type) VALUES (?,?,?)",
      [adminId, logAction, "CRUD"],
    );
     res.status(200).json({is_completed:newStatus});

    }catch(error){
    res.status(500).json({message:error.message});
  }
}

const getSubtasksofUser = async(req, res) => {
  const taskId = Number(req.params.taskid);
  try {
    const [rows] = await db.query(
      "SELECT * FROM subtasks WHERE task_id=?", 
      [taskId]
    );
    res.json(rows);
  } catch(error) {
    res.status(500).json({ message: error.message });
  }
}

//update subtasks 
const updateSubtaskofUser = async(req, res) => {
  const subtaskId = Number(req.params.subtaskid);
  const adminId = req.user.userId;
  const { newtitle, newdescription } = req.body;
  try {
    const [rows] = await db.query(
      "SELECT * FROM subtasks WHERE id=?", 
      [subtaskId]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Subtask not found" });
    const subtask = rows[0];
    await db.query(
      "UPDATE subtasks SET title=?, description=? WHERE id=?",
      [newtitle || subtask.title, newdescription || subtask.description, subtaskId]
    );
    const logAction = `ADMIN MODIFIED SUBTASK: ${subtask.title}`;
    await db.query(
      "INSERT INTO logs (user_id,action,activity_type) VALUES (?,?,?)",
      [adminId, logAction, "ADMIN"]
    );
    return res.status(200).json({ message: "Subtask updated successfully" });
  } catch(error) {
    res.status(500).json({ message: error.message });
  }
}
//delete subtasks
const deleteSubtaskofUser = async(req, res) => {
  const subtaskId = Number(req.params.subtaskid);
  const adminId = req.user.userId;
  try {
    const [rows] = await db.query(
      "SELECT * FROM subtasks WHERE id=?", 
      [subtaskId]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Subtask not found" });
    const subtaskTitle = rows[0].title;
    await db.query("DELETE FROM subtasks WHERE id=?", [subtaskId]);
    const logAction = `ADMIN DELETED SUBTASK: ${subtaskTitle}`;
    await db.query(
      "INSERT INTO logs (user_id,action,activity_type) VALUES (?,?,?)",
      [adminId, logAction, "ADMIN"]
    );
    return res.status(200).json({ message: "Subtask deleted successfully" });
  } catch(error) {
    res.status(500).json({ message: error.message });
  }
}


module.exports={getAllUsers,deleteUser,getTasksOfUser,updateTaskofUser,deleteTaskofUser,toggleCompletionadmin, getSubtasksofUser, updateSubtaskofUser, deleteSubtaskofUser}