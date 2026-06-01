import { PuzzlePair, GameSettings } from '../types';

export interface MazeCell {
  row: number;
  col: number;
  question: string;
  answer: string;
  isCorrectPath: boolean;
  correctPathIndex?: number;
}

export interface MazeEdge {
  id: string;
  rowA: number;
  colA: number;
  rowB: number;
  colB: number;
  text: string;
  isCorrectPath: boolean;
}

export interface MazeData {
  rows: number;
  cols: number;
  cells: MazeCell[][];
  edges: MazeEdge[];
  correctPath: { row: number; col: number }[];
}

// DFS to find a random path from (0,0) to (rows-1, cols-1) without self-intersection
function findRandomPath(rows: number, cols: number, allowDiagonal: boolean): { row: number; col: number }[] {
  const start = { row: 0, col: 0 };
  const end = { row: rows - 1, col: cols - 1 };

  const getNeighbors = (r: number, c: number) => {
    const directions = [
      { r: -1, c: 0 }, // Up
      { r: 1, c: 0 },  // Down
      { r: 0, c: -1 }, // Left
      { r: 0, c: 1 },  // Right
    ];
    if (allowDiagonal) {
      directions.push(
        { r: -1, c: -1 }, // Up-Left
        { r: -1, c: 1 },  // Up-Right
        { r: 1, c: -1 },  // Down-Left
        { r: 1, c: 1 }    // Down-Right
      );
    }
    return directions
      .map((d) => ({ row: r + d.r, col: c + d.c }))
      .filter((n) => n.row >= 0 && n.row < rows && n.col >= 0 && n.col < cols);
  };

  const visited = new Set<string>();
  const path: { row: number; col: number }[] = [];

  const dfs = (r: number, c: number): boolean => {
    const key = `${r}_${c}`;
    visited.add(key);
    path.push({ row: r, col: c });

    if (r === end.row && c === end.col) {
      return true;
    }

    const neighbors = getNeighbors(r, c).filter((n) => !visited.has(`${n.row}_${n.col}`));
    
    // Shuffle neighbors to get a random path
    for (let i = neighbors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
    }

    for (const n of neighbors) {
      if (dfs(n.row, n.col)) {
        return true;
      }
    }

    path.pop();
    visited.delete(key);
    return false;
  };

  dfs(start.row, start.col);
  return path;
}

// Generate random math questions if pairs are insufficient or for distractor cells
function generateRandomMathQuestion(index: number): { question: string; answer: string } {
  const operators = ['+', '-', '×'];
  const op = operators[index % operators.length];
  let num1 = 0, num2 = 0, ans = 0;

  if (op === '+') {
    num1 = Math.floor(Math.random() * 20) + 5;
    num2 = Math.floor(Math.random() * 20) + 5;
    ans = num1 + num2;
  } else if (op === '-') {
    num1 = Math.floor(Math.random() * 30) + 15;
    num2 = Math.floor(Math.random() * 12) + 2;
    ans = num1 - num2;
  } else {
    num1 = Math.floor(Math.random() * 8) + 2;
    num2 = Math.floor(Math.random() * 9) + 2;
    ans = num1 * num2;
  }

  return {
    question: `${num1} ${op} ${num2}`,
    answer: String(ans),
  };
}

// Parse answer to number if possible, or return a fake number/text
function generateDistractor(correctAnswer: string, seed: number): string {
  const val = parseInt(correctAnswer.trim(), 10);
  if (!isNaN(val)) {
    const offsets = [-3, -2, -1, 1, 2, 3, 5, -5, 10, -10];
    const offset = offsets[Math.abs(seed * 7 + 3) % offsets.length];
    let fakeVal = val + offset;
    if (fakeVal < 0) fakeVal = Math.abs(fakeVal) + 1;
    return String(fakeVal);
  }
  // If text answer, return a random text or append a seed number
  return `${correctAnswer} (${seed + 1})`;
}

export function generateMazeData(
  pairs: PuzzlePair[],
  settings: GameSettings,
  aiDistractors?: Map<string, string[]>
): MazeData {
  const rows = settings.mazeRows || 4;
  const cols = settings.mazeCols || 5;
  const allowDiag = settings.allowDiagonal || false;

  // 1. Find a suitable random path from Start to End
  const minLength = rows + cols - 1;
  const targetPathLength = Math.min(pairs.length + 1, rows * cols);
  let bestPath = findRandomPath(rows, cols, allowDiag);
  let bestDiff = Math.abs(bestPath.length - targetPathLength);

  // Try up to 30 times to find a path whose length is closest to targetPathLength
  for (let i = 0; i < 30; i++) {
    const tempPath = findRandomPath(rows, cols, allowDiag);
    const tempDiff = Math.abs(tempPath.length - targetPathLength);
    if (tempDiff < bestDiff || (tempDiff === bestDiff && tempPath.length > bestPath.length)) {
      bestPath = tempPath;
      bestDiff = tempDiff;
    }
    if (bestDiff === 0) {
      break;
    }
  }

  const correctPath = bestPath;
  const pathKeys = new Set(correctPath.map((p) => `${p.row}_${p.col}`));

  // Helper mapping grid coordinate to index in path
  const getPathIndex = (r: number, c: number): number => {
    return correctPath.findIndex((p) => p.row === r && p.col === c);
  };

  // 2. Initialize cells matrix
  const cells: MazeCell[][] = [];
  let userPairIndex = 0;
  let fallbackSeed = 0;

  for (let r = 0; r < rows; r++) {
    const rowCells: MazeCell[] = [];
    for (let c = 0; c < cols; c++) {
      const isCorrectPath = pathKeys.has(`${r}_${c}`);
      const pIdx = getPathIndex(r, c);

      let question = '';
      let answer = '';

      if (r === rows - 1 && c === cols - 1) {
        // Destination cell
        question = 'End';
        answer = '🏁';
      } else if (isCorrectPath) {
        // Try using user-provided pairs first for correct path
        if (userPairIndex < pairs.length) {
          question = pairs[userPairIndex].question;
          answer = pairs[userPairIndex].answer;
          userPairIndex++;
        } else {
          // Fill path with autogenerated math questions if user pairs run out
          const sample = generateRandomMathQuestion(fallbackSeed++);
          question = sample.question;
          answer = sample.answer;
        }
      } else {
        // Distractor cells (off path)
        const sample = generateRandomMathQuestion(fallbackSeed++);
        question = sample.question;
        answer = sample.answer;
      }

      rowCells.push({
        row: r,
        col: c,
        question,
        answer,
        isCorrectPath,
        correctPathIndex: pIdx >= 0 ? pIdx : undefined,
      });
    }
    cells.push(rowCells);
  }

  // 3. Generate Edges (connections between adjacent cells)
  const edges: MazeEdge[] = [];
  let edgeIdCounter = 0;

  // Loop through all cells to construct horizontal, vertical and diagonal links
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = cells[r][c];

      // Horizontal edge (to the right)
      if (c < cols - 1) {
        const neighbor = cells[r][c + 1];
        const isHCorrectEdge = 
          cell.isCorrectPath &&
          neighbor.isCorrectPath &&
          Math.abs((cell.correctPathIndex ?? 0) - (neighbor.correctPathIndex ?? 0)) === 1;

        let edgeText = '';
        if (isHCorrectEdge) {
          // If correct edge, show the correct answer of the cell that came first in path
          const firstInPath = (cell.correctPathIndex ?? 0) < (neighbor.correctPathIndex ?? 0) ? cell : neighbor;
          edgeText = firstInPath.answer;
        } else {
          // Distractor text
          const sourceCell = cell.isCorrectPath ? cell : neighbor;
          const distractors = aiDistractors?.get(sourceCell.answer.trim());
          if (distractors && distractors.length > 0) {
            const distractorIndex = Math.abs(edgeIdCounter) % distractors.length;
            edgeText = distractors[distractorIndex];
          } else {
            edgeText = generateDistractor(sourceCell.answer, edgeIdCounter);
          }
        }

        edges.push({
          id: `edge-${edgeIdCounter++}`,
          rowA: r,
          colA: c,
          rowB: r,
          colB: c + 1,
          text: edgeText,
          isCorrectPath: isHCorrectEdge,
        });
      }

      // Vertical edge (downwards)
      if (r < rows - 1) {
        const neighbor = cells[r + 1][c];
        const isVCorrectEdge = 
          cell.isCorrectPath &&
          neighbor.isCorrectPath &&
          Math.abs((cell.correctPathIndex ?? 0) - (neighbor.correctPathIndex ?? 0)) === 1;

        let edgeText = '';
        if (isVCorrectEdge) {
          const firstInPath = (cell.correctPathIndex ?? 0) < (neighbor.correctPathIndex ?? 0) ? cell : neighbor;
          edgeText = firstInPath.answer;
        } else {
          const sourceCell = cell.isCorrectPath ? cell : neighbor;
          const distractors = aiDistractors?.get(sourceCell.answer.trim());
          if (distractors && distractors.length > 0) {
            const distractorIndex = Math.abs(edgeIdCounter) % distractors.length;
            edgeText = distractors[distractorIndex];
          } else {
            edgeText = generateDistractor(sourceCell.answer, edgeIdCounter);
          }
        }

        edges.push({
          id: `edge-${edgeIdCounter++}`,
          rowA: r,
          colA: c,
          rowB: r + 1,
          colB: c,
          text: edgeText,
          isCorrectPath: isVCorrectEdge,
        });
      }

      // Diagonal Down-Right edge (to r+1, c+1)
      if (allowDiag && r < rows - 1 && c < cols - 1) {
        const neighbor = cells[r + 1][c + 1];
        const isDiagDRCorrect = 
          cell.isCorrectPath &&
          neighbor.isCorrectPath &&
          Math.abs((cell.correctPathIndex ?? 0) - (neighbor.correctPathIndex ?? 0)) === 1;

        let edgeText = '';
        if (isDiagDRCorrect) {
          const firstInPath = (cell.correctPathIndex ?? 0) < (neighbor.correctPathIndex ?? 0) ? cell : neighbor;
          edgeText = firstInPath.answer;
        } else {
          const sourceCell = cell.isCorrectPath ? cell : neighbor;
          const distractors = aiDistractors?.get(sourceCell.answer.trim());
          if (distractors && distractors.length > 0) {
            const distractorIndex = Math.abs(edgeIdCounter) % distractors.length;
            edgeText = distractors[distractorIndex];
          } else {
            edgeText = generateDistractor(sourceCell.answer, edgeIdCounter);
          }
        }

        edges.push({
          id: `edge-${edgeIdCounter++}`,
          rowA: r,
          colA: c,
          rowB: r + 1,
          colB: c + 1,
          text: edgeText,
          isCorrectPath: isDiagDRCorrect,
        });
      }

      // Diagonal Down-Left edge (to r+1, c-1)
      if (allowDiag && r < rows - 1 && c > 0) {
        const neighbor = cells[r + 1][c - 1];
        const isDiagDLCorrect = 
          cell.isCorrectPath &&
          neighbor.isCorrectPath &&
          Math.abs((cell.correctPathIndex ?? 0) - (neighbor.correctPathIndex ?? 0)) === 1;

        let edgeText = '';
        if (isDiagDLCorrect) {
          const firstInPath = (cell.correctPathIndex ?? 0) < (neighbor.correctPathIndex ?? 0) ? cell : neighbor;
          edgeText = firstInPath.answer;
        } else {
          const sourceCell = cell.isCorrectPath ? cell : neighbor;
          const distractors = aiDistractors?.get(sourceCell.answer.trim());
          if (distractors && distractors.length > 0) {
            const distractorIndex = Math.abs(edgeIdCounter) % distractors.length;
            edgeText = distractors[distractorIndex];
          } else {
            edgeText = generateDistractor(sourceCell.answer, edgeIdCounter);
          }
        }

        edges.push({
          id: `edge-${edgeIdCounter++}`,
          rowA: r,
          colA: c,
          rowB: r + 1,
          colB: c - 1,
          text: edgeText,
          isCorrectPath: isDiagDLCorrect,
        });
      }
    }
  }

  return {
    rows,
    cols,
    cells,
    edges,
    correctPath,
  };
}

