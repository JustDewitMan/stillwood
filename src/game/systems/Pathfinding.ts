/** Tiny A* over a boolean blocked grid. */

export interface Point {
  x: number
  y: number
}

function key(x: number, y: number) {
  return `${x},${y}`
}

export function findPath(
  start: Point,
  goal: Point,
  blocked: boolean[][],
  opts?: { adjacentGoal?: boolean },
): Point[] {
  const rows = blocked.length
  const cols = blocked[0]?.length ?? 0
  if (goal.x < 0 || goal.y < 0 || goal.x >= cols || goal.y >= rows) return []

  const goals = new Set<string>()
  if (opts?.adjacentGoal) {
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
      const gx = goal.x + dx
      const gy = goal.y + dy
      if (gx < 0 || gy < 0 || gx >= cols || gy >= rows) continue
      if (blocked[gy][gx]) continue
      goals.add(key(gx, gy))
    }
  } else {
    if (!blocked[goal.y][goal.x]) goals.add(key(goal.x, goal.y))
  }

  if (goals.size === 0) return []
  if (goals.has(key(start.x, start.y))) return []

  const open: Point[] = [{ ...start }]
  const came = new Map<string, string>()
  const gScore = new Map<string, number>([[key(start.x, start.y), 0]])
  const fScore = new Map<string, number>([[key(start.x, start.y), 0]])

  const heuristic = (p: Point) => {
    let best = Infinity
    for (const g of goals) {
      const [gx, gy] = g.split(',').map(Number)
      best = Math.min(best, Math.abs(p.x - gx) + Math.abs(p.y - gy))
    }
    return best
  }

  while (open.length) {
    open.sort((a, b) => (fScore.get(key(a.x, a.y)) ?? 0) - (fScore.get(key(b.x, b.y)) ?? 0))
    const current = open.shift()!
    const ck = key(current.x, current.y)
    if (goals.has(ck)) {
      const path: Point[] = [current]
      let cur = ck
      while (came.has(cur)) {
        cur = came.get(cur)!
        const [x, y] = cur.split(',').map(Number)
        path.push({ x, y })
      }
      path.reverse()
      path.shift()
      return path
    }

    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = current.x + dx
      const ny = current.y + dy
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue
      if (blocked[ny][nx]) continue
      const nk = key(nx, ny)
      const tentative = (gScore.get(ck) ?? Infinity) + 1
      if (tentative >= (gScore.get(nk) ?? Infinity)) continue
      came.set(nk, ck)
      gScore.set(nk, tentative)
      fScore.set(nk, tentative + heuristic({ x: nx, y: ny }))
      if (!open.some((p) => p.x === nx && p.y === ny)) open.push({ x: nx, y: ny })
    }
  }

  return []
}
