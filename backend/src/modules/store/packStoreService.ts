/**
 * Pack Store Service
 * Auto-loads question packs from TOML files in /store/packs/
 * Each pack folder contains a .toml file and an optional media/ directory
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, extname } from 'path';
import TOML from '@iarna/toml';
import { getRedis } from '../../config/redis';
import { config } from '../../config/env';
import logger from '../../shared/utils/logger';

const STORE_DIR = join(__dirname, '../../store');
const PACKS_DIR = join(STORE_DIR, 'packs');
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

// ============================================================================
// TYPES
// ============================================================================

export interface StorePackQuestion {
  number: number;
  question: string;
  answer: string;
  coverUrl: string | null;
}

export interface StorePack {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  coverUrl: string | null;
  textHint: string;
  price: number;
  previewQuestions: number;
  numberOfQuestions: number;
  questions: StorePackQuestion[];
}

export interface StorePackPreview {
  id: string;
  name: string;
  description: string;
  author: string;
  coverUrl: string | null;
  textHint: string;
  price: number;
  numberOfQuestions: number;
  previewQuestions: StorePackQuestion[];
}

// ============================================================================
// TOML PARSING
// ============================================================================

interface TomlPackInfo {
  name: string;
  description: string;
  version?: string;
  author?: string;
  cover?: string;
  'text-hint'?: string;
  price?: number;
  'preview-questions'?: number;
  'number-of-questions'?: number;
}

interface TomlQuestion {
  question: string;
  answer: string;
  cover?: string;
}

/**
 * Resolve a relative media path (e.g. "./media/cover.jpg") to a full URL
 */
function resolveMediaUrl(packFolderId: string, relativePath: string | undefined, baseUrl: string): string | null {
  if (!relativePath) return null;

  // Strip leading "./" if present
  const cleanPath = relativePath.replace(/^\.\//, '');
  const absolutePath = join(PACKS_DIR, packFolderId, cleanPath);

  if (!existsSync(absolutePath)) return null;
  return `${baseUrl}/store/packs/${packFolderId}/${cleanPath}`;
}

/**
 * Find media file for a question by checking common image extensions
 * Supports cover paths in TOML or auto-detection from media/ folder
 */
function findQuestionMedia(packFolderId: string, questionNumber: number, baseUrl: string): string | null {
  const mediaDir = join(PACKS_DIR, packFolderId, 'media');
  if (!existsSync(mediaDir)) return null;

  for (const ext of IMAGE_EXTENSIONS) {
    const filename = `question${questionNumber}${ext}`;
    const filePath = join(mediaDir, filename);
    if (existsSync(filePath)) {
      return `${baseUrl}/store/packs/${packFolderId}/media/${filename}`;
    }
  }
  return null;
}

// ============================================================================
// PACK STORE SERVICE
// ============================================================================

class PackStoreService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.baseUrl;
  }

  /**
   * Load all packs from the /store/packs/ directory
   * Each subdirectory is a pack with a TOML file and optional media/
   */
  getStorePacks(): StorePack[] {
    if (!existsSync(PACKS_DIR)) return [];

    const packFolders = readdirSync(PACKS_DIR).filter(item => {
      const itemPath = join(PACKS_DIR, item);
      return statSync(itemPath).isDirectory();
    });

    const packs: StorePack[] = [];

    for (const folder of packFolders) {
      try {
        const pack = this.loadPackFromFolder(folder);
        if (pack) packs.push(pack);
      } catch (error: any) {
        logger.error(`Failed to load pack from ${folder}: ${error.message}`);
      }
    }

    return packs;
  }

  /**
   * Load a single pack from a folder
   */
  private loadPackFromFolder(folderId: string): StorePack | null {
    const folderPath = join(PACKS_DIR, folderId);

    // Find the TOML file in the folder
    const tomlFile = readdirSync(folderPath).find(f => extname(f).toLowerCase() === '.toml');
    if (!tomlFile) {
      logger.warn(`No TOML file found in pack folder: ${folderId}`);
      return null;
    }

    const tomlContent = readFileSync(join(folderPath, tomlFile), 'utf-8');
    const parsed = TOML.parse(tomlContent);

    const packInfo = parsed['pack-info'] as unknown as TomlPackInfo;
    if (!packInfo?.name) {
      logger.warn(`Invalid pack-info in ${folderId}/${tomlFile}`);
      return null;
    }

    const numberOfQuestions = packInfo['number-of-questions'] || 0;
    const questions: StorePackQuestion[] = [];

    for (let i = 1; i <= numberOfQuestions; i++) {
      const qKey = `question${i}`;
      const qData = parsed[qKey] as unknown as TomlQuestion | undefined;
      if (!qData?.question || !qData?.answer) continue;

      // Try TOML cover path first, then auto-detect from media/
      let coverUrl = resolveMediaUrl(folderId, qData.cover, this.baseUrl);
      if (!coverUrl) {
        coverUrl = findQuestionMedia(folderId, i, this.baseUrl);
      }

      questions.push({
        number: i,
        question: qData.question,
        answer: qData.answer,
        coverUrl,
      });
    }

    return {
      id: folderId,
      name: packInfo.name,
      description: packInfo.description || '',
      author: packInfo.author || 'Unknown',
      version: packInfo.version || '1.0.0',
      coverUrl: resolveMediaUrl(folderId, packInfo.cover, this.baseUrl),
      textHint: packInfo['text-hint'] || '',
      price: packInfo.price || 0,
      previewQuestions: packInfo['preview-questions'] || 3,
      numberOfQuestions: questions.length,
      questions,
    };
  }

  /**
   * Get pack previews (limited questions for store display)
   */
  async getPackPreviews(): Promise<StorePackPreview[]> {
    return this.cachedGet('store:packs', 3600, () => {
      const packs = this.getStorePacks();
      return packs.map(pack => ({
        id: pack.id,
        name: pack.name,
        description: pack.description,
        author: pack.author,
        coverUrl: pack.coverUrl,
        textHint: pack.textHint,
        price: pack.price,
        numberOfQuestions: pack.numberOfQuestions,
        previewQuestions: pack.questions.slice(0, pack.previewQuestions),
      }));
    });
  }

  /**
   * Get a single full pack by ID (for after purchase)
   */
  async getFullPack(packId: string): Promise<StorePack | null> {
    const packs = this.getStorePacks();
    return packs.find(p => p.id === packId) || null;
  }

  /**
   * Generic Redis cache helper
   */
  private async cachedGet<T>(key: string, ttl: number, compute: () => T): Promise<T> {
    try {
      const redis = getRedis();
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
      const result = compute();
      await redis.set(key, JSON.stringify(result), 'EX', ttl);
      return result;
    } catch {
      logger.debug(`Cache miss/error for ${key}, computing fresh`);
      return compute();
    }
  }
}

export const packStoreService = new PackStoreService();
