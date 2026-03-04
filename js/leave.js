// Leave Management System - Bureau of Statistics
// Data stored in D1 database via Worker API (shared across all users)
const LeaveManager = {
    _staff: [],
    _records: [],
    _loaded: false,

    _apiHeaders() {
        const h = { 'Content-Type': 'application/json' };
        const token = api ? api.getToken() : localStorage.getItem('session_token');
        if (token) h['Authorization'] = 'Bearer ' + token;
        return h;
    },
    _apiBase() {
        return (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) ? CONFIG.API_BASE_URL : '/api';
    },

    async loadData() {
        try {
            const base = this._apiBase();
            const headers = this._apiHeaders();
            const [staffRes, recordsRes] = await Promise.all([
                fetch(base + '/leave/staff', { headers }),
                fetch(base + '/leave/records', { headers })
            ]);
            if (staffRes.ok) {
                const d = await staffRes.json();
                this._staff = (d.staff || []).map(this._mapStaffFromAPI);
            }
            if (recordsRes.ok) {
                const d = await recordsRes.json();
                this._records = (d.records || []).map(this._mapRecordFromAPI);
            }
            this._loaded = true;
        } catch (e) {
            console.error('Failed to load leave data from API:', e);
        }
    },

    // Map D1 snake_case to frontend camelCase
    _mapStaffFromAPI(s) {
        return {
            id: s.id, name: s.name, designation: s.designation,
            leaveEntitlement: s.leave_entitlement, contractStart: s.contract_start,
            contractEnd: s.contract_end, leave2023_2024: s.leave_2023_2024,
            leave2024_2025: s.leave_2024_2025, leave2025_2026: s.leave_2025_2026,
            totalAnnualLeave: s.total_annual_leave, anniversaryDate: s.anniversary_date || '',
            sortOrder: s.sort_order
        };
    },
    _mapRecordFromAPI(r) {
        return {
            id: r.id, staffId: r.staff_id, daysTaken: r.days_taken,
            startDate: r.start_date, endDate: r.end_date,
            leaveType: r.leave_type, notes: r.notes,
            dateRecorded: r.date_recorded
        };
    },
    _staffToAPI(d) {
        return {
            name: d.name, designation: d.designation, leave_entitlement: d.leaveEntitlement,
            contract_start: d.contractStart, contract_end: d.contractEnd,
            leave_2023_2024: d.leave2023_2024, leave_2024_2025: d.leave2024_2025,
            leave_2025_2026: d.leave2025_2026, total_annual_leave: d.totalAnnualLeave,
            anniversary_date: d.anniversaryDate || null
        };
    },

    getStaff() { return this._staff; },
    getLeaveRecords() { return this._records; },
    getStaffLeaveRecords(sid) { return this._records.filter(function(r) { return r.staffId === sid; }); },

    async addStaff(d) {
        try {
            const res = await fetch(this._apiBase() + '/leave/staff', {
                method: 'POST', headers: this._apiHeaders(), body: JSON.stringify(this._staffToAPI(d))
            });
            const data = await res.json();
            if (data.staff) this._staff.push(this._mapStaffFromAPI(data.staff));
        } catch (e) { console.error('Failed to add staff:', e); }
    },
    async updateStaff(id, d) {
        try {
            const res = await fetch(this._apiBase() + '/leave/staff/' + id, {
                method: 'PUT', headers: this._apiHeaders(), body: JSON.stringify(this._staffToAPI(d))
            });
            const data = await res.json();
            if (data.staff) {
                const mapped = this._mapStaffFromAPI(data.staff);
                const i = this._staff.findIndex(function(x) { return x.id === id; });
                if (i !== -1) this._staff[i] = mapped;
            }
        } catch (e) { console.error('Failed to update staff:', e); }
    },
    async removeStaff(id) {
        try {
            await fetch(this._apiBase() + '/leave/staff/' + id, {
                method: 'DELETE', headers: this._apiHeaders()
            });
            this._staff = this._staff.filter(function(x) { return x.id !== id; });
            this._records = this._records.filter(function(r) { return r.staffId !== id; });
        } catch (e) { console.error('Failed to remove staff:', e); }
    },
    async addLeaveRecord(rec) {
        try {
            const res = await fetch(this._apiBase() + '/leave/records', {
                method: 'POST', headers: this._apiHeaders(),
                body: JSON.stringify({
                    staff_id: rec.staffId, days_taken: rec.daysTaken,
                    start_date: rec.startDate, end_date: rec.endDate,
                    leave_type: rec.leaveType, notes: rec.notes
                })
            });
            const data = await res.json();
            if (data.record) this._records.push(this._mapRecordFromAPI(data.record));
            if (data.newBalance !== undefined) {
                var m = this._staff.find(function(x) { return x.id === rec.staffId; });
                if (m) m.totalAnnualLeave = data.newBalance;
            }
        } catch (e) { console.error('Failed to add leave record:', e); }
    },
    async deleteLeaveRecord(rid) {
        try {
            var rec = this._records.find(function(r) { return r.id === rid; });
            await fetch(this._apiBase() + '/leave/records/' + rid, {
                method: 'DELETE', headers: this._apiHeaders()
            });
            if (rec) {
                var m = this._staff.find(function(x) { return x.id === rec.staffId; });
                if (m) m.totalAnnualLeave = (m.totalAnnualLeave || 0) + rec.daysTaken;
            }
            this._records = this._records.filter(function(r) { return r.id !== rid; });
        } catch (e) { console.error('Failed to delete leave record:', e); }
    },
    async saveStaffOrder() {
        try {
            var order = this._staff.map(function(s) { return s.id; });
            await fetch(this._apiBase() + '/leave/staff/reorder', {
                method: 'PUT', headers: this._apiHeaders(),
                body: JSON.stringify({ order: order })
            });
        } catch (e) { console.error('Failed to save order:', e); }
    }
};

// UI Helpers
let currentEditStaffId = null;
let currentLeaveStaffId = null;
function leaveEsc(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function leaveFmtDate(ds) {
    if (!ds) return '-'; const d = new Date(ds);
    return d.getDate()+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]+' '+d.getFullYear();
}

// Drag-and-drop state
let leaveDragSrcIndex = null;

// Render Main Table
function renderLeaveTable() {
    const staff = LeaveManager.getStaff(), tbody = document.getElementById('leave-table-body');
    if (!tbody) return;
    if (!staff.length) { tbody.innerHTML = '<tr><td colspan="13" style="text-align:center;padding:20px;color:#7a7a72;">No staff yet. Click Add Staff.</td></tr>'; return; }
    tbody.innerHTML = staff.map(function(s, idx) {
        var recs = LeaveManager.getStaffLeaveRecords(s.id);
        var used = recs.reduce(function(a,r){return a+r.daysTaken;},0), n=leaveEsc(s.name);
        var remaining = s.totalAnnualLeave || 0;
        var remainingClass = 'leave-remaining' + (remaining <= 0 ? ' leave-remaining-red' : '');
        return '<tr draggable="true" data-staff-index="'+idx+'">' +
        '<td class="leave-drag-handle" title="Drag to reorder"><svg viewBox="0 0 24 24" width="14" height="14"><circle cx="9" cy="6" r="1.5" fill="currentColor"/><circle cx="15" cy="6" r="1.5" fill="currentColor"/><circle cx="9" cy="12" r="1.5" fill="currentColor"/><circle cx="15" cy="12" r="1.5" fill="currentColor"/><circle cx="9" cy="18" r="1.5" fill="currentColor"/><circle cx="15" cy="18" r="1.5" fill="currentColor"/></svg></td>' +
        '<td class="leave-name-cell">'+n+'</td><td>'+leaveEsc(s.designation)+'</td>' +
        '<td class="text-center">'+s.leaveEntitlement+'</td><td>'+leaveFmtDate(s.contractStart)+'</td>' +
        '<td>'+leaveFmtDate(s.contractEnd)+'</td><td class="text-center">'+s.leave2023_2024+'</td>' +
        '<td class="text-center">'+s.leave2024_2025+'</td><td class="text-center">'+s.leave2025_2026+'</td>' +
        '<td class="text-center">'+used+'</td>' +
        '<td class="text-center '+remainingClass+'">'+remaining+'</td>' +
        '<td>'+(s.anniversaryDate?leaveFmtDate(s.anniversaryDate):'-')+'</td>' +
        '<td class="leave-actions-cell">' +
        '<button class="btn-icon-sm" title="Record Leave" onclick="openRecordLeaveModal('+s.id+')"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" fill="none"/></svg></button>' +
        '<button class="btn-icon-sm" title="View History" onclick="openLeaveHistoryModal('+s.id+')"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/></svg></button>' +
        '<button class="btn-icon-sm" title="Edit" onclick="openEditStaffModal('+s.id+')"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="2" fill="none"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" fill="none"/></svg></button>' +
        '<button class="btn-icon-sm btn-danger-sm" title="Remove" onclick="confirmRemoveStaff('+s.id+')"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" fill="none"/></svg></button>' +
        '</td></tr>';
    }).join('');
    initLeaveDragAndDrop();
}

// Drag-and-drop reordering
function initLeaveDragAndDrop() {
    var tbody = document.getElementById('leave-table-body');
    if (!tbody) return;
    var rows = tbody.querySelectorAll('tr[draggable="true"]');
    rows.forEach(function(row) {
        row.addEventListener('dragstart', function(e) {
            leaveDragSrcIndex = parseInt(this.getAttribute('data-staff-index'));
            this.classList.add('leave-row-dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', leaveDragSrcIndex);
        });
        row.addEventListener('dragend', function() {
            this.classList.remove('leave-row-dragging');
            tbody.querySelectorAll('tr').forEach(function(r) { r.classList.remove('leave-row-dragover'); });
        });
        row.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            this.classList.add('leave-row-dragover');
        });
        row.addEventListener('dragleave', function() {
            this.classList.remove('leave-row-dragover');
        });
        row.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('leave-row-dragover');
            var targetIndex = parseInt(this.getAttribute('data-staff-index'));
            if (leaveDragSrcIndex === null || leaveDragSrcIndex === targetIndex) return;
            var staff = LeaveManager.getStaff();
            var moved = staff.splice(leaveDragSrcIndex, 1)[0];
            staff.splice(targetIndex, 0, moved);
            LeaveManager._staff = staff;
            LeaveManager.saveStaffOrder();
            leaveDragSrcIndex = null;
            renderLeaveTable();
        });
    });
}

// Staff Modal Functions
function openAddStaffModal() {
    currentEditStaffId = null;
    document.getElementById('staff-modal-title').textContent = 'Add New Staff Member';
    document.getElementById('staff-form').reset();
    document.getElementById('staff-modal').classList.remove('hidden');
}
function openEditStaffModal(id) {
    var s = LeaveManager.getStaff().find(function(x){return x.id===id;});
    if (!s) return; currentEditStaffId = id;
    document.getElementById('staff-modal-title').textContent = 'Edit Staff Member';
    document.getElementById('staff-name').value = s.name;
    document.getElementById('staff-designation').value = s.designation;
    document.getElementById('staff-leave-entitlement').value = s.leaveEntitlement;
    document.getElementById('staff-contract-start').value = s.contractStart || '';
    document.getElementById('staff-contract-end').value = s.contractEnd || '';
    document.getElementById('staff-leave-2023-2024').value = s.leave2023_2024;
    document.getElementById('staff-leave-2024-2025').value = s.leave2024_2025;
    document.getElementById('staff-leave-2025-2026').value = s.leave2025_2026;
    document.getElementById('staff-total-annual-leave').value = s.totalAnnualLeave;
    document.getElementById('staff-anniversary-date').value = s.anniversaryDate || '';
    document.getElementById('staff-modal').classList.remove('hidden');
}
function closeStaffModal() {
    document.getElementById('staff-modal').classList.add('hidden');
    document.getElementById('staff-form').reset(); currentEditStaffId = null;
}
async function handleStaffSubmit(e) {
    e.preventDefault();
    var d = {
        name: document.getElementById('staff-name').value.trim(),
        designation: document.getElementById('staff-designation').value.trim(),
        leaveEntitlement: parseFloat(document.getElementById('staff-leave-entitlement').value)||0,
        contractStart: document.getElementById('staff-contract-start').value,
        contractEnd: document.getElementById('staff-contract-end').value,
        leave2023_2024: parseFloat(document.getElementById('staff-leave-2023-2024').value)||0,
        leave2024_2025: parseFloat(document.getElementById('staff-leave-2024-2025').value)||0,
        leave2025_2026: parseFloat(document.getElementById('staff-leave-2025-2026').value)||0,
        totalAnnualLeave: parseFloat(document.getElementById('staff-total-annual-leave').value)||0,
        anniversaryDate: document.getElementById('staff-anniversary-date').value || ''
    };
    if (currentEditStaffId) { await LeaveManager.updateStaff(currentEditStaffId, d); showToast('Staff updated'); }
    else { await LeaveManager.addStaff(d); showToast('Staff added'); }
    closeStaffModal(); renderLeaveTable();
}
async function confirmRemoveStaff(id) {
    var s = LeaveManager.getStaff().find(function(x){return x.id===id;});
    if (s && confirm('Remove '+s.name+'? All leave records will be deleted.')) {
        await LeaveManager.removeStaff(id); showToast(s.name+' removed'); renderLeaveTable();
    }
}

// Record Leave Modal
function openRecordLeaveModal(staffId) {
    currentLeaveStaffId = staffId;
    var s = LeaveManager.getStaff().find(function(x){return x.id===staffId;});
    if (!s) return;
    document.getElementById('record-leave-staff-name').textContent = s.name;
    document.getElementById('record-leave-balance').textContent = 'Current Balance: ' + s.totalAnnualLeave + ' days';
    document.getElementById('record-leave-form').reset();
    document.getElementById('record-leave-modal').classList.remove('hidden');
}
function calcLeaveDays() {
    var start = document.getElementById('leave-start-date').value;
    var end = document.getElementById('leave-end-date').value;
    var daysInput = document.getElementById('leave-days-taken');
    if (start && end) {
        var s = new Date(start + 'T00:00:00'), e = new Date(end + 'T00:00:00');
        var diff = Math.round((e - s) / 86400000) + 1; // inclusive of both days
        daysInput.value = diff > 0 ? diff : '';
    } else {
        daysInput.value = '';
    }
}
document.getElementById('leave-start-date').addEventListener('change', calcLeaveDays);
document.getElementById('leave-end-date').addEventListener('change', calcLeaveDays);

function closeRecordLeaveModal() {
    document.getElementById('record-leave-modal').classList.add('hidden');
    document.getElementById('record-leave-form').reset(); currentLeaveStaffId = null;
}
async function handleRecordLeaveSubmit(e) {
    e.preventDefault();
    var days = parseFloat(document.getElementById('leave-days-taken').value);
    if (!days || days <= 0) { alert('Enter valid number of days'); return; }
    await LeaveManager.addLeaveRecord({
        staffId: currentLeaveStaffId, daysTaken: days,
        startDate: document.getElementById('leave-start-date').value,
        endDate: document.getElementById('leave-end-date').value,
        leaveType: document.getElementById('leave-type').value,
        notes: document.getElementById('leave-notes').value.trim()
    });
    showToast(days + ' day(s) of leave recorded');
    closeRecordLeaveModal(); renderLeaveTable();
}

// Leave History Modal
function openLeaveHistoryModal(staffId) {
    var s = LeaveManager.getStaff().find(function(x){return x.id===staffId;});
    if (!s) return;
    document.getElementById('leave-history-staff-name').textContent = s.name + ' - Leave History';
    var recs = LeaveManager.getStaffLeaveRecords(staffId);
    var tbody = document.getElementById('leave-history-body');
    if (!recs.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:15px;color:#7a7a72;">No leave records found.</td></tr>';
    } else {
        tbody.innerHTML = recs.map(function(r) {
            return '<tr><td>'+leaveFmtDate(r.startDate)+'</td><td>'+leaveFmtDate(r.endDate)+'</td>' +
            '<td class="text-center">'+r.daysTaken+'</td><td>'+leaveEsc(r.leaveType)+'</td>' +
            '<td>'+leaveEsc(r.notes||'-')+'</td>' +
            '<td><button class="btn-icon-sm btn-danger-sm" title="Delete" onclick="deleteLeaveRec('+r.id+','+staffId+')"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" fill="none"/></svg></button></td></tr>';
        }).join('');
    }
    document.getElementById('leave-history-modal').classList.remove('hidden');
}
function closeLeaveHistoryModal() { document.getElementById('leave-history-modal').classList.add('hidden'); }
async function deleteLeaveRec(rid, staffId) {
    if (confirm('Delete this leave record? The days will be added back to the balance.')) {
        await LeaveManager.deleteLeaveRecord(rid);
        openLeaveHistoryModal(staffId);
        renderLeaveTable();
        showToast('Leave record deleted');
    }
}

// Print Leave Roster - matches HR format (landscape with months Jan-Dec)
function printLeaveRoster() {
    var year = document.getElementById('roster-year').value || new Date().getFullYear();
    var deptName = document.getElementById('roster-dept-name').value || 'Procurement Unit';
    var staff = LeaveManager.getStaff();
    var months = ['JAN.','FEB.','MAR.','APR.','MAY','JUN.','JUL.','AUG.','SEPT.','OCT.','NOV.','DEC.'];
    var monthsFull = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    // Build leave data by month for each staff member
    var staffLeaveByMonth = {};
    staff.forEach(function(s) {
        staffLeaveByMonth[s.id] = {};
        months.forEach(function(m,i) { staffLeaveByMonth[s.id][i] = []; });
        var recs = LeaveManager.getStaffLeaveRecords(s.id);
        recs.forEach(function(r) {
            if (!r.startDate) return;
            var sd = new Date(r.startDate);
            var ed = r.endDate ? new Date(r.endDate) : sd;
            if (sd.getFullYear() == year || ed.getFullYear() == year) {
                var monthIdx = sd.getMonth();
                var startDay = sd.getDate();
                var endDay = ed.getMonth() === monthIdx ? ed.getDate() : '';
                var label = startDay + (endDay && endDay !== startDay ? '-' + endDay : '') + ' ' + monthsFull[monthIdx].substring(0,3);
                staffLeaveByMonth[s.id][monthIdx].push(label);
            }
        });
    });

    // Generate rows - multiple lines per cell for leave entries
    var rows = staff.map(function(s) {
        var cells = '<td class="roster-name">' + leaveEsc(s.name) + '</td>' +
                    '<td class="roster-desig">' + leaveEsc(s.designation) + '</td>';
        for (var i = 0; i < 12; i++) {
            var entries = staffLeaveByMonth[s.id][i];
            cells += '<td class="roster-month-cell">' + (entries.length ? entries.join('<br>') : '') + '</td>';
        }
        return '<tr>' + cells + '</tr>';
    }).join('');



    var monthHeaders = months.map(function(m) { return '<th class="roster-month-header">' + m + '</th>'; }).join('');

    var html = '<!DOCTYPE html><html><head><title>Leave Roster ' + year + '</title>' +
    '<style>' +
    '@page { size: landscape; margin: 1cm; }' +
    'body { font-family: Arial, sans-serif; margin: 0; padding: 10px; }' +
    '.roster-title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; }' +
    '.roster-dept { text-align: center; font-size: 13px; margin-bottom: 15px; }' +
    '.roster-dept span { border-bottom: 1px dotted #000; padding: 0 20px; }' +
    'table { width: 100%; border-collapse: collapse; font-size: 11px; }' +
    'th, td { border: 1px solid #000; padding: 4px 6px; }' +
    'th { background: #f0f0f0; font-weight: bold; text-align: center; }' +
    '.roster-name { min-width: 120px; font-weight: bold; }' +
    '.roster-desig { min-width: 130px; }' +
    '.roster-month-cell { min-width: 60px; text-align: center; height: 50px; vertical-align: top; font-size: 10px; }' +
    '.roster-month-header { min-width: 60px; }' +
    '.roster-footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; }' +
    '.roster-footer div { border-top: 1px dotted #000; padding-top: 5px; min-width: 200px; text-align: center; }' +
    '@media print { body { -webkit-print-color-adjust: exact; } }' +
    '</style></head><body>' +
    '<div class="roster-title">LEAVE ROSTER ' + year + ' - DEPARTMENT/UNIT</div>' +
    '<div class="roster-dept"><span>' + leaveEsc(deptName) + '</span></div>' +
    '<table><thead><tr><th>NAME</th><th>DESIGNATION</th>' + monthHeaders + '</tr></thead>' +
    '<tbody>' + rows + '</tbody></table>' +
    '<div class="roster-footer">' +
    '<div>Head of Department/Unit</div>' +
    '<div>Date</div>' +
    '</div>' +
    '</body></html>';

    var printWin = window.open('', '_blank');
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(function() { printWin.print(); }, 500);
}

// Make functions globally accessible
window.renderLeaveTable = renderLeaveTable;
window.openAddStaffModal = openAddStaffModal;
window.openEditStaffModal = openEditStaffModal;
window.closeStaffModal = closeStaffModal;
window.handleStaffSubmit = handleStaffSubmit;
window.confirmRemoveStaff = confirmRemoveStaff;
window.openRecordLeaveModal = openRecordLeaveModal;
window.closeRecordLeaveModal = closeRecordLeaveModal;
window.handleRecordLeaveSubmit = handleRecordLeaveSubmit;
window.openLeaveHistoryModal = openLeaveHistoryModal;
window.closeLeaveHistoryModal = closeLeaveHistoryModal;
window.deleteLeaveRec = deleteLeaveRec;
window.printLeaveRoster = printLeaveRoster;
