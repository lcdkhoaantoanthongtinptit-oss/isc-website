import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

/**
 * Cloud Function: checkCollaboratorResult
 * Secure endpoint to query candidate result by Student ID (MSSV)
 * Exposes ONLY safe public data.
 */
export const checkCollaboratorResult = functions
  .region('asia-southeast1')
  .https.onCall(async (data, context) => {
    // 1. Input Validation
    const rawStudentId = data?.studentId;
    if (!rawStudentId || typeof rawStudentId !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Mã sinh viên không hợp lệ hoặc bị thiếu.'
      );
    }

    // 2. Normalize MSSV
    const studentId = rawStudentId.trim().toUpperCase();
    if (studentId.length < 5 || studentId.length > 20) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Định dạng Mã sinh viên không đúng.'
      );
    }

    try {
      // 3. Query Firestore doc
      const docRef = db.collection('collaborators').doc(studentId);
      const snapshot = await docRef.get();

      if (!snapshot.exists) {
        return { found: false };
      }

      const collabData = snapshot.data();
      if (!collabData) {
        return { found: false };
      }

      // 4. Resolve department name
      let acceptedDepartmentName: string | null = null;
      if (collabData.acceptedDepartmentId) {
        const deptDoc = await db.collection('departments').doc(collabData.acceptedDepartmentId).get();
        if (deptDoc.exists) {
          acceptedDepartmentName = deptDoc.data()?.name || collabData.acceptedDepartmentId;
        }
      }

      let appliedDepartmentName: string | null = null;
      if (collabData.appliedDepartmentId) {
        const appliedDeptDoc = await db.collection('departments').doc(collabData.appliedDepartmentId).get();
        if (appliedDeptDoc.exists) {
          appliedDepartmentName = appliedDeptDoc.data()?.name || collabData.appliedDepartmentId;
        }
      }

      // 5. Return ONLY minimal, safe public fields
      // Strictly OMIT: phone, email, adminNote, internal timestamps
      return {
        found: true,
        studentId: collabData.studentId || studentId,
        fullName: collabData.fullName || '',
        appliedDepartment: appliedDepartmentName,
        acceptedDepartment: acceptedDepartmentName,
        position: collabData.position || 'Cộng tác viên',
        status: collabData.status || 'PENDING',
        note: collabData.publicNote || '',
      };
    } catch (error) {
      console.error('Error in checkCollaboratorResult Cloud Function:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Có lỗi xảy ra khi truy vấn dữ liệu ứng viên.'
      );
    }
  });

/**
 * Cloud Function: setAdminRole
 * Grants custom claim { role: 'admin' } to a target user UID.
 * Callable only by existing Admins or initialized during setup.
 */
export const setAdminRole = functions
  .region('asia-southeast1')
  .https.onCall(async (data, context) => {
    // Only allow existing admin to grant role (or bootstrap via CLI/admin tool)
    if (!context.auth?.token?.role || context.auth.token.role !== 'admin') {
      // If no admin exists yet in database, allow first-time setup or check
      const usersSnap = await db.collection('users').where('role', '==', 'admin').get();
      if (!usersSnap.empty) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Chỉ Quản trị viên cấp cao mới có quyền gán role admin.'
        );
      }
    }

    const { email, uid } = data;
    let targetUid = uid;

    if (!targetUid && email) {
      const user = await admin.auth().getUserByEmail(email);
      targetUid = user.uid;
    }

    if (!targetUid) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Vui lòng cung cấp email hoặc UID của người dùng.'
      );
    }

    // Set Custom User Claims
    await admin.auth().setCustomUserClaims(targetUid, { role: 'admin' });

    // Sync to Firestore 'users' collection
    await db.collection('users').doc(targetUid).set(
      {
        role: 'admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      success: true,
      message: `Đã cấp quyền Admin thành công cho UID: ${targetUid}`,
    };
  });
