export const navLinks = [
  { path: '/add-member', name: '프로필 추가', admin: false },
  { path: '/add-data', name: '데이터 입력', admin: false },
  { path: '/dashboard', name: '모니터링', admin: false },
  { path: '/growth-prediction', name: '성장 그래프', admin: false },
  { path: '/members', name: '프로필 관리', admin: false },
  { path: '/data-backup', name: '데이터 백업', admin: false },
  { path: '/manage-all-members', name: '전체 프로필 관리', admin: true },
];

export const nonAdminRoutes = navLinks.filter(route => !route.admin); 