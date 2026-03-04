// Leave Management System - Bureau of Statistics
const LeaveManager = {
    STORAGE_KEY: 'bos_leave_staff',
    LEAVE_RECORDS_KEY: 'bos_leave_records',
    getStaff() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : this.getDefaultStaff();
    },
    saveStaff(staff) { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(staff)); },
    getLeaveRecords() {
        const data = localStorage.getItem(this.LEAVE_RECORDS_KEY);
        return data ? JSON.parse(data) : [];
    },
    saveLeaveRecords(records) { localStorage.setItem(this.LEAVE_RECORDS_KEY, JSON.stringify(records)); },
    getDefaultStaff() {
        return [
            { id: 1, name: 'Andrew Hing', designation: 'Statistician II', leaveEntitlement: 42, contractStart: '2023-06-27', contractEnd: '2026-06-26', leave2023_2024: 0, leave2024_2025: 28.5, leave2025_2026: 0, totalAnnualLeave: 28.5, anniversaryDate: '' },
            { id: 2, name: 'Ryan Shim', designation: 'Statistician', leaveEntitlement: 42, contractStart: '2024-08-14', contractEnd: '2027-08-13', leave2023_2024: 0, leave2024_2025: 22, leave2025_2026: 0, totalAnnualLeave: 22, anniversaryDate: '' },
            { id: 3, name: 'Nicholas Brown', designation: 'Senior Research Assistant', leaveEntitlement: 28, contractStart: '2025-08-23', contractEnd: '2028-08-22', leave2023_2024: 0, leave2024_2025: 26.5, leave2025_2026: 0, totalAnnualLeave: 26.5, anniversaryDate: '' },
            { id: 4, name: 'Japheth Sankar', designation: 'Senior Research Assistant', leaveEntitlement: 28, contractStart: '2023-06-01', contractEnd: '2026-05-31', leave2023_2024: 0, leave2024_2025: 25, leave2025_2026: 0, totalAnnualLeave: 25, anniversaryDate: '' },
            { id: 5, name: 'Rashad Phagu', designation: 'Senior Research Assistant', leaveEntitlement: 28, contractStart: '2025-05-19', contractEnd: '2026-05-18', leave2023_2024: 0, leave2024_2025: 0, leave2025_2026: -1, totalAnnualLeave: -1, anniversaryDate: '' },
            { id: 6, name: 'Jonathan Yong', designation: 'Data Editor', leaveEntitlement: 21, contractStart: '2025-12-01', contractEnd: '2026-11-30', leave2023_2024: 0, leave2024_2025: 0, leave2025_2026: 0, totalAnnualLeave: 0, anniversaryDate: '' }
        ];
    },
    nextId() { const s = this.getStaff(); return s.length > 0 ? Math.max(...s.map(x => x.id)) + 1 : 1; },
    addStaff(d) { const s = this.getStaff(); d.id = this.nextId(); s.push(d); this.saveStaff(s); return d; },
    updateStaff(id, d) {
        const s = this.getStaff(); const i = s.findIndex(x => x.id === id);
        if (i !== -1) { s[i] = { ...s[i], ...d }; this.saveStaff(s); return s[i]; } return null;
    },
    removeStaff(id) {
        this.saveStaff(this.getStaff().filter(x => x.id !== id));
        this.saveLeaveRecords(this.getLeaveRecords().filter(r => r.staffId !== id));
    },
    addLeaveRecord(rec) {
        const recs = this.getLeaveRecords();
        rec.id = recs.length > 0 ? Math.max(...recs.map(r => r.id)) + 1 : 1;
        rec.dateRecorded = new Date().toISOString(); recs.push(rec); this.saveLeaveRecords(recs);
        const s = this.getStaff(); const m = s.find(x => x.id === rec.staffId);
        if (m) { m.totalAnnualLeave = (m.totalAnnualLeave || 0) - rec.daysTaken; this.saveStaff(s); }
        return rec;
    },
    deleteLeaveRecord(rid) {
        const recs = this.getLeaveRecords(); const rec = recs.find(r => r.id === rid);
        if (rec) {
            const s = this.getStaff(); const m = s.find(x => x.id === rec.staffId);
            if (m) { m.totalAnnualLeave = (m.totalAnnualLeave || 0) + rec.daysTaken; this.saveStaff(s); }
            this.saveLeaveRecords(recs.filter(r => r.id !== rid));
        }
    },
    getStaffLeaveRecords(sid) { return this.getLeaveRecords().filter(r => r.staffId === sid); }
};

// UI Helpers
let currentEditStaffId = null;
let currentLeaveStaffId = null;
function leaveEsc(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function leaveFmtDate(ds) {
    if (!ds) return '-'; const d = new Date(ds);
    return d.getDate()+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]+' '+d.getFullYear();
}

// Render Main Table
function renderLeaveTable() {
    const staff = LeaveManager.getStaff(), tbody = document.getElementById('leave-table-body');
    if (!tbody) return;
    if (!staff.length) { tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:20px;color:#7a7a72;">No staff yet. Click Add Staff.</td></tr>'; return; }
    tbody.innerHTML = staff.map(function(s) {
        var recs = LeaveManager.getStaffLeaveRecords(s.id);
        var used = recs.reduce(function(a,r){return a+r.daysTaken;},0), n=leaveEsc(s.name);
        return '<tr><td class="leave-name-cell">'+n+'</td><td>'+leaveEsc(s.designation)+'</td>' +
        '<td class="text-center">'+s.leaveEntitlement+'</td><td>'+leaveFmtDate(s.contractStart)+'</td>' +
        '<td>'+leaveFmtDate(s.contractEnd)+'</td><td class="text-center">'+s.leave2023_2024+'</td>' +
        '<td class="text-center">'+s.leave2024_2025+'</td><td class="text-center">'+s.leave2025_2026+'</td>' +
        '<td class="text-center leave-balance'+(s.totalAnnualLeave<0?' leave-negative':'')+'">'+s.totalAnnualLeave+'</td>' +
        '<td class="text-center">'+used+'</td><td>'+(s.anniversaryDate?leaveFmtDate(s.anniversaryDate):'-')+'</td>' +
        '<td class="leave-actions-cell">' +
        '<button class="btn-icon-sm" title="Record Leave" onclick="openRecordLeaveModal('+s.id+')"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" fill="none"/></svg></button>' +
        '<button class="btn-icon-sm" title="View History" onclick="openLeaveHistoryModal('+s.id+')"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/></svg></button>' +
        '<button class="btn-icon-sm" title="Edit" onclick="openEditStaffModal('+s.id+')"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="2" fill="none"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" fill="none"/></svg></button>' +
        '<button class="btn-icon-sm btn-danger-sm" title="Remove" onclick="confirmRemoveStaff('+s.id+')"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" fill="none"/></svg></button>' +
        '</td></tr>';
    }).join('');
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
function handleStaffSubmit(e) {
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
    if (currentEditStaffId) { LeaveManager.updateStaff(currentEditStaffId, d); showToast('Staff updated'); }
    else { LeaveManager.addStaff(d); showToast('Staff added'); }
    closeStaffModal(); renderLeaveTable();
}
function confirmRemoveStaff(id) {
    var s = LeaveManager.getStaff().find(function(x){return x.id===id;});
    if (s && confirm('Remove '+s.name+'? All leave records will be deleted.')) {
        LeaveManager.removeStaff(id); showToast(s.name+' removed'); renderLeaveTable();
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
function closeRecordLeaveModal() {
    document.getElementById('record-leave-modal').classList.add('hidden');
    document.getElementById('record-leave-form').reset(); currentLeaveStaffId = null;
}
function handleRecordLeaveSubmit(e) {
    e.preventDefault();
    var days = parseFloat(document.getElementById('leave-days-taken').value);
    if (!days || days <= 0) { alert('Enter valid number of days'); return; }
    LeaveManager.addLeaveRecord({
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
function deleteLeaveRec(rid, staffId) {
    if (confirm('Delete this leave record? The days will be added back to the balance.')) {
        LeaveManager.deleteLeaveRecord(rid);
        openLeaveHistoryModal(staffId);
        renderLeaveTable();
        showToast('Leave record deleted');
    }
}

// Print Leave Roster - matches HR format (landscape with months Jan-Dec)
function printLeaveRoster() {
    var year = document.getElementById('roster-year').value || new Date().getFullYear();
    var deptName = document.getElementById('roster-dept-name').value || 'Consumer Price Index';
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

    // Add empty rows for writing in manually (like the paper form)
    for (var e = 0; e < 5; e++) {
        rows += '<tr><td class="roster-name">&nbsp;</td><td class="roster-desig">&nbsp;</td>';
        for (var j = 0; j < 12; j++) rows += '<td class="roster-month-cell">&nbsp;</td>';
        rows += '</tr>';
    }

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
