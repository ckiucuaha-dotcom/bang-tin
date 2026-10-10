/**
 * Kiểm tra Hậu cần - phần máy chủ (Google Apps Script).
 * Dữ liệu lưu ở Google Sheets (trang "BienBan"), ảnh lưu ở Google Drive.
 * Lần đầu: chạy hàm setup() một lần, sau đó Triển khai > Ứng dụng web.
 */

var SHEET_REPORTS = 'BienBan';
var SHEET_CONFIG = 'CauHinh';
var FOLDER_NAME = 'Ảnh kiểm tra hậu cần';
var HEADERS = [
  'Mã', 'Ngày kiểm tra', 'Giờ', 'Đơn vị', 'Nội dung', 'Thành phần đoàn',
  'Mặt mạnh', 'Mặt yếu, tồn tại', 'Xếp loại', 'Yêu cầu', 'Hạn báo cáo',
  'Số ảnh', 'Cập nhật lúc', 'Dữ liệu (không sửa cột này)'
];
var COL_ID = 1;
var COL_JSON = HEADERS.length;

var DEFAULT_UNITS = ['Đại đội 1', 'Đại đội 2', 'Đại đội 3', 'Trung đội Thông tin', 'Bếp ăn tập thể'];
var DEFAULT_TOPICS = ['Doanh trại', 'Tăng gia sản xuất', 'Quân trang', 'Nhà ăn, quân nhu', 'Quân y, vệ sinh', 'Xăng dầu, xe máy'];

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Kiểm tra Hậu cần')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Chạy MỘT LẦN từ trình soạn thảo Apps Script để tạo trang tính và thư mục ảnh. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var props = PropertiesService.getScriptProperties();
  props.setProperty('SPREADSHEET_ID', ss.getId());

  var sh = ss.getSheetByName(SHEET_REPORTS) || ss.insertSheet(SHEET_REPORTS);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#dfe8d8');
    sh.setFrozenRows(1);
    sh.getRange(1, 1, sh.getMaxRows(), HEADERS.length).setNumberFormat('@').setVerticalAlignment('top');
    sh.getRange(1, 7, sh.getMaxRows(), 2).setWrap(true);
    sh.setColumnWidths(7, 2, 320);
    sh.hideColumns(COL_JSON);
  }

  var cfg = ss.getSheetByName(SHEET_CONFIG) || ss.insertSheet(SHEET_CONFIG);
  if (cfg.getLastRow() === 0) {
    cfg.getRange(1, 1, 1, 2).setValues([['Danh sách đơn vị', 'Nội dung kiểm tra']]).setFontWeight('bold');
    var n = Math.max(DEFAULT_UNITS.length, DEFAULT_TOPICS.length);
    var rows = [];
    for (var i = 0; i < n; i++) rows.push([DEFAULT_UNITS[i] || '', DEFAULT_TOPICS[i] || '']);
    cfg.getRange(2, 1, n, 2).setValues(rows);
    cfg.setColumnWidths(1, 2, 220);
  }

  getFolder_();
  Logger.log('Xong. Sửa danh sách đơn vị/nội dung ở trang "' + SHEET_CONFIG + '", sau đó Triển khai > Ứng dụng web.');
}

function ss_() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Chưa chạy hàm setup(). Mở Apps Script, chọn setup và bấm Chạy.');
  return SpreadsheetApp.openById(id);
}

function reportSheet_() {
  var sh = ss_().getSheetByName(SHEET_REPORTS);
  if (!sh) throw new Error('Không thấy trang "' + SHEET_REPORTS + '". Hãy chạy lại setup().');
  return sh;
}

function getFolder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('FOLDER_ID');
  if (id) {
    try {
      var f = DriveApp.getFolderById(id);
      if (!f.isTrashed()) return f;
    } catch (e) { /* thư mục bị xóa, tạo lại */ }
  }
  var folder = DriveApp.createFolder(FOLDER_NAME);
  props.setProperty('FOLDER_ID', folder.getId());
  return folder;
}

/** Chỉ cho phép đọc/xóa ảnh nằm trong thư mục ảnh của app. */
function ownPhoto_(fileId) {
  var file = DriveApp.getFileById(fileId);
  var folderId = getFolder_().getId();
  var parents = file.getParents();
  while (parents.hasNext()) {
    if (parents.next().getId() === folderId) return file;
  }
  throw new Error('Ảnh không thuộc thư mục của ứng dụng.');
}

function getConfig() {
  var cfg = ss_().getSheetByName(SHEET_CONFIG);
  var units = [], topics = [];
  if (cfg && cfg.getLastRow() > 1) {
    cfg.getRange(2, 1, cfg.getLastRow() - 1, 2).getValues().forEach(function (r) {
      if (String(r[0]).trim()) units.push(String(r[0]).trim());
      if (String(r[1]).trim()) topics.push(String(r[1]).trim());
    });
  }
  return { units: units, topics: topics };
}

function uploadPhoto(base64, mime, name) {
  if (!/^image\//.test(mime)) throw new Error('Chỉ nhận tệp ảnh.');
  var blob = Utilities.newBlob(Utilities.base64Decode(base64), mime, name || ('anh-' + Date.now() + '.jpg'));
  return getFolder_().createFile(blob).getId();
}

function getPhoto(fileId) {
  var blob = ownPhoto_(fileId).getBlob();
  return { mime: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes()) };
}

function listReports() {
  var sh = reportSheet_();
  if (sh.getLastRow() < 2) return [];
  var out = [];
  sh.getRange(2, COL_JSON, sh.getLastRow() - 1, 1).getValues().forEach(function (r) {
    try { if (r[0]) out.push(JSON.parse(r[0])); } catch (e) { /* bỏ qua dòng hỏng */ }
  });
  out.sort(function (a, b) {
    return (b.ngay + (b.gio || '')).localeCompare(a.ngay + (a.gio || '')) || String(b.id).localeCompare(String(a.id));
  });
  return out;
}

function findRow_(sh, id) {
  if (sh.getLastRow() < 2) return -1;
  var ids = sh.getRange(2, COL_ID, sh.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 2;
  return -1;
}

function photoIds_(r) {
  var ids = [];
  (r.yeu || []).forEach(function (y) { (y.photos || []).forEach(function (p) { ids.push(p); }); });
  (r.photos || []).forEach(function (p) { ids.push(p); });
  return ids;
}

function trashPhotos_(ids) {
  ids.forEach(function (id) {
    try { ownPhoto_(id).setTrashed(true); } catch (e) { /* đã xóa hoặc không phải ảnh của app */ }
  });
}

function saveReport(r) {
  if (!r || !String(r.donVi || '').trim()) throw new Error('Chưa nhập đơn vị.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.ngay || '')) throw new Error('Ngày kiểm tra không hợp lệ.');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = reportSheet_();
    var tz = Session.getScriptTimeZone();
    var row = r.id ? findRow_(sh, r.id) : -1;

    if (row > 0) {
      var old = JSON.parse(sh.getRange(row, COL_JSON).getValue() || '{}');
      var keep = photoIds_(r);
      trashPhotos_(photoIds_(old).filter(function (id) { return keep.indexOf(id) < 0; }));
    } else {
      r.id = 'KT' + Utilities.formatDate(new Date(), tz, 'yyMMddHHmmss');
    }
    r.capNhat = Utilities.formatDate(new Date(), tz, 'HH:mm dd/MM/yyyy');

    var values = [
      r.id, vnDate_(r.ngay), r.gio || '', r.donVi, (r.noiDung || []).join('; '), r.thanhPhan || '',
      numbered_((r.manh || []).map(function (m) { return m.text; })),
      numbered_((r.yeu || []).map(function (y) { return y.text + (y.han ? ' (Hạn: ' + vnDate_(y.han) + ')' : ''); })),
      r.xepLoai || '', r.yeuCau || '', vnDate_(r.hanBaoCao), photoIds_(r).length, r.capNhat,
      JSON.stringify(r)
    ].map(safeCell_);

    if (row > 0) sh.getRange(row, 1, 1, values.length).setValues([values]);
    else sh.appendRow(values);
    return r;
  } finally {
    lock.releaseLock();
  }
}

function deleteReport(id) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = reportSheet_();
    var row = findRow_(sh, id);
    if (row < 0) throw new Error('Không tìm thấy biên bản ' + id);
    trashPhotos_(photoIds_(JSON.parse(sh.getRange(row, COL_JSON).getValue() || '{}')));
    sh.deleteRow(row);
    return true;
  } finally {
    lock.releaseLock();
  }
}

function vnDate_(iso) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
}

function numbered_(arr) {
  return arr.filter(function (s) { return s; }).map(function (s, i) { return (i + 1) + '. ' + s; }).join('\n');
}

/** Tránh Google Sheets hiểu nội dung bắt đầu bằng = + - @ là công thức. */
function safeCell_(v) {
  return (typeof v === 'string' && /^[=+\-@]/.test(v)) ? "'" + v : v;
}
