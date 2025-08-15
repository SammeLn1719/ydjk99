import { Request, Response, NextFunction } from 'express';
const jwt = require('jsonwebtoken'); 

declare global {
    namespace Express {
        interface Request {
            user?: any; // или более конкретный тип
        }
    }
}

module.exports = function(req: Request, res: Response, next: NextFunction) {
    if (req.path === '/auth/registeration' || req.path === '/auth/login') {
        return next();
    }
    if(req.method === 'OPTIONS') {
        next();
    }
    try{
        const token = req.headers.authorization?.split(' ')[1];
        if(!token) {
            return res.status(403).json({message: 'Пользователь не авторизован'})
        }
        const decodedData = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decodedData;
        next();
    }catch (error){
        console.log(error);
        return res.status(403).json({message: 'Пользователь не авторизован'})
    }
}
