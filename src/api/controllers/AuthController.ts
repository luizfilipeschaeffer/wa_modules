import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

/** Converte string tipo "30d", "365d", "1y" em milissegundos */
function parseExpiresIn(expiresIn: string): number {
    const m = expiresIn.trim().match(/^(\d+)(d|h|m|y)$/i);
    if (!m) return 365 * 24 * 60 * 60 * 1000; // padrão 1 ano
    const n = parseInt(m[1], 10);
    const unit = m[2].toLowerCase();
    const day = 24 * 60 * 60 * 1000;
    if (unit === 'd') return n * day;
    if (unit === 'h') return n * (day / 24);
    if (unit === 'm') return n * (day / 24 / 60);
    if (unit === 'y') return n * 365 * day;
    return 365 * day;
}

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

    async generateApiToken(request: FastifyRequest<{ Body?: { expiresIn?: string; name?: string } }>, reply: FastifyReply) {
        const user = (request as any).user;
        if (!user) {
            return reply.status(401).send({ message: 'Unauthorized' });
        }

        const expiresInStr = request.body?.expiresIn || '365d';
        const name = request.body?.name || null;

        // Token aleatório (64 caracteres hex = 32 bytes)
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        const ms = parseExpiresIn(expiresInStr);
        const expiresAt = new Date(Date.now() + ms);

        await this.prisma.apiToken.create({
            data: {
                userId: user.id,
                tokenHash,
                name,
                expiresAt
            }
        });

        return {
            token: rawToken,
            expiresIn: expiresInStr,
            expiresAt: expiresAt.toISOString(),
            message: 'Token gerado com sucesso. Guarde este token em local seguro; ele não será exibido novamente e é validado pelo banco de dados.',
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        };
    }
}
