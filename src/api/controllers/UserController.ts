import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export class UserController {
    constructor(private prisma: PrismaClient) { }

    async listUsers(_request: FastifyRequest, _reply: FastifyReply) {
        return this.prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, createdAt: true }
        });
    }

    async createUser(request: FastifyRequest<{ Body: { name: string; email: string; password: string; role?: string } }>, reply: FastifyReply) {
        const { name, email, password, role } = request.body;

        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) {
            return reply.status(409).send({ message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'user'
            },
            select: { id: true, name: true, email: true, role: true }
        });

        return user;
    }

    async deleteUser(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params;

        try {
            await this.prisma.user.delete({ where: { id } });
            return { message: 'User deleted' };
        } catch (e) {
            return reply.status(404).send({ message: 'User not found' });
        }
    }
}
