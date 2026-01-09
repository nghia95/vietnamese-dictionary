
import { getRecentActivity, getUserByEmail } from '@/lib/db'; // Direct DB access in RSC
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ActivityLog } from '@/types';

export const dynamic = 'force-dynamic';

export default async function AdminActivityPage() {
    const session = await auth();
    if (!session?.user?.email) {
        redirect('/login');
    }

    const user = await getUserByEmail(session.user.email);
    // Strict Admin check: Role must be 'admin'. Moderators are NOT allowed.
    if (!user || user.role !== 'admin') {
        redirect('/');
    }

    const logs = await getRecentActivity(100);

    return (
        <div style={{ padding: '2rem 0', minHeight: '80vh', backgroundColor: '#f9fafb' }}>
            <div className="container">
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: '#1f2937' }}>Nhật ký hoạt động</h1>

                <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: '#f3f4f6' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'black' }}>Thời gian</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'black' }}>Người thực hiện</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#4b5563' }}>Hành động</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#4b5563' }}>Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody style={{ backgroundColor: 'white' }}>
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                                        Chưa có hoạt động nào
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log: ActivityLog) => {
                                    const badge = getActionBadgeStyle(log.action);
                                    return (
                                        <tr key={log.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                                            <td style={{ padding: '1rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                                                {new Date(log.created_at).toLocaleString('vi-VN')}
                                            </td>
                                            <td style={{ padding: '1rem', fontWeight: '500', color: '#111827' }}>
                                                {log.user_name || `User #${log.user_id}`}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.625rem',
                                                    borderRadius: '9999px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    backgroundColor: badge.bg,
                                                    color: badge.color
                                                }}>
                                                    {translateAction(log.action)}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', color: '#374151' }} title={log.details || ''}>
                                                {translateDetails(log.details)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function getActionBadgeStyle(action: string) {
    if (action.includes('DELETE') || action.includes('BAN')) return { bg: '#fee2e2', color: '#991b1b' };
    if (action.includes('CREATE')) return { bg: '#dcfce7', color: '#166534' };
    if (action.includes('UPDATE')) return { bg: '#dbeafe', color: '#1e40af' };
    if (action.includes('MERGE')) return { bg: '#f3e8ff', color: '#6b21a8' };
    return { bg: '#f3f4f6', color: '#374151' };
}

function translateAction(action: string): string {
    const map: Record<string, string> = {
        'CREATE_WORD': 'Thêm từ',
        'UPDATE_WORD': 'Cập nhật từ',
        'DELETE_WORDS': 'Xóa từ',
        'MERGE_WORDS': 'Gộp từ',
        'UPDATE_USER_ROLE': 'Cập nhật quyền',
        'BAN_USER': 'Cấm người dùng',
        'UNBAN_USER': 'Bỏ cấm',
        'DELETE_USER': 'Xóa người dùng',
        'UPDATE_SOURCE': 'Đổi tên nguồn',
        'UPDATE_SETTING': 'Cập nhật cài đặt',
        'TEST_ACTION': 'Thử nghiệm'
    };
    return map[action] || action;
}

function translateDetails(details: string | null): string {
    if (!details) return '-';

    // Simple replacements
    let translated = details
        .replace('Created word:', 'Đã tạo từ:')
        .replace('Deleted', 'Đã xóa') // Keep for backward compatibility or other phrases
        .replace('Deleted words.', 'Đã xóa các từ.')
        .replace('words.', 'từ.')
        .replace('IDs:', 'ID:')
        .replace('Updated word:', 'Cập nhật từ:')
        .replace('ID:', 'ID:')
        .replace('Changed user', 'Đổi quyền người dùng')
        .replace('role to', 'thành')
        .replace('Banned user', 'Cấm người dùng')
        .replace('until', 'đến')
        .replace('Unbanned user', 'Bỏ cấm người dùng')
        .replace('Deleted user', 'Xóa người dùng')
        .replace('Renamed source', 'Đổi tên nguồn')
        .replace('to', 'thành')
        .replace('Updated setting', 'Cập nhật cài đặt')
        .replace('This is a test log entry', 'Đây là nhật ký thử nghiệm');

    return translated;
}
