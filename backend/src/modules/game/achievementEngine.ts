/**
 * Achievement Rule Engine
 * Evaluates JSON condition trees against user stats.
 * Supports: gte, gt, lte, lt, eq operators and AND/OR compound conditions.
 */

export interface UserStats {
  rooms_joined: number;
  rooms_created: number;
  packs_created: number;
  friends: number;
  wins: number;
  current_streak: number;
}

type Operator = 'gte' | 'gt' | 'lte' | 'lt' | 'eq';

interface OperatorMap {
  gte?: number;
  gt?: number;
  lte?: number;
  lt?: number;
  eq?: number;
}

interface CompoundCondition {
  AND?: Condition[];
  OR?: Condition[];
}

interface LeafCondition {
  [statKey: string]: OperatorMap;
}

type Condition = LeafCondition | CompoundCondition;

function isCompound(condition: Condition): condition is CompoundCondition {
  return 'AND' in condition || 'OR' in condition;
}

/**
 * Evaluate a single operator map against a numeric value
 */
function evaluateOperators(value: number, operators: OperatorMap): boolean {
  for (const [op, threshold] of Object.entries(operators)) {
    if (threshold === undefined) continue;
    switch (op as Operator) {
      case 'gte': if (!(value >= threshold)) return false; break;
      case 'gt':  if (!(value > threshold))  return false; break;
      case 'lte': if (!(value <= threshold)) return false; break;
      case 'lt':  if (!(value < threshold))  return false; break;
      case 'eq':  if (!(value === threshold)) return false; break;
      default: return false;
    }
  }
  return true;
}

/**
 * Evaluate a JSON condition tree against a user's stats
 */
export function evaluateCondition(condition: Condition, stats: UserStats): boolean {
  if (isCompound(condition)) {
    if ('AND' in condition && Array.isArray(condition.AND)) {
      return condition.AND.every((c) => evaluateCondition(c, stats));
    }
    if ('OR' in condition && Array.isArray(condition.OR)) {
      return condition.OR.some((c) => evaluateCondition(c, stats));
    }
    return false;
  }

  // Leaf condition: { "rooms_joined": { "gte": 50 } }
  for (const [statKey, operators] of Object.entries(condition)) {
    const value = stats[statKey as keyof UserStats];
    if (value === undefined) return false;
    if (!evaluateOperators(value, operators as OperatorMap)) return false;
  }

  return true;
}
