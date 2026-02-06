import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export class UserController {
    constructor(private prisma: PrismaClient) { }

    private getCurrentUser(request: FastifyRequest): { id: string; role: string } | null {
        const user = (request as any).user;
        return user?.id && user?.role ? { id: user.id, role: user.role } : null;
    }

    async listUsers(request: FastifyRequest, reply: FastifyReply) {
        const current = this.getCurrentUser(request);
        if (!current) {
            return reply.status(401).send({ message: 'Unauthorized' });
        }
        if (current.role === 'admin') {
            return this.prisma.user.findMany({
                select: { id: true, name: true, email: true, role: true, createdAt: true, createdById: true }
            });
        }
        return this.prisma.user.findMany({
            where: {
                OR: [
                    { id: current.id },
                    { createdById: current.id }
                ]
            },
            select: { id: true, name: true, email: true, role: true, createdAt: true, createdById: true }
        });
    }

    async createUser(request: FastifyRequest<{ Body: { name: string; email: string; password: string; role?: string } }>, reply: FastifyReply) {
        const current = this.getCurrentUser(request);
        if (!current) {
            return reply.status(401).send({ message: 'Unauthorized' });
        }
        const { name, email, password, role } = request.body;

        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) {
            return reply.status(409).send({ message: 'Email already exists' });
        }

        const isAdmin = current.role === 'admin';
        const newRole = isAdmin ? (role || 'user') : 'user';
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: newRole,
                createdById: current.id
            },
            select: { id: true, name: true, email: true, role: true, createdById: true }
        });

        return user;
    }

    async deleteUser(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const current = this.getCurrentUser(request);
        if (!current) {
            return reply.status(401).send({ message: 'Unauthorized' });
        }
        const { id } = request.params;

        if (current.id === id) {
            try {
                await this.prisma.user.delete({ where: { id } });
                return { message: 'User deleted' };
            } catch (e) {
                return reply.status(404).send({ message: 'User not found' });
            }
        }

        if (current.role === 'admin') {
            try {
                await this.prisma.user.delete({ where: { id } });
                return { message: 'User deleted' };
            } catch (e) {
                return reply.status(404).send({ message: 'User not found' });
            }
        }

        const target = await this.prisma.user.findUnique({
            where: { id },
            select: { createdById: true }
        });
        if (!target) {
            return reply.status(404).send({ message: 'User not found' });
        }
        if (target.createdById !== current.id) {
            return reply.status(403).send({ message: 'You can only delete your own account or users you created' });
        }

        try {
            await this.prisma.user.delete({ where: { id } });
            return { message: 'User deleted' };
        } catch (e) {
            return reply.status(404).send({ message: 'User not found' });
        }
    }
}
