import { Request, Response } from 'express';
import pool from '../config/database';
import bcrypt from 'bcrypt';
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

const generateAccessToken = (id: string,roles: string[]) => {
    const payload = {
        id,
        roles
    }
    return jwt.sign(payload, process.env.SECRET_KEY, {expiresIn: '24h'})    
}

class AuthController { 
    async registeration(req: Request, res: Response) {
        try{
            const errors = validationResult(req);
            if(!errors.isEmpty()) {
                return res.status(400).json({message: errors.array()})
            }
            const {username, email, password} = req.body;
            const candidate = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
            if(candidate.rows.length > 0) {
                return res.status(400).json({message: 'User already exists'})
            }
            const hashedPassword = await bcrypt.hash(password, 10);

            const createdUser = await pool.query('INSERT INTO users (username, email,password_hash ) VALUES ($1, $2, $3) RETURNING *', [username, email, hashedPassword]);

            const user = createdUser.rows[0];

            const userRoleResult = await pool.query('SELECT * FROM roles WHERE name = $1', ['user']);

            if(userRoleResult.rows.length > 0) {
                await pool.query(
                    'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
                    [user.id, userRoleResult.rows[0].id]
                );
            }

            res.status(201).json({
                message: 'User created successfully',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    created_at: user.created_at
                }
            })
        } catch (error:any) {
            console.error('Registration error:', error);
            res.status(500).json({ message: 'Registration error' });
        }
    }

    async login(req: Request, res: Response) {
        try{
            const {username, email, password} = req.body;
            if(!username || !password) {
                return res.status(400).json({message: 'Username and password are required'})
            }
            let userResult;
            if (username) {
                // Поиск только по username
                userResult = await pool.query(
                    'SELECT u.*, array_agg(r.name) as roles FROM users u ' +
                    'LEFT JOIN user_roles ur ON u.id = ur.user_id ' +
                    'LEFT JOIN roles r ON ur.role_id = r.id ' +
                    'WHERE u.username = $1 ' +
                    'GROUP BY u.id',
                    [username]
                );
            } else {
                // Поиск только по email
                userResult = await pool.query(
                    'SELECT u.*, array_agg(r.name) as roles FROM users u ' +
                    'LEFT JOIN user_roles ur ON u.id = ur.user_id ' +
                    'LEFT JOIN roles r ON ur.role_id = r.id ' +
                    'WHERE u.email = $1 ' +
                    'GROUP BY u.id',
                    [email]
                );
            }

            if (userResult.rows.length === 0) {
                return res.status(400).json({ message: 'Пользователь не найден'});
            }

            const user = userResult.rows[0];
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);

            if(!isPasswordValid) {
                return res.status(400).json({ message: 'Неверный пароль' });
            }
            const token = generateAccessToken(user.id, user.roles);
            res.json({token});

        } catch (error:any) {
            res.status(400).json({message: error.message});
        }
    }


    async getUser(req: Request, res: Response) {
        try{
            const userData = await pool.query('SELECT * FROM users');
            res.json(userData.rows);
        } catch (error:any) {
        res.status(400).json({message: error.message})
        }
    }


}

export default new AuthController();