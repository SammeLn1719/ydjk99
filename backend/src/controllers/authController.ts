import { Request, Response } from 'express';

class AuthController {
    async registeration(req: Request, res: Response) {
        try{

        } catch (error) {
           
        }
    }
    async login(req: Request, res: Response) {
        try{

        } catch (error) {
           
        }
    }
    async getUser(req: Request, res: Response) {
        try{
            res.json("User fetched successfully");
        } catch (error) {
           
        }
    }
}

export default new AuthController();