import * as XLSX from 'xlsx';
import { Collaborator, Department, ExcelCollaboratorRow, ExcelValidationError } from '../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STATUSES = ['PENDING', 'PASSED', 'FAILED'];

/**
 * Chuẩn hóa số điện thoại: Luôn giữ hoặc khôi phục số 0 đầu tiên.
 * Xử lý các trường hợp Excel nuốt số 0 (987654321 -> 0987654321),
 * đầu số quốc tế (+84 / 84 -> 0), khoảng trắng, dấu chấm, dấu gạch ngang.
 */
export function normalizePhoneNumber(raw: any): string {
  if (raw === undefined || raw === null) return '';
  let str = String(raw).trim();
  if (!str) return '';

  // Bỏ dấu nháy đơn nếu người dùng gõ '098... trong Excel
  if (str.startsWith("'")) {
    str = str.slice(1).trim();
  }

  // Xử lý dạng khoa học (e.g. 9.87654e+08)
  if (/^\d+(\.\d+)?[eE]\+\d+$/.test(str)) {
    const num = Number(str);
    if (!isNaN(num)) {
      str = BigInt(Math.round(num)).toString();
    }
  }

  // Loại bỏ khoảng trắng, dấu chấm, dấu gạch ngang, ngoặc đơn
  let cleaned = str.replace(/[\s.\-()]/g, '');

  // Xử lý tiền tố quốc tế +84 hoặc 84 (ví dụ +84981234567 -> 0981234567)
  if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('84') && (cleaned.length === 11 || cleaned.length === 12)) {
    cleaned = '0' + cleaned.slice(2);
  }

  // Nếu là số điện thoại 9 chữ số thiếu số 0 ở đầu (do Excel format thành number)
  if (/^\d{9}$/.test(cleaned) && !cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  } else if (/^\d{8}$/.test(cleaned) && !cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }

  return cleaned;
}

// Helper for extracting value by exact matching, trimmed matching, or normalized alphanumeric matching
function extractRowValue(
  row: Record<string, any>,
  exactKeys: string[],
  normalizedAliases: string[]
): string {
  // 1. Direct exact key lookup
  for (const k of exactKeys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
      return String(row[k]).trim();
    }
  }

  // 2. Case-insensitive / trimmed direct key lookup
  const rowEntries = Object.entries(row);
  for (const [rk, val] of rowEntries) {
    if (val === undefined || val === null || String(val).trim() === '') continue;
    const trimmedK = rk.trim().toLowerCase();
    if (exactKeys.some((k) => k.trim().toLowerCase() === trimmedK)) {
      return String(val).trim();
    }
  }

  // 3. Normalized key lookup (removes accents, punctuation, spaces)
  for (const [rk, val] of rowEntries) {
    if (val === undefined || val === null || String(val).trim() === '') continue;
    const normK = rk
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    if (normalizedAliases.includes(normK)) {
      return String(val).trim();
    }
  }

  return '';
}

export const excelService = {
  // Parse uploaded .xlsx file to row objects with full support for Google Form columns
  async parseExcelFile(file: File): Promise<ExcelCollaboratorRow[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          // Use raw: false to read formatted strings and preserve leading zeros when formatted
          const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '', raw: false });

          const mappedRows: ExcelCollaboratorRow[] = jsonData.map((row) => {
            // 1. Dấu thời gian
            const timestamp = extractRowValue(
              row,
              ['Dấu thời gian', 'Thời gian', 'Timestamp', 'time'],
              ['dauthoigian', 'timestamp', 'thoigian']
            );

            // 2. Họ và Tên
            const full_name = extractRowValue(
              row,
              ['Họ và Tên', 'Họ và tên', 'Họ tên', 'full_name', 'Họ Tên'],
              ['hovatten', 'hoten', 'fullname']
            );

            // 3. Mã sinh viên
            const student_id = extractRowValue(
              row,
              ['Mã sinh viên', 'Mã sinh viên (MSSV)', 'MSSV', 'student_id', 'Mã SV'],
              ['masinhvien', 'masinhvienmssv', 'mssv', 'studentid', 'masv']
            );

            // 4. Lớp
            const class_name = extractRowValue(
              row,
              ['Lớp', 'Lớp sinh hoạt', 'class_name', 'Class'],
              ['lop', 'lopsinhhoat', 'classname', 'class']
            );

            // 5. Số điện thoại (Bảo toàn số 0 đầu)
            const rawPhone = extractRowValue(
              row,
              ['Số điện thoại', 'SĐT', 'SDT', 'phone', 'Điện thoại', 'Số ĐT', 'Mobile'],
              ['sodienthoai', 'sdt', 'phone', 'dienthoai', 'sodt', 'mobile']
            );
            const phone = normalizePhoneNumber(rawPhone);

            // 6. Link Facebook
            const facebook_url = extractRowValue(
              row,
              ['Link Facebook', 'Facebook', 'Link FB', 'facebook_url', 'FB'],
              ['linkfacebook', 'facebook', 'linkfb', 'facebookurl', 'fb']
            );

            // 7. Email
            const email = extractRowValue(
              row,
              ['Email', 'Địa chỉ email', 'email'],
              ['email', 'diachiemai']
            );

            // 8. Điểm mạnh của bản thân
            const strengths = extractRowValue(
              row,
              ['Điểm mạnh của bản thân', 'Điểm mạnh', 'strengths'],
              ['diemmanhcuabanthan', 'diemmanh', 'strengths']
            );

            // 9. Hạn chế của bản thân
            const weaknesses = extractRowValue(
              row,
              ['Hạn chế của bản thân', 'Hạn chế', 'Điểm yếu', 'weaknesses'],
              ['hanchecuabanthan', 'hanche', 'diemyeu', 'weaknesses']
            );

            // 10. Sở trường/ sở thích/ năng khiếu
            const interests = extractRowValue(
              row,
              [
                'Sở trường/ sở thích/ năng khiếu',
                'Sở trường/sở thích/năng khiếu',
                'Sở trường / sở thích / năng khiếu',
                'Sở trường',
                'Sở thích',
                'Năng khiếu',
                'interests',
              ],
              ['sotruongsothichnangkhieu', 'sotruong', 'sothich', 'nangkhieu', 'interests']
            );

            // 11. Kiến thức, kinh nghiệm và trải nghiệm của bạn về Lập trình, tin học
            const it_experience = extractRowValue(
              row,
              [
                'Kiến thức, kinh nghiệm và trải nghiệm của bạn về Lập trình, tin học',
                'Kinh nghiệm lập trình, tin học',
                'Kinh nghiệm lập trình',
                'it_experience',
              ],
              [
                'kienthuckinhnghiemvatrainghiemcuabanvelaptrinhtinhoc',
                'kinhnghiemlaptrinhtinhoc',
                'kinhnghiemlaptrinh',
                'itexperience',
              ]
            );

            // 12. Bạn biết LCĐ ATTT qua đâu?
            const referral_source = extractRowValue(
              row,
              [
                'Bạn biết LCĐ ATTT qua đâu?',
                'Bạn biết LCĐ ATTT qua đâu',
                'Biết qua đâu',
                'referral_source',
              ],
              ['banbietlcdatttquadau', 'bietquadau', 'referralsource']
            );

            // 13. Bạn mong đợi học hỏi hay nhận được điều gì nhất từ LCĐ ATTT?
            const expectations = extractRowValue(
              row,
              [
                'Bạn mong đợi học hỏi hay nhận được điều gì nhất từ LCĐ ATTT?',
                'Bạn mong đợi học hỏi hay nhận được điều gì nhất từ LCĐ ATTT',
                'Mong đợi từ LCĐ ATTT',
                'expectations',
              ],
              [
                'banmongdoihocdayhaynhanduocdieuginhattulcdattt',
                'banmongdoihocdoihaynhanduocdieuginhattulcdattt',
                'mongdoi',
                'expectations',
              ]
            );

            // 14. Tại sao bạn lại muốn tham gia LCĐ ATTT?
            const reasons_to_join = extractRowValue(
              row,
              [
                'Tại sao bạn lại muốn tham gia LCĐ ATTT?',
                'Tại sao bạn lại muốn tham gia LCĐ ATTT',
                'Lý do tham gia LCĐ ATTT',
                'reasons_to_join',
              ],
              [
                'taisaobanlaimoonthamgialcdattt',
                'taisaobanlaimuonthamgialcdattt',
                'lydothamgia',
                'reasonstojoin',
              ]
            );

            // Optional / Legacy columns
            const applied_department = extractRowValue(
              row,
              ['Ban đăng ký', 'Ban ứng tuyển', 'applied_department'],
              ['bandangky', 'banungtuyen', 'applieddepartment']
            );

            const accepted_department = extractRowValue(
              row,
              ['Ban trúng tuyển', 'accepted_department'],
              ['bantrungtuyen', 'accepteddepartment']
            );

            const position =
              extractRowValue(row, ['Vị trí', 'position'], ['vitri', 'position']) || 'Cộng tác viên';

            const status =
              extractRowValue(row, ['Trạng thái', 'status'], ['trangthai', 'status']).toUpperCase() ||
              'PENDING';

            const note = extractRowValue(
              row,
              ['Ghi chú', 'Ghi chú ứng viên', 'public_note', 'note'],
              ['ghichu', 'ghichuungvien', 'publicnote', 'note']
            );

            const admin_note = extractRowValue(
              row,
              ['Ghi chú admin', 'Ghi chú nội bộ', 'admin_note'],
              ['ghichuadmin', 'ghichunoibo', 'adminnote']
            );

            return {
              timestamp,
              full_name,
              student_id,
              class_name,
              phone,
              facebook_url,
              email,
              strengths,
              weaknesses,
              interests,
              it_experience,
              referral_source,
              expectations,
              reasons_to_join,
              applied_department,
              accepted_department,
              position,
              status,
              note,
              admin_note,
            };
          });

          resolve(mappedRows);
        } catch (err) {
          reject(new Error('Không thể đọc tệp Excel. Vui lòng kiểm tra định dạng file (.xlsx).'));
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  },

  // Validate parsed rows against business rules & existing database
  // Validate parsed rows against business rules & existing database (Hỗ trợ import cả trùng lặp và gắn tag)
  validateRows(
    rows: ExcelCollaboratorRow[],
    departments: Department[],
    existingStudentIds: string[]
  ): {
    validRecords: Omit<Collaborator, 'id'>[];
    errors: ExcelValidationError[];
    duplicateCount: number;
  } {
    const errors: ExcelValidationError[] = [];
    const validRecords: Omit<Collaborator, 'id'>[] = [];
    const seenStudentIdsInFile = new Set<string>();
    let duplicateCount = 0;

    // Đếm số lần xuất hiện của từng MSSV trong file để nhận diện trùng lặp nội bộ file
    const idCountsInFile = new Map<string, number>();
    rows.forEach((r) => {
      if (r.student_id) {
        const sid = r.student_id.trim().toUpperCase();
        idCountsInFile.set(sid, (idCountsInFile.get(sid) || 0) + 1);
      }
    });

    const existingIdSet = new Set(existingStudentIds.map((id) => id.trim().toUpperCase()));

    const deptMapByNameOrSlug = new Map<string, string>();
    departments.forEach((d) => {
      deptMapByNameOrSlug.set(d.id.toLowerCase(), d.id);
      deptMapByNameOrSlug.set(d.name.toLowerCase(), d.id);
      deptMapByNameOrSlug.set(d.slug.toLowerCase(), d.id);
    });

    rows.forEach((row, index) => {
      const rowNum = index + 2; // +2 for 1-based index and header row

      // 1. Check required student_id
      if (!row.student_id) {
        errors.push({
          rowNumber: rowNum,
          field: 'student_id',
          message: `Dòng ${rowNum}: Thiếu mã sinh viên`,
        });
        return;
      }

      const normalizedMSSV = row.student_id.trim().toUpperCase();

      // 2. Nhận diện và gắn tag trùng lặp (KHÔNG chặn/loại bỏ, import đầy đủ cả bản ghi trùng)
      const occursMultipleTimesInFile = (idCountsInFile.get(normalizedMSSV) || 0) > 1;
      const alreadyInSystem = existingIdSet.has(normalizedMSSV);
      const isRepeatInFile = seenStudentIdsInFile.has(normalizedMSSV);
      seenStudentIdsInFile.add(normalizedMSSV);

      const isDuplicate = occursMultipleTimesInFile || alreadyInSystem;
      let duplicateTag = '';
      if (occursMultipleTimesInFile && alreadyInSystem) {
        duplicateTag = isRepeatInFile ? 'Trùng file & Hệ thống' : 'Đã có trên hệ thống';
      } else if (occursMultipleTimesInFile) {
        duplicateTag = isRepeatInFile ? 'Trùng lặp trong file' : 'Có bản ghi trùng';
      } else if (alreadyInSystem) {
        duplicateTag = 'Đã có trên hệ thống';
      }

      if (isDuplicate) {
        duplicateCount++;
      }

      // 3. Check required full_name
      if (!row.full_name) {
        errors.push({
          rowNumber: rowNum,
          studentId: normalizedMSSV,
          field: 'full_name',
          message: `Dòng ${rowNum}: Thiếu họ và tên`,
        });
        return;
      }

      // 4. Check email
      if (!row.email) {
        errors.push({
          rowNumber: rowNum,
          studentId: normalizedMSSV,
          field: 'email',
          message: `Dòng ${rowNum}: Thiếu email ứng viên`,
        });
        return;
      }
      if (!EMAIL_REGEX.test(row.email)) {
        errors.push({
          rowNumber: rowNum,
          studentId: normalizedMSSV,
          field: 'email',
          message: `Dòng ${rowNum}: Email "${row.email}" không đúng định dạng`,
        });
        return;
      }

      // 5. Check status (default to PENDING)
      const normalizedStatus = row.status || 'PENDING';
      if (!VALID_STATUSES.includes(normalizedStatus)) {
        errors.push({
          rowNumber: rowNum,
          studentId: normalizedMSSV,
          field: 'status',
          message: `Dòng ${rowNum}: Trạng thái "${row.status}" không hợp lệ (Phải là PENDING, PASSED hoặc FAILED)`,
        });
        return;
      }

      // 6. Optional applied department
      let appliedDeptId = '';
      if (row.applied_department) {
        const found = deptMapByNameOrSlug.get(row.applied_department.toLowerCase());
        if (found) {
          appliedDeptId = found;
        }
      }

      // 7. Optional accepted department
      let acceptedDeptId: string | null = null;
      if (row.accepted_department) {
        const foundAccepted = deptMapByNameOrSlug.get(row.accepted_department.toLowerCase());
        if (foundAccepted) {
          acceptedDeptId = foundAccepted;
        }
      } else if (normalizedStatus === 'PASSED' && appliedDeptId) {
        acceptedDeptId = appliedDeptId;
      }

      // 8. Chuẩn hóa số điện thoại đảm bảo không mất số 0
      const cleanPhone = normalizePhoneNumber(row.phone || '');

      // 9. Ghi chú nội bộ Admin (chỉ lấy nếu có cột trong file, tuyệt đối không tự động điền các câu hỏi form vào)
      const adminNote = row.admin_note || '';

      // Valid record ready for batch create (kèm cờ trùng lặp)
      validRecords.push({
        studentId: normalizedMSSV,
        fullName: row.full_name,
        email: row.email,
        phone: cleanPhone,
        className: row.class_name || '',
        facebookUrl: row.facebook_url || '',
        appliedDepartmentId: appliedDeptId,
        acceptedDepartmentId: acceptedDeptId,
        position: row.position || 'Cộng tác viên',
        status: normalizedStatus as any,
        publicNote: row.note || '',
        adminNote: adminNote,
        isDuplicate,
        duplicateTag: duplicateTag || (isDuplicate ? 'Trùng lặp' : undefined),
        submittedAt: row.timestamp || '',
        strengths: row.strengths || '',
        weaknesses: row.weaknesses || '',
        interests: row.interests || '',
        itExperience: row.it_experience || '',
        referralSource: row.referral_source || '',
        expectations: row.expectations || '',
        reasonsToJoin: row.reasons_to_join || '',
      });
    });

    return { validRecords, errors, duplicateCount };
  },

  // Export current list to Excel (.xlsx) with all fields
  exportToExcel(collaborators: Collaborator[], departments: Department[], fileName = 'Danh_sach_CTV.xlsx') {
    const deptMap = new Map(departments.map((d) => [d.id, d.name]));

    const data = collaborators.map((c, idx) => ({
      STT: idx + 1,
      'Dấu thời gian': c.submittedAt || '',
      'Họ và Tên': c.fullName,
      'Mã sinh viên': c.studentId,
      Lớp: c.className,
      'Số điện thoại': normalizePhoneNumber(c.phone),
      'Tag trùng lặp': c.isDuplicate ? (c.duplicateTag || 'Trùng lặp') : '',
      'Link Facebook': c.facebookUrl || '',
      Email: c.email,
      'Điểm mạnh của bản thân': c.strengths || '',
      'Hạn chế của bản thân': c.weaknesses || '',
      'Sở trường/ sở thích/ năng khiếu': c.interests || '',
      'Kiến thức, kinh nghiệm và trải nghiệm của bạn về Lập trình, tin học': c.itExperience || '',
      'Bạn biết LCĐ ATTT qua đâu?': c.referralSource || '',
      'Bạn mong đợi học hỏi hay nhận được điều gì nhất từ LCĐ ATTT?': c.expectations || '',
      'Tại sao bạn lại muốn tham gia LCĐ ATTT?': c.reasonsToJoin || '',
      'Vị trí': c.position,
      'Trạng thái':
        c.status === 'PASSED'
          ? 'Trúng tuyển'
          : c.status === 'FAILED'
          ? 'Không trúng tuyển'
          : 'Đang chờ',
      'Ghi chú ứng viên': c.publicNote || '',
      'Ghi chú nội bộ Admin': c.adminNote || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto fit column widths
    const colWidths = [
      { wch: 6 }, // STT
      { wch: 20 }, // Dấu thời gian
      { wch: 24 }, // Họ và Tên
      { wch: 15 }, // MSSV
      { wch: 15 }, // Lớp
      { wch: 15 }, // SĐT
      { wch: 20 }, // Tag trùng lặp
      { wch: 28 }, // Facebook
      { wch: 28 }, // Email
      { wch: 30 }, // Điểm mạnh
      { wch: 30 }, // Hạn chế
      { wch: 30 }, // Sở trường
      { wch: 35 }, // Kinh nghiệm CNTT
      { wch: 25 }, // Biết qua đâu
      { wch: 35 }, // Mong đợi
      { wch: 35 }, // Lý do
      { wch: 18 }, // Vị trí
      { wch: 16 }, // Trạng thái
      { wch: 30 }, // Ghi chú
      { wch: 30 }, // Ghi chú admin
    ];
    worksheet['!cols'] = colWidths;

    // Đảm bảo cột SĐT (Cột F) luôn ở định dạng chuỗi (Text) để Excel không nuốt số 0 khi người dùng mở
    Object.keys(worksheet).forEach((cellKey) => {
      if (cellKey.startsWith('F') && cellKey !== 'F1') {
        const cell = worksheet[cellKey];
        if (cell && cell.v !== undefined) {
          cell.t = 's';
          cell.v = String(cell.v);
          cell.z = '@';
        }
      }
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách CTV');
    XLSX.writeFile(workbook, fileName);
  },

  // Generate and download a starter Excel template matching Google Form headers exactly
  downloadTemplate(_departments?: Department[]) {
    const sampleRows = [
      {
        'Dấu thời gian': '14/09/2026 09:30:15',
        'Họ và Tên': 'Nguyễn Văn Mẫu',
        'Mã sinh viên': 'B23DCAT099',
        Lớp: 'D23CQAT01-B',
        'Số điện thoại': '0988776655',
        'Link Facebook': 'https://facebook.com/nguyenvanmau',
        Email: 'mau.nv.b23at@gmail.com',
        'Điểm mạnh của bản thân': 'Chăm chỉ, ham học hỏi, kỹ năng làm việc nhóm tốt',
        'Hạn chế của bản thân': 'Đôi khi còn ngại nói trước đám đông',
        'Sở trường/ sở thích/ năng khiếu': 'Đá bóng, chơi cờ vua, nghiên cứu bảo mật mạng',
        'Kiến thức, kinh nghiệm và trải nghiệm của bạn về Lập trình, tin học': 'Biết lập trình Python, C/C++, tham gia giải CTF cấp trường',
        'Bạn biết LCĐ ATTT qua đâu?': 'Fanpage LCĐ Khoa An toàn thông tin',
        'Bạn mong đợi học hỏi hay nhận được điều gì nhất từ LCĐ ATTT?': 'Kỹ năng tổ chức sự kiện, mở rộng networking và nâng cao kiến thức ATTT',
        'Tại sao bạn lại muốn tham gia LCĐ ATTT?': 'Muốn cống hiến cho các phong trào của Khoa và phát triển bản thân',
      },
      {
        'Dấu thời gian': '14/09/2026 10:15:42',
        'Họ và Tên': 'Trần Thị Thảo',
        'Mã sinh viên': 'B23DCAT100',
        Lớp: 'D23CQAT02-B',
        'Số điện thoại': '0911223344',
        'Link Facebook': 'https://facebook.com/tranthithao',
        Email: 'thao.tt.b23at@gmail.com',
        'Điểm mạnh của bản thân': 'Sáng tạo, thiết kế Canva/Photoshop, viết lách',
        'Hạn chế của bản thân': 'Chưa quản lý thời gian thật sự tối ưu',
        'Sở trường/ sở thích/ năng khiếu': 'Chụp ảnh, quay dựng video ngắn, viết content',
        'Kiến thức, kinh nghiệm và trải nghiệm của bạn về Lập trình, tin học': 'Tin học văn phòng thành thạo, đang tự học web cơ bản HTML/CSS',
        'Bạn biết LCĐ ATTT qua đâu?': 'Được anh chị khóa trên giới thiệu',
        'Bạn mong đợi học hỏi hay nhận được điều gì nhất từ LCĐ ATTT?': 'Có thêm nhiều bạn bè và môi trường năng động để rèn luyện',
        'Tại sao bạn lại muốn tham gia LCĐ ATTT?': 'Mong muốn đóng góp cho công tác truyền thông của Liên chi',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    worksheet['!cols'] = [
      { wch: 20 },
      { wch: 22 },
      { wch: 15 },
      { wch: 15 },
      { wch: 14 },
      { wch: 28 },
      { wch: 26 },
      { wch: 30 },
      { wch: 30 },
      { wch: 30 },
      { wch: 35 },
      { wch: 25 },
      { wch: 35 },
      { wch: 35 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Google_Form');
    XLSX.writeFile(workbook, 'Template_Don_Ung_Tuyen_CTV.xlsx');
  },
};
