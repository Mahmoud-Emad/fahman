/**
 * Pack Store Service
 * Auto-loads question packs from TOML files in /store/packs/
 *
 * Directory structure:
 *   /store/packs/<pack-folder>/pack.toml   - Pack definition
 *   /store/packs/<pack-folder>/media/      - Pack media (cover.png, question1.png, etc.)
 *   /store/packs/temp.toml                 - Template file (ignored)
 *
 * Pack ID = folder name (e.g. "game-of-thrones")
 * Display name derived from folder name: "game-of-thrones" → "Game of Thrones"
 * Free/paid determined by `free` field in TOML (not folder location)
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { getErrorMessage } from '@shared/utils/errorUtils';
import { join } from 'path';
import TOML from '@iarna/toml';
import { config } from '@config/env';
import logger from '@shared/utils/logger';

const STORE_DIR = join(__dirname, '../../store');
const PACKS_DIR = join(STORE_DIR, 'packs');
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

// ============================================================================
// TYPES
// ============================================================================

export interface StorePackQuestion {
  number: number;
  question: string;
  answers: string[];
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
  free: boolean;
  category: string;
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
  free: boolean;
  category: string;
  numberOfQuestions: number;
  previewQuestions: StorePackQuestion[];
}

// ============================================================================
// TOML PARSING
// ============================================================================

interface TomlPackInfo {
  id?: string;
  name?: string;
  description?: string;
  version?: string;
  author?: string;
  cover?: string;
  'text-hint'?: string;
  price?: number;
  free?: boolean;
  category?: string;
  'preview-questions'?: number;
  'number-of-questions'?: number;
}

interface TomlQuestion {
  question: string;
  /** Single answer (legacy) */
  answer?: string;
  /** Multiple accepted answers */
  answers?: string[];
  cover?: string;
}

/**
 * Convert folder name to display name: "game-of-thrones" → "Game of Thrones"
 */
function folderToDisplayName(folderName: string): string {
  return folderName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Resolve a relative media path to a full URL
 */
function resolveMediaUrl(packFolder: string, relativePath: string | undefined, baseUrl: string): string | null {
  if (!relativePath) return null;

  const cleanPath = relativePath.replace(/^\.\//, '');
  const absolutePath = join(PACKS_DIR, packFolder, cleanPath);

  if (!existsSync(absolutePath)) return null;
  return `${baseUrl}/static/store/packs/${packFolder}/${cleanPath}`;
}

/**
 * Find media file for a question by checking common image extensions
 */
function findQuestionMedia(packFolder: string, questionNumber: number, baseUrl: string): string | null {
  const mediaDir = join(PACKS_DIR, packFolder, 'media');
  if (!existsSync(mediaDir)) return null;

  for (const ext of IMAGE_EXTENSIONS) {
    const filename = `question${questionNumber}${ext}`;
    if (existsSync(join(mediaDir, filename))) {
      return `${baseUrl}/static/store/packs/${packFolder}/media/${filename}`;
    }
  }
  return null;
}

/**
 * Parse a pack.toml file into a StorePack
 */
function parsePack(packFolder: string, tomlFilePath: string, baseUrl: string): StorePack {
  const tomlContent = readFileSync(tomlFilePath, 'utf-8');
  const parsed = TOML.parse(tomlContent);

  const packInfo = parsed['pack-info'] as unknown as TomlPackInfo;
  if (!packInfo) {
    throw new Error(`[pack:${packFolder}] Missing [pack-info] section`);
  }

  // Validate UUID
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!packInfo.id || !UUID_REGEX.test(packInfo.id)) {
    throw new Error(
      `[pack:${packFolder}] Missing or invalid "id" in [pack-info]. ` +
      `Must be a valid UUID. Generate one with \`uuidgen\`.`
    );
  }

  // Use TOML name if provided, otherwise derive from folder name
  const name = packInfo.name || folderToDisplayName(packFolder);
  const isFree = packInfo.free === true;
  const price = packInfo.price || 0;

  // Validation: paid pack with price 0 is a configuration error
  if (!isFree && price === 0) {
    throw new Error(
      `[pack:${packFolder}] Pack has free=false but price=0. ` +
      `Paid packs must have a price > 0. Set free=true for free packs.`
    );
  }

  const numberOfQuestions = packInfo['number-of-questions'] || 0;
  const questions: StorePackQuestion[] = [];

  for (let i = 1; i <= numberOfQuestions; i++) {
    const qData = parsed[`question${i}`] as unknown as TomlQuestion | undefined;
    if (!qData?.question) continue;

    // Support both "answers" (array) and "answer" (single string, legacy)
    let answers: string[];
    if (qData.answers && Array.isArray(qData.answers)) {
      answers = qData.answers.filter(a => a.length > 0);
    } else if (qData.answer) {
      answers = [qData.answer];
    } else {
      continue; // Skip questions with no answer
    }

    if (answers.length === 0) continue;

    let coverUrl = resolveMediaUrl(packFolder, qData.cover, baseUrl);
    if (!coverUrl) {
      coverUrl = findQuestionMedia(packFolder, i, baseUrl);
    }

    questions.push({ number: i, question: qData.question, answers, coverUrl });
  }

  return {
    id: packInfo.id!,
    name,
    description: packInfo.description || '',
    author: packInfo.author || 'Unknown',
    version: packInfo.version || '1.0.0',
    coverUrl: resolveMediaUrl(packFolder, packInfo.cover, baseUrl),
    textHint: packInfo['text-hint'] || '',
    price: isFree ? 0 : price,
    free: isFree,
    category: packInfo.category || '',
    previewQuestions: packInfo['preview-questions'] || 3,
    numberOfQuestions: questions.length,
    questions,
  };
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
   * Load all packs from /store/packs/.
   * Each subfolder with a pack.toml is a pack. Top-level .toml files are ignored.
   */
  getStorePacks(): StorePack[] {
    if (!existsSync(PACKS_DIR)) return [];

    const packs: StorePack[] = [];
    const entries = readdirSync(PACKS_DIR);

    for (const entry of entries) {
      const entryPath = join(PACKS_DIR, entry);

      // Only process directories (skip temp.toml and other files)
      if (!statSync(entryPath).isDirectory()) continue;

      const tomlPath = join(entryPath, 'pack.toml');
      if (!existsSync(tomlPath)) {
        logger.warn(`No pack.toml found in ${entry}/`);
        continue;
      }

      try {
        const pack = parsePack(entry, tomlPath, this.baseUrl);
        packs.push(pack);
      } catch (error) {
        // Validation errors (e.g. free=false + price=0) are fatal
        logger.error(`Failed to load pack "${entry}": ${getErrorMessage(error)}`);
        throw error;
      }
    }

    return packs;
  }

  /**
   * Get pack previews for the store (limited questions).
   * Always reads fresh from disk — no caching, so new packs appear instantly.
   */
  getPackPreviews(): StorePackPreview[] {
    return this.getStorePacks().map(pack => this.toPreview(pack));
  }

  /**
   * Get only free pack previews (for pack selection modal)
   */
  getFreePacks(): StorePackPreview[] {
    return this.getStorePacks()
      .filter(p => p.free)
      .map(pack => this.toPreview(pack));
  }

  /**
   * Get a single full pack by ID
   */
  getFullPack(packId: string): StorePack | null {
    return this.getStorePacks().find(p => p.id === packId) || null;
  }

  toPreview(pack: StorePack): StorePackPreview {
    return {
      id: pack.id,
      name: pack.name,
      description: pack.description,
      author: pack.author,
      coverUrl: pack.coverUrl,
      textHint: pack.textHint,
      price: pack.price,
      free: pack.free,
      category: pack.category,
      numberOfQuestions: pack.numberOfQuestions,
      previewQuestions: pack.questions.slice(0, pack.previewQuestions),
    };
  }
}

export const packStoreService = new PackStoreService();
