/**
 * Funções auxiliares gerais
 */

/**
 * Delay/sleep assíncrono
 * @param ms Milissegundos para aguardar
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry com backoff exponencial
 * @param fn Função para executar
 * @param maxRetries Número máximo de tentativas
 * @param initialDelay Delay inicial em ms
 * @returns Resultado da função
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            if (i < maxRetries - 1) {
                const delay = initialDelay * Math.pow(2, i);
                await sleep(delay);
            }
        }
    }

    throw lastError!;
}

/**
 * Debounce de função
 * @param fn Função para debounce
 * @param delay Delay em ms
 * @returns Função com debounce
 */
export function debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Throttle de função
 * @param fn Função para throttle
 * @param limit Limite em ms
 * @returns Função com throttle
 */
export function throttle<T extends (...args: any[]) => any>(
    fn: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

/**
 * Gera ID único
 * @returns ID único
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Verifica se objeto está vazio
 * @param obj Objeto para verificar
 * @returns true se vazio
 */
export function isEmpty(obj: any): boolean {
    if (obj === null || obj === undefined) return true;
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
}

/**
 * Deep clone de objeto
 * @param obj Objeto para clonar
 * @returns Clone do objeto
 */
export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Merge profundo de objetos
 * @param target Objeto alvo
 * @param sources Objetos fonte
 * @returns Objeto merged
 */
export function deepMerge<T extends object>(target: T, ...sources: Partial<T>[]): T {
    if (!sources.length) return target;

    const source = sources.shift();
    if (!source) return target;

    for (const key in source) {
        const sourceValue = source[key];
        const targetValue = target[key];

        if (
            sourceValue &&
            typeof sourceValue === 'object' &&
            !Array.isArray(sourceValue) &&
            targetValue &&
            typeof targetValue === 'object' &&
            !Array.isArray(targetValue)
        ) {
            target[key] = deepMerge(targetValue, sourceValue as any);
        } else if (sourceValue !== undefined) {
            target[key] = sourceValue as any;
        }
    }

    return deepMerge(target, ...sources);
}

/**
 * Sanitiza string removendo caracteres especiais
 * @param str String para sanitizar
 * @returns String sanitizada
 */
export function sanitizeString(str: string): string {
    return str.replace(/[^\w\s-]/gi, '');
}

/**
 * Chunk array em pedaços menores
 * @param array Array para dividir
 * @param size Tamanho de cada chunk
 * @returns Array de chunks
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
