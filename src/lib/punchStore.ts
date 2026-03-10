/**
 * Shared punch data store - localStorage based
 * Used by DocPage (write/read), SitePage (read)
 */
import { PUNCH_KEY } from "@/constants/storageKeys";

export interface PunchItem {
  id: string;
  location: string;
  issue: string;
  priority: '높음' | '중간' | '낮음';
  status: 'open' | 'ing' | 'done';
  assignee: string;
  dueDate: string;
  date: string;
  beforePhoto: string;
  afterPhoto: string;
}

export interface PunchGroup {
  id: string;
  title: string;        // site name
  contractor: string;
  affiliation: string;
  author: string;
  date: string;
  time: string;
  status: string;       // overall status based on items
  punchItems: PunchItem[];
  files: PunchFile[];
}

export interface PunchFile {
  id: string;
  name: string;
  type: 'img' | 'file';
  url: string;
  size: string;
  ext: string;
  url_before?: string;
  url_after?: string;
  currentView?: string;
}

// ─── Read ───
export function getAllPunchGroups(): PunchGroup[] {
  try {
    const data = JSON.parse(localStorage.getItem(PUNCH_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function getPunchGroupById(id: string): PunchGroup | undefined {
  return getAllPunchGroups().find(g => g.id === id);
}

export function getPunchGroupsBySite(siteName: string): PunchGroup[] {
  return getAllPunchGroups().filter(g => g.title === siteName);
}

export function getPunchStats(): { total: number; open: number; done: number } {
  const items = getAllPunchGroups().flatMap(g => g.punchItems || []);
  return {
    total: items.length,
    open: items.filter(i => i.status !== 'done').length,
    done: items.filter(i => i.status === 'done').length,
  };
}

export function getPunchStatsBySite(siteName: string): { total: number; open: number; done: number } {
  const items = getPunchGroupsBySite(siteName).flatMap(g => g.punchItems || []);
  return {
    total: items.length,
    open: items.filter(i => i.status !== 'done').length,
    done: items.filter(i => i.status === 'done').length,
  };
}

// ─── Write ───
export function savePunchGroups(groups: PunchGroup[]): void {
  localStorage.setItem(PUNCH_KEY, JSON.stringify(groups));
}

export function addPunchGroup(group: PunchGroup): PunchGroup {
  const groups = getAllPunchGroups();
  groups.unshift(group);
  savePunchGroups(groups);
  return group;
}

export function updatePunchGroup(id: string, updates: Partial<PunchGroup>): boolean {
  const groups = getAllPunchGroups();
  const idx = groups.findIndex(g => g.id === id);
  if (idx < 0) return false;
  groups[idx] = { ...groups[idx], ...updates };
  savePunchGroups(groups);
  return true;
}

export function deletePunchGroup(id: string): boolean {
  const groups = getAllPunchGroups();
  const filtered = groups.filter(g => g.id !== id);
  if (filtered.length === groups.length) return false;
  savePunchGroups(filtered);
  return true;
}

// ─── Punch Items ───
export function addPunchItemToGroup(groupId: string, item: PunchItem): boolean {
  const groups = getAllPunchGroups();
  const group = groups.find(g => g.id === groupId);
  if (!group) return false;
  if (!group.punchItems) group.punchItems = [];
  group.punchItems.unshift(item);
  savePunchGroups(groups);
  return true;
}

export function updatePunchItemInGroup(groupId: string, itemId: string, updates: Partial<PunchItem>): boolean {
  const groups = getAllPunchGroups();
  const group = groups.find(g => g.id === groupId);
  if (!group || !group.punchItems) return false;
  const item = group.punchItems.find(i => i.id === itemId);
  if (!item) return false;
  Object.assign(item, updates);
  savePunchGroups(groups);
  return true;
}

export function deletePunchItemFromGroup(groupId: string, itemId: string): boolean {
  const groups = getAllPunchGroups();
  const group = groups.find(g => g.id === groupId);
  if (!group || !group.punchItems) return false;
  group.punchItems = group.punchItems.filter(i => i.id !== itemId);
  savePunchGroups(groups);
  return true;
}

// ─── Initialize mock data ───
export function initPunchData(): void {
  const existing = getAllPunchGroups();
  if (existing.length > 0) return;

  const IMG_CRACK = "https://images.unsplash.com/photo-1581094271901-8022df4466f9?q=80&w=400&auto=format&fit=crop";
  const IMG_WALL = "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=400&auto=format&fit=crop";
  const IMG_CONCRETE = "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&auto=format&fit=crop";

  const mockGroups: PunchGroup[] = [
    {
      id: 'p1', title: '자이 아파트 101동 신축공사', contractor: 'GS건설', affiliation: '협력업체', author: '김감리',
      date: '2025-12-20', time: '14:30', status: 'open',
      files: [{ id: 'p1f1', name: '현장사진', type: 'img', url: IMG_CRACK, size: '2.5MB', ext: 'JPG', url_before: IMG_CRACK, url_after: '', currentView: 'before' }],
      punchItems: [
        { id: 'p1i1', location: 'A동 1층', issue: '콘크리트 균열', priority: '높음', status: 'ing', assignee: '이시공', dueDate: '2025-12-25', date: '2025-12-20', beforePhoto: IMG_CRACK, afterPhoto: '' },
        { id: 'p1i2', location: 'A동 2층', issue: '방수 시공 불량', priority: '중간', status: 'open', assignee: '박시공', dueDate: '2025-12-26', date: '2025-12-20', beforePhoto: '', afterPhoto: '' },
      ],
    },
    {
      id: 'p2', title: '삼성 반도체 P3 배관설치', contractor: '삼성물산', affiliation: '직영', author: '안전팀',
      date: '2025-12-22', time: '09:15', status: 'done',
      files: [{ id: 'p2f1', name: '보수완료', type: 'img', url: IMG_WALL, size: '2.1MB', ext: 'JPG', url_before: IMG_CRACK, url_after: IMG_WALL, currentView: 'after' }],
      punchItems: [
        { id: 'p2i1', location: 'B동 1층 로비', issue: '타일 들뜨 현상', priority: '중간', status: 'done', assignee: '박시공', dueDate: '2025-12-28', date: '2025-12-22', beforePhoto: IMG_CRACK, afterPhoto: IMG_WALL },
      ],
    },
    {
      id: 'p3', title: '현대 오피스텔 리모델링', contractor: 'GS건설', affiliation: '협력업체', author: '최감리',
      date: '2025-12-23', time: '11:00', status: 'open',
      files: [{ id: 'p3f1', name: '현장사진', type: 'img', url: IMG_CONCRETE, size: '3.0MB', ext: 'JPG', url_before: IMG_CONCRETE, url_after: '', currentView: 'before' }],
      punchItems: [
        { id: 'p3i1', location: 'C동 지하 1층', issue: '철근 부식', priority: '높음', status: 'open', assignee: '최시공', dueDate: '2025-12-27', date: '2025-12-23', beforePhoto: IMG_CONCRETE, afterPhoto: '' },
        { id: 'p3i2', location: 'C동 옥상', issue: '누수', priority: '낮음', status: 'ing', assignee: '이시공', dueDate: '2025-12-29', date: '2025-12-23', beforePhoto: '', afterPhoto: '' },
      ],
    },
  ];

  savePunchGroups(mockGroups);
}
