const express = require("express");
const router = express.Router();
const {getTasks,addTask,updateTask,deleteTask,toggleCompletion,getSubtasks,addSubtask,deleteSubtask,updateSubtask,toggleSubtaskCompletion, getLogs} = require("../controllers/userActionController");
const loginUser = require("../controllers/loginController");
const registerUser = require("../controllers/registerController");
const UserrefreshToken = require("../controllers/refreshController");
const logOut = require ("../controllers/logoutController");
const verifyJWT = require("../middleware/verifyJWT");
const {authLimiter} = require("../middleware/rateLimiter");
const verifyRole = require("../middleware/verifyRole");
const {getAllUsers,deleteUser,getTasksOfUser,updateTaskofUser,deleteTaskofUser,toggleCompletionadmin, getSubtasksofUser, updateSubtaskofUser, deleteSubtaskofUser} = require("../controllers/adminActionController");


//regular user routes
router.get("/tasks",verifyJWT,verifyRole(["USER","ADMIN"]),getTasks); //get user tasks
router.post("/tasks",verifyJWT,verifyRole(["USER","ADMIN"]),addTask); //add a specific task
router.post("/tasks/:id",verifyJWT,verifyRole(["USER","ADMIN"]),updateTask);  //update specific task
router.delete("/tasks/:id",verifyJWT,verifyRole(["USER","ADMIN"]),deleteTask);  //delete specific task
router.patch("/tasks/:id/complete",verifyJWT,verifyRole(["USER","ADMIN"]),toggleCompletion); //toggle the completion status of a specific task 
router.get("/tasks/:id/subtasks",verifyJWT,verifyRole(["USER","ADMIN"]),getSubtasks) //get subtasks of a specific task
router.post("/tasks/:id/subtasks",verifyJWT,verifyRole(["USER","ADMIN"]),addSubtask); //add a subtask to a specific task
router.delete("/tasks/:id/subtasks/:subtaskId",verifyJWT,verifyRole(["USER","ADMIN"]),deleteSubtask); //delete a specific subtask
router.post("/tasks/:id/subtasks/:subtaskId",verifyJWT,verifyRole(["USER","ADMIN"]),updateSubtask); //update a specific subtask
router.patch("/tasks/:id/subtasks/:subtaskId/complete",verifyJWT,verifyRole(["USER","ADMIN"]),toggleSubtaskCompletion) //toggle the completion status of a specific subtask
router.get("/logs",verifyJWT,verifyRole(["USER","ADMIN"]),getLogs); //get all the logs from a specific user

//admin routes
router.get("/admin/users",verifyJWT,verifyRole(["ADMIN"]),getAllUsers); //returns a list of the users
router.delete("/admin/users/:userid",verifyJWT,verifyRole(["ADMIN"]),deleteUser) //deletes the account of a user
router.get("/admin/users/:userid/tasks",verifyJWT,verifyRole(["ADMIN"]),getTasksOfUser); //returns a list with the tasks of a user
router.post("/admin/users/:userid/tasks/:taskid",verifyJWT,verifyRole(["ADMIN"]),updateTaskofUser); //updates a specific task of a specific user
router.delete("/admin/users/:userid/tasks/:taskid",verifyJWT,verifyRole(["ADMIN"]),deleteTaskofUser); //deletes a specific task of a specific user
router.patch("/admin/users/:userid/tasks/:taskid/complete",verifyJWT,verifyRole(["ADMIN"]),toggleCompletionadmin);
router.get("/admin/users/:userid/tasks/:taskid/subtasks", verifyJWT, verifyRole(["ADMIN"]), getSubtasksofUser);
router.post("/admin/users/:userid/tasks/:taskid/subtasks/:subtaskid", verifyJWT, verifyRole(["ADMIN"]), updateSubtaskofUser);
router.delete("/admin/users/:userid/tasks/:taskid/subtasks/:subtaskid", verifyJWT, verifyRole(["ADMIN"]), deleteSubtaskofUser);



//auth routes
router.post("/signup", registerUser); //register
router.post("/login", loginUser);  //login
router.get("/refresh", UserrefreshToken);  //refresh token
router.post("/logout",logOut);  //logout user




module.exports = router;