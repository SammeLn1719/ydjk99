import { Request, Response, NextFunction } from 'express';
const jwt = require('jsonwebtoken');

module.exports = function(roles: string[]) {
    return function(req: Request, res: Response, next: NextFunction) {
      
        if(req.method === 'OPTIONS') {
            next();
        }
        try{
            const token = req.headers.authorization?.split(' ')[1];
            if(!token) {
                return res.status(403).json({message: 'Пользователь не авторизован'})
            }
            const {roles: userRoles} = jwt.verify(token, process.env.SECRET_KEY);
            let hasRole = false;
            userRoles.forEach((role:string) => {
                if(roles.includes(role)) {
                    hasRole = true;
                }
            });
            if(!hasRole) {
                return res.status(403).json({message: 'У вас нет доступа'})
            }
            next();
        }catch (error){
            console.log(error);
            return res.status(403).json({message: 'Пользователь не авторизован'})
        }
    }
}