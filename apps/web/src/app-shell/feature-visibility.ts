export function progressVisibleOnBranch(branch: string) {
  return branch === 'main' || branch.startsWith('hotfix/');
}

export const showProgressPage = process.env.NEXT_PUBLIC_PROGRESS_PAGE_VISIBLE !== 'false';
