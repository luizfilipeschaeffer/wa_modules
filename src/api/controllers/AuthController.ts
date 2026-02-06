import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export class AuthController {
    constructor(private prisma: PrismaClient) { }

    async login(request: FastifyRequest<{ Body: { email: string; password: string } }>, reply: FastifyReply) {
        const { email, password } = request.body;

        const user = await this.prisma.user.findUnique({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return reply.status(401).send({ message: 'Invalid credentials' });
        }

        const token = await reply.jwtSign({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        });

        return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }
}
