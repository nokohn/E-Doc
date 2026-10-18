import { User, UserRole } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-dept-head',
    username: 'panyasith',
    fullName: 'ທ່ານ ປັນຍາສິດ ວົງສຸລີ',
    role: 'DEPARTMENT_HEAD',
    departmentId: 'dept-eng',
    departmentName: 'ພະແນກ ວິສະວະກຳ ແລະ ພັດທະນາ',
    positionLao: 'ຫົວໜ້າພະແນກ (Department Head)',
    email: 'panyasith.v@state-enterprise.gov.la',
    phone: '020 5554 1111',
    active: true,
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-deputy-dept-head-eng',
    username: 'nhumai',
    fullName: 'ທ່ານ ໜຸໄໝ ສຸວັນນະພຸມ',
    role: 'DEPUTY_DEPARTMENT_HEAD',
    departmentId: 'dept-eng',
    departmentName: 'ພະແນກ ວິສະວະກຳ ແລະ ພັດທະນາ',
    positionLao: 'ຮອງຫົວໜ້າພະແນກ ຜູ້ຊີ້ນຳໜ່ວຍງານວິສະວະກຳ',
    email: 'nhumai.s@state-enterprise.gov.la',
    phone: '020 5555 2222',
    active: true,
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-deputy-dept-head-rnd',
    username: 'sonepasith',
    fullName: 'ທ່ານ ສອນປະສິດ',
    role: 'DEPUTY_DEPARTMENT_HEAD',
    departmentId: 'dept-eng',
    departmentName: 'ພະແນກ ວິສະວະກຳ ແລະ ພັດທະນາ',
    positionLao: 'ຮອງຫົວໜ້າພະແນກ ຜູ້ຊີ້ນຳໜ່ວຍງານ R&D ແລະ ປະສານງານ',
    email: 'sonepasith@state-enterprise.gov.la',
    phone: '020 5555 3333',
    active: true,
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-unit-eng',
    username: 'viengkham',
    fullName: 'ທ່ານ ວຽງຄຳມະໂນຈິດ',
    role: 'UNIT_HEAD',
    departmentId: 'unit-eng',
    departmentName: 'ໜ່ວຍງານ ວິສະວະກຳ',
    positionLao: 'ຫົວໜ້າໜ່ວຍງານວິສະວະກຳ (Engineering Unit Head)',
    email: 'viengkham.m@state-enterprise.gov.la',
    phone: '020 5556 4444',
    active: true,
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-unit-coord',
    username: 'khamkeo',
    fullName: 'ທ່ານ ຄຳແກ້ວ ພິມວົງສາ',
    role: 'UNIT_HEAD',
    departmentId: 'unit-coord',
    departmentName: 'ໜ່ວຍງານ ປະສານງານ',
    positionLao: 'ຫົວໜ້າໜ່ວຍງານປະສານງານ (Coordination Unit Head)',
    email: 'khamkeo.p@state-enterprise.gov.la',
    phone: '020 5556 5555',
    active: true,
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-unit-rnd',
    username: 'manolop',
    fullName: 'ທ່ານ ມະໂນລົບ',
    role: 'UNIT_HEAD',
    departmentId: 'unit-rnd',
    departmentName: 'ໜ່ວຍງານ R&D',
    positionLao: 'ຫົວໜ້າໜ່ວຍງານ R&D (R&D Unit Head)',
    email: 'manolop@state-enterprise.gov.la',
    phone: '020 5556 6666',
    active: true,
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-dir',
    username: 'director',
    fullName: 'ທ່ານ ບຸນມີ ວົງວິຈິດ',
    role: 'DIRECTOR',
    departmentId: 'dept-exec',
    departmentName: 'ຄະນະຜູ້ອຳນວຍການ',
    positionLao: 'ຜູ້ອຳນວຍການໃຫຍ່ (Managing Director)',
    email: 'bounmy.v@state-enterprise.gov.la',
    phone: '020 5552 3456',
    active: true,
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-staff',
    username: 'staff',
    fullName: 'ທ່ານ ນາງ ມຸກດາ ແສງອາລຸນ',
    role: 'STAFF',
    departmentId: 'dept-eng',
    departmentName: 'ພະແນກ ວິສະວະກຳ ແລະ ພັດທະນາ',
    positionLao: 'ວິຊາການສາລະບັນຂາເຂົ້າ-ຂາອອກ (Staff)',
    email: 'moukda.s@state-enterprise.gov.la',
    phone: '020 5557 8901',
    active: true,
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-admin',
    username: 'nokohn@mail.com',
    fullName: 'ທ່ານ ສົມສັກ ແກ້ວມະນີ (nokohn@mail.com)',
    role: 'ADMIN',
    departmentId: 'dept-it',
    departmentName: 'ພະແນກ ເຕັກໂນໂລຊີຂໍ້ມູນຂ່າວສານ (IT)',
    positionLao: 'ຜູ້ຄຸ້ມຄອງລະບົບ (System Administrator)',
    email: 'nokohn@mail.com',
    phone: '020 5551 2345',
    active: true,
    createdAt: '2026-01-01T08:00:00Z',
  },
];

const STORAGE_KEY_CURRENT_USER = 'edoc_current_user_nokohn_v2';

export class AuthService {
  private static currentUser: User | null = null;

  static getPrimaryAccount(): User {
    return INITIAL_USERS.find(u => u.email === 'nokohn@mail.com') || INITIAL_USERS[INITIAL_USERS.length - 1];
  }

  static getCurrentUser(): User {
    if (!this.currentUser) {
      const primary = this.getPrimaryAccount();
      const stored = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (!parsed.fullName) {
            this.currentUser = primary;
            localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(this.currentUser));
          } else {
            this.currentUser = parsed;
          }
        } catch {
          this.currentUser = primary;
        }
      } else {
        this.currentUser = primary;
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(this.currentUser));
      }
    }
    return this.currentUser!;
  }

  static setCurrentUser(user: User): void {
    this.currentUser = user;
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
  }

  static switchUserByRole(role: UserRole): User {
    const user = INITIAL_USERS.find(u => u.role === role) || INITIAL_USERS[0];
    this.setCurrentUser(user);
    return user;
  }

  static switchUserById(id: string): User {
    const user = INITIAL_USERS.find(u => u.id === id) || INITIAL_USERS[0];
    this.setCurrentUser(user);
    return user;
  }

  static login(username: string, password: string): { success: boolean; user?: User; message?: string } {
    const cleanInput = username.trim().toLowerCase();
    // Primary Account nokohn@mail.com / nokohn@gmail.com / admin
    if (
      cleanInput === 'nokohn@mail.com' ||
      cleanInput === 'nokohn@gmail.com' ||
      cleanInput === 'nokohn' ||
      (cleanInput === 'admin' && password === 'admin123456')
    ) {
      const admin = INITIAL_USERS.find(u => u.role === 'ADMIN') || INITIAL_USERS[0];
      this.setCurrentUser(admin);
      return { success: true, user: admin };
    }

    const matched = INITIAL_USERS.find(
      u => u.username.toLowerCase() === cleanInput || u.email.toLowerCase() === cleanInput
    );
    if (matched) {
      this.setCurrentUser(matched);
      return { success: true, user: matched };
    }

    return { success: false, message: 'ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ' };
  }

  static logout(): void {
    this.currentUser = null;
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
  }

  static getAllUsers(): User[] {
    return INITIAL_USERS;
  }
}
