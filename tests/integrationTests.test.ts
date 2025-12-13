import * as fs from 'node:fs';
import * as path from 'node:path';
import { ChildProcess, fork } from 'node:child_process';

import { ExampleBlock, parseBaseExamplesMarkdown } from '../src/utils/parseBaseExamples';

type WorkerMessage =
    | { type: 'ready' }
    | { type: 'init_error'; error: string }
    | { type: 'result'; id: number; formatted: string; json: string | null }
    | { type: 'error'; id: number; error: string };

type WorkerCommand = { type: 'evaluate'; id: number; code: string };
type WorkerResult = { formatted: string; json: string | null };

const workerPath = path.join(__dirname, 'helpers', 'wasm-runner.cjs');

let worker: ChildProcess | null = null;
let nextMessageId = 0;

const startWorker = async (): Promise<void> => {
    if (worker) return;

    worker = fork(workerPath, [], {
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
        cwd: process.cwd(),
        env: process.env,
    });

    await new Promise<void>((resolve, reject) => {
        if (!worker) {
            reject(new Error('Worker failed to start'));
            return;
        }

        let settled = false;

        const onMessage = (msg: WorkerMessage): void => {
            if (settled) return;
            if (msg.type === 'ready') {
                settled = true;
                worker?.off('message', onMessage);
                worker?.off('exit', onExit);
                resolve();
            } else if (msg.type === 'init_error') {
                settled = true;
                worker?.off('message', onMessage);
                worker?.off('exit', onExit);
                reject(new Error(`WASM worker init failed: ${msg.error}`));
            }
        };

        const onExit = (code: number | null): void => {
            if (settled) return;
            settled = true;
            worker?.off('message', onMessage);
            reject(new Error(`WASM worker exited prematurely with code ${code ?? -1}`));
        };

        worker.on('message', onMessage);
        worker.once('exit', onExit);
    });
};

const stopWorker = (): void => {
    if (!worker) return;
    worker.kill();
    worker = null;
};

const evaluateWithWorker = async (code: string): Promise<WorkerResult> => {
    if (!worker) {
        throw new Error('WASM worker is not ready');
    }
    const id = nextMessageId += 1;
    const payload: WorkerCommand = { type: 'evaluate', id, code };

    return new Promise<WorkerResult>((resolve, reject) => {
        if (!worker) {
            reject(new Error('WASM worker is not ready'));
            return;
        }

        const handleMessage = (msg: WorkerMessage): void => {
            if (msg.type === 'result' && msg.id === id) {
                cleanup();
                resolve({ formatted: msg.formatted, json: msg.json });
            } else if (msg.type === 'error' && msg.id === id) {
                cleanup();
                reject(new Error(msg.error));
            }
        };

        const handleExit = (code: number | null): void => {
            cleanup();
            reject(new Error(`WASM worker exited unexpectedly with code ${code ?? -1}`));
        };

        const cleanup = (): void => {
            if (!worker) return;
            worker.off('message', handleMessage);
            worker.off('exit', handleExit);
        };

        worker.on('message', handleMessage);
        worker.once('exit', handleExit);
        worker.send(payload);
    });
};

describe('BASE_EXAMPLES.md integration output parity', () => {
    beforeAll(async () => {
        await startWorker();
    });

    afterAll(() => {
        stopWorker();
    });

    test('evaluated examples match recorded output blocks', () => {
        const markdownPath = path.join(process.cwd(), 'public', 'docs', 'BASE_EXAMPLES.md');
        const markdown = fs.readFileSync(markdownPath, 'utf8');
        const blocks = parseBaseExamplesMarkdown(markdown);

        const mismatches: string[] = [];
        const promiseChecks: Promise<void>[] = [];

        const appendFailure = (block: ExampleBlock, index: number, message: string, actual?: string, expected?: string): void => {
            const contextParts = [
                block.pageTitle ?? undefined,
                block.sectionTitle ?? undefined,
            ].filter((part) => typeof part === 'string' && part.length > 0) as string[];

            const context = contextParts.length > 0 ? contextParts.join(' / ') : `Example ${index + 1}`;
            const rows = [`${context}: ${message}`];
            if (typeof expected === 'string') {
                rows.push('expected:', expected);
            }
            if (typeof actual === 'string') {
                rows.push('received:', actual);
            }
            mismatches.push(rows.join('\n'));
        };

        blocks.forEach((block, idx) => {
            const code = block.codeExample;
            if (!code || code.trim().length === 0) {
                return;
            }

            const expectedOutput = block.getOutput().trim();
            if (expectedOutput.length === 0) {
                appendFailure(block, idx, 'missing output section');
                return;
            }

            try {
                const evaluation = evaluateWithWorker(code).then((payload) => {
                    const { formatted, json } = payload;
                    if (json === null) {
                        appendFailure(block, idx, 'unable to serialize evaluation result', formatted.trim(), expectedOutput);
                        return;
                    }

                    let expectedNormalized: string;
                    try {
                        const parsed = JSON.parse(expectedOutput);
                        expectedNormalized = JSON.stringify(parsed, null, 2);
                    } catch (error) {
                        appendFailure(block, idx, `invalid JSON in output block: ${(error as Error)?.message ?? String(error)}`);
                        return;
                    }

                    const actualNormalized = json.trim();
                    if (actualNormalized !== expectedNormalized.trim()) {
                        appendFailure(block, idx, 'output mismatch', actualNormalized, expectedNormalized);
                    }
                });
                promiseChecks.push(
                    evaluation.catch((error) => {
                        appendFailure(block, idx, `execution error: ${(error as Error)?.message ?? String(error)}`);
                    }),
                );
            } catch (error) {
                appendFailure(block, idx, `execution error: ${(error as Error)?.message ?? String(error)}`);
            }
        });

        return Promise.all(promiseChecks).then(() => {
            if (mismatches.length > 0) {
                throw new Error(`Integration mismatch detected:\n\n${mismatches.join('\n\n')}`);
            }
        });
    });
});
