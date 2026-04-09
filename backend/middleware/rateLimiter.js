const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 5*60*1000, //15 mins aprox.
    max: 10, 
    standardHeaders : true , 
    legacyHeaders: false, 
    message:{
        status: 429,
        message: 'Too many attempts. please try again in 5 minutes'
    }
});

const globalLimiter = rateLimit({
    windowMs: 15* 60 * 1000 , 
    max:200, 
    standardHeaders: true, 
    legacyHeaders:false,
});


module.exports = {authLimiter,globalLimiter}