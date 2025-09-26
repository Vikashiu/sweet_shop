import express from 'express';
import { authRouter } from './routes/authRoutes';
// import  sweetsRouterImpl  from './routes/sweetsRoutes';


const app = express();
app.use(express.json());


app.use('/api/auth', authRouter);
// app.use('/api/sweets', sweetsRouterImpl);
// 

export default app;