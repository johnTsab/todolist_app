const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyRole = (roles) => {
    return (req,res,next) => {
        if(!roles.includes(req.user.role)){
            return res.status(403).json({message:"Forbidden"});
        }
        next();
    };
};

module.exports = verifyRole;