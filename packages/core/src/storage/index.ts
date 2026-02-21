import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';

const DATA_DIR = join(process.cwd(), 'data');

export function getTimestampId(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function ensureDir(dir: string): Promise<void> {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

export async function write<T>(relativePath: string, data: T): Promise<string> {
  const fullPath = join(DATA_DIR, relativePath);
  await ensureDir(dirname(fullPath));
  await writeFile(fullPath, JSON.stringify(data, null, 2), 'utf-8');
  return fullPath;
}

export async function read<T>(relativePath: string): Promise<T | null> {
  const fullPath = join(DATA_DIR, relativePath);
  if (!existsSync(fullPath)) return null;
  const content = await readFile(fullPath, 'utf-8');
  return JSON.parse(content) as T;
}

export async function listFiles(relativePath: string): Promise<string[]> {
  const fullPath = join(DATA_DIR, relativePath);
  if (!existsSync(fullPath)) return [];
  const entries = await readdir(fullPath);
  return entries.sort();
}

export async function getLatestFile<T>(relativePath: string): Promise<T | null> {
  const files = await listFiles(relativePath);
  if (files.length === 0) return null;
  const latest = files[files.length - 1];
  return read<T>(join(relativePath, latest));
}

export { DATA_DIR };
