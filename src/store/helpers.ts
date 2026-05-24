import type { Board, ProjectId } from '@/types/domain'
import type { BoardState } from './types'

export const emptyBoard: Board = { projects: [], tags: [] }

export function trimOrNull(s: string): string | null {
  const t = s.trim()
  return t.length === 0 ? null : t
}

export function mapProject(
  state: BoardState,
  projectId: ProjectId,
  fn: (p: Board['projects'][number]) => Board['projects'][number],
): BoardState {
  return {
    ...state,
    board: {
      ...state.board,
      projects: state.board.projects.map((p) => (p.id === projectId ? fn(p) : p)),
    },
  }
}
