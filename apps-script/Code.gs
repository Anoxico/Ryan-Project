/************************************************************
 * 巡店记录管理软件 · Apps Script 后端（单文件版）
 * 部署方式：Google 表格 → 扩展程序 → Apps Script → 粘贴本文件
 * 首次使用：运行 init() 授权并初始化表格
 *
 * 修改口令：把下面 SHARED_TOKEN 改成你自己的口令（前端登录要用）
 ************************************************************/

const SHARED_TOKEN = 'CHANGE_ME_2026';
const PHOTO_FOLDER_NAME = 'ShopVisitPhotos';

const SHEET_SCHEMA = {
  Surveys: ['id', 'visit_date', 'channel', 'customer', 'store', 'remark', 'status', 'created_at', 'updated_at', 'deleted_at'],
  Products: ['id', 'survey_id', 'category', 'product_name', 'product_params', 'sample_price',
    'form', 'energy_rating', 'noise_db', 'sets_count', 'extra_points', 'liter', 'air_volume',
    'remark', 'sort_order', 'created_at', 'updated_at'],
  Photos: ['id', 'survey_id', 'product_id', 'drive_file_id', 'url', 'sort_order', 'created_at'],
  Dict: ['id', 'type', 'name', 'category', 'sort_order', 'is_active', 'created_at']
};

// 各产品类别允许保存的专属字段
const CATEGORY_FIELDS = {
  dishwasher: ['form', 'energy_rating', 'noise_db', 'sets_count', 'extra_points'],
  water_heater: ['form', 'energy_rating', 'liter'],
  range_hood: ['form', 'energy_rating', 'air_volume', 'extra_points']
};
const SPECIAL_FIELDS = ['form', 'energy_rating', 'noise_db', 'sets_count', 'extra_points', 'liter', 'air_volume'];

/* ============================================================
 *  入口
 * ============================================================ */

function doPost(e) {
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    return jsonResponse(route(req));
  } catch (err) {
    return jsonResponse({ ok: false, error: String((err && err.message) || err) });
  }
}

function doGet(e) {
  try {
    const param = (e && e.parameter) || {};
    const req = {
      action: param.action,
      token: param.token,
      payload: param.payload ? JSON.parse(param.payload) : {}
    };
    const res = route(req);
    if (param.callback) {
      return ContentService
        .createTextOutput(param.callback + '(' + JSON.stringify(res) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return jsonResponse(res);
  } catch (err) {
    return jsonResponse({ ok: false, error: String((err && err.message) || err) });
  }
}

function route(req) {
  const action = req.action;
  if (action !== 'ping' && req.token !== SHARED_TOKEN) {
    return { ok: false, error: '口令错误' };
  }
  const p = req.payload || {};
  const handlers = {
    ping: function () { return { pong: true, time: new Date().toISOString() }; },
    listSurveys: function () { return listSurveys(p); },
    getSurvey: function () { return getSurvey(p.id); },
    saveSurvey: function () { return saveSurvey(p); },
    deleteSurvey: function () { return deleteSurvey(p.id); },
    deleteSurveys: function () { return deleteSurveys(p.ids); },
    listDeletedSurveys: function () { return listDeletedSurveys(); },
    restoreSurvey: function () { return restoreSurvey(p.id); },
    restoreSurveys: function () { return restoreSurveys(p.ids); },
    purgeSurvey: function () { return purgeSurvey(p.id); },
    emptyRecycleBin: function () { return emptyRecycleBin(); },
    saveProduct: function () { return saveProduct(p); },
    deleteProduct: function () { return deleteProduct(p.id); },
    duplicateProduct: function () { return duplicateProduct(p.id); },
    uploadPhoto: function () { return uploadPhoto(p); },
    deletePhoto: function () { return deletePhoto(p.id); },
    dictList: function () { return dictList(p); },
    dictSave: function () { return dictSave(p); },
    dictDelete: function () { return dictDelete(p.id); },
    stats: function () { return statsAll(); },
    exportData: function () { return exportData(); }
  };
  const fn = handlers[action];
  if (!fn) return { ok: false, error: '未知 action: ' + action };
  try {
    return { ok: true, data: fn() };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ============================================================
 *  初始化
 * ============================================================ */

function init() {
  const ss = getSpreadsheet();
  Object.keys(SHEET_SCHEMA).forEach(function (name) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    const headers = SHEET_SCHEMA[name];
    const existing = sheet.getLastColumn() > 0
      ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      : [];
    if (existing.length === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    } else {
      // 增量补列：为新版本新增的字段补充表头
      headers.forEach(function (h) {
        if (existing.indexOf(h) < 0) {
          const col = sheet.getLastColumn() + 1;
          sheet.getRange(1, col).setValue(h);
          existing.push(h);
        }
      });
    }
  });
  // visit_date / created_at 等列设为纯文本，避免被表格自动转成日期
  const s = ss.getSheetByName('Surveys');
  if (s) { s.getRange('B2:B').setNumberFormat('@'); }
  seedDictDefaults();
  return '初始化完成';
}

function seedDictDefaults() {
  const forms = {
    dishwasher: ['嵌入式', '独立式', '台式', '水槽式'],
    water_heater: ['燃气式', '电热式', '空气能', '太阳能'],
    range_hood: ['顶吸式', '侧吸式', '集成式', '中式']
  };
  Object.keys(forms).forEach(function (cat) {
    forms[cat].forEach(function (name) { upsertDict('form', name, cat); });
  });
  ['一级', '二级', '三级'].forEach(function (n) { upsertDict('energy_rating', n, ''); });
}

/* ============================================================
 *  表格底层读写
 * ============================================================ */

function getSpreadsheet() { return SpreadsheetApp.getActiveSpreadsheet(); }

function getSheet(name) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    const headers = SHEET_SCHEMA[name];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readAll(name) {
  const sheet = getSheet(name);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row[0]) continue;
    const obj = { _row: i + 1 };
    for (let c = 0; c < headers.length; c++) obj[headers[c]] = row[c];
    rows.push(obj);
  }
  return rows;
}

function appendRow(name, obj) {
  const sheet = getSheet(name);
  const headers = SHEET_SCHEMA[name];
  const row = headers.map(function (h) { return obj[h] === undefined ? '' : obj[h]; });
  sheet.appendRow(row);
  return obj;
}

function updateRowById(name, id, patch) {
  const sheet = getSheet(name);
  const rows = readAll(name);
  const target = rows.filter(function (r) { return String(r.id) === String(id); })[0];
  if (!target) throw new Error(name + ' 不存在: ' + id);
  const headers = SHEET_SCHEMA[name];
  const current = {};
  headers.forEach(function (h) { current[h] = target[h]; });
  Object.keys(patch).forEach(function (k) { current[k] = patch[k]; });
  const row = headers.map(function (h) { return current[h] === undefined ? '' : current[h]; });
  sheet.getRange(target._row, 1, 1, headers.length).setValues([row]);
  return current;
}

function deleteRowById(name, id) {
  const sheet = getSheet(name);
  const rows = readAll(name);
  for (let i = rows.length - 1; i >= 0; i--) {
    if (String(rows[i].id) === String(id)) { sheet.deleteRow(rows[i]._row); return true; }
  }
  return false;
}

function stripRow_(o) { if (o) delete o._row; return o; }

function uuid() { return Utilities.getUuid(); }

function nowIso() { return new Date().toISOString(); }

function toDateString(v) {
  if (!v) return '';
  if (v instanceof Date) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(v).slice(0, 10);
}

function toIso(v) {
  if (!v) return '';
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

/* ============================================================
 *  字典
 * ============================================================ */

function dictList(p) {
  let rows = readAll('Dict');
  if (p && p.type) rows = rows.filter(function (r) { return r.type === p.type; });
  if (p && p.category !== undefined) {
    rows = rows.filter(function (r) { return (r.category || '') === (p.category || ''); });
  }
  rows = rows.filter(function (r) { return String(r.is_active) !== 'false'; });
  return rows.sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); })
    .map(stripRow_);
}

function upsertDict(type, name, category) {
  const clean = String(name || '').trim();
  if (!clean) return null;
  const cat = category || '';
  const rows = readAll('Dict');
  const found = rows.filter(function (r) {
    return r.type === type && (r.category || '') === cat
      && String(r.name).toLowerCase() === clean.toLowerCase();
  })[0];
  if (found) return found.id;
  const obj = {
    id: uuid(), type: type, name: clean, category: cat,
    sort_order: rows.length, is_active: true, created_at: nowIso()
  };
  appendRow('Dict', obj);
  return obj.id;
}

function dictSave(p) {
  if (p.id) {
    updateRowById('Dict', p.id, {
      name: p.name, type: p.type, category: p.category || '',
      is_active: p.is_active !== false
    });
    return { id: p.id };
  }
  const id = upsertDict(p.type, p.name, p.category);
  return { id: id };
}

function dictDelete(id) { return { deleted: deleteRowById('Dict', id) }; }

/* ============================================================
 *  巡店单
 * ============================================================ */

function listSurveys(p) {
  p = p || {};
  purgeExpired();
  let surveys = readAll('Surveys').filter(function (s) { return !s.deleted_at; });
  surveys.forEach(function (s) { s.visit_date = toDateString(s.visit_date); });

  if (p.dateFrom) surveys = surveys.filter(function (s) { return s.visit_date >= p.dateFrom; });
  if (p.dateTo) surveys = surveys.filter(function (s) { return s.visit_date <= p.dateTo; });
  if (p.channel) surveys = surveys.filter(function (s) { return (s.channel || '') === p.channel; });
  if (p.customer) surveys = surveys.filter(function (s) { return (s.customer || '') === p.customer; });
  if (p.store) surveys = surveys.filter(function (s) { return (s.store || '') === p.store; });

  const products = readAll('Products');
  const photos = readAll('Photos');

  const needProductFilter = p.category || p.productName || p.energy || p.form;
  if (needProductFilter) {
    const ids = {};
    products.forEach(function (pr) {
      if (matchProduct(pr, p)) ids[pr.survey_id] = true;
    });
    surveys = surveys.filter(function (s) { return ids[s.id]; });
  }

  const countBySurvey = {};
  products.forEach(function (pr) {
    countBySurvey[pr.survey_id] = (countBySurvey[pr.survey_id] || 0) + 1;
  });

  const firstPhotoByProduct = {};
  photos.forEach(function (ph) {
    if (ph.product_id && !firstPhotoByProduct[ph.product_id]) {
      firstPhotoByProduct[ph.product_id] = ph.url;
    }
  });
  const firstPhotoBySurvey = {};
  photos.forEach(function (ph) {
    if (ph.survey_id && !firstPhotoBySurvey[ph.survey_id]) firstPhotoBySurvey[ph.survey_id] = ph.url;
  });
  const productsBySurvey = {};
  products.forEach(function (pr) { (productsBySurvey[pr.survey_id] = productsBySurvey[pr.survey_id] || []).push(pr); });

  surveys.forEach(function (s) {
    s.product_count = countBySurvey[s.id] || 0;
    let thumb = firstPhotoBySurvey[s.id] || '';
    if (!thumb) {
      const list = productsBySurvey[s.id] || [];
      for (let i = 0; i < list.length; i++) {
        const u = firstPhotoByProduct[list[i].id];
        if (u) { thumb = u; break; }
      }
    }
    s.thumbnail = thumb;
  });

  surveys.sort(function (a, b) { return (b.visit_date || '').localeCompare(a.visit_date || ''); });
  surveys.forEach(stripRow_);
  return surveys;
}

function matchProduct(pr, p) {
  if (p.category && pr.category !== p.category) return false;
  if (p.productName && String(pr.product_name || '').toLowerCase().indexOf(String(p.productName).toLowerCase()) < 0) return false;
  if (p.energy && (pr.energy_rating || '') !== p.energy) return false;
  if (p.form && (pr.form || '') !== p.form) return false;
  return true;
}

function getSurvey(id) {
  const surveys = readAll('Surveys');
  const s = surveys.filter(function (r) { return String(r.id) === String(id); })[0];
  if (!s) throw new Error('巡店单不存在');
  s.visit_date = toDateString(s.visit_date);

  const photos = readAll('Photos');
  const products = readAll('Products')
    .filter(function (pr) { return String(pr.survey_id) === String(id); })
    .sort(function (a, b) { return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0); });

  products.forEach(function (pr) {
    pr.photos = photos
      .filter(function (ph) { return String(ph.product_id) === String(pr.id); })
      .sort(function (a, b) { return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0); });
  });
  s.products = products;
  s.survey_photos = photos
    .filter(function (ph) { return String(ph.survey_id) === String(id); })
    .sort(function (a, b) { return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0); });
  s.products.forEach(function (pr) { pr.photos.forEach(stripRow_); stripRow_(pr); });
  s.survey_photos.forEach(stripRow_);
  return stripRow_(s);
}

function saveSurvey(p) {
  validateSurvey(p);
  ['channel', 'customer', 'store'].forEach(function (k) { if (p[k]) upsertDict(k, p[k], ''); });
  const data = {
    visit_date: toDateString(p.visit_date),
    channel: p.channel, customer: p.customer, store: p.store,
    remark: p.remark || '', status: p.status || 'submitted',
    updated_at: nowIso()
  };
  let id = p.id;
  if (id) {
    updateRowById('Surveys', id, data);
  } else {
    id = uuid();
    data.id = id; data.created_at = nowIso();
    appendRow('Surveys', data);
  }
  return { id: id };
}

function validateSurvey(p) {
  if (!p.visit_date) throw new Error('巡店日期必填');
  if (!p.channel) throw new Error('渠道名必填');
  if (!p.customer) throw new Error('客户名必填');
  if (!p.store) throw new Error('店名必填');
}

function deleteSurvey(id) {
  return deleteSurveys([id]);
}

// 软删除：移入回收站（保留 7 天）
function deleteSurveys(ids) {
  const list = (ids || []).filter(Boolean);
  list.forEach(function (id) { updateRowById('Surveys', id, { deleted_at: nowIso() }); });
  return { deleted: list.length };
}

const RETENTION_DAYS = 7;

function daysLeft(deletedAt) {
  const t = new Date(deletedAt).getTime();
  if (isNaN(t)) return 0;
  const ms = RETENTION_DAYS * 24 * 3600 * 1000 - (Date.now() - t);
  return Math.max(0, Math.ceil(ms / (24 * 3600 * 1000)));
}

function listDeletedSurveys() {
  purgeExpired();
  const surveys = readAll('Surveys').filter(function (s) { return !!s.deleted_at; });
  surveys.forEach(function (s) {
    s.visit_date = toDateString(s.visit_date);
    s.deleted_at = toIso(s.deleted_at);
    s.days_left = daysLeft(s.deleted_at);
  });
  surveys.sort(function (a, b) { return String(b.deleted_at).localeCompare(String(a.deleted_at)); });
  return surveys.map(stripRow_);
}

function restoreSurvey(id) {
  return restoreSurveys([id]);
}

function restoreSurveys(ids) {
  const list = (ids || []).filter(Boolean);
  list.forEach(function (id) { updateRowById('Surveys', id, { deleted_at: '' }); });
  return { restored: list.length };
}

// 彻底删除单条（含产品、照片、Drive 文件）
function purgeSurvey(id) {
  hardDeleteSurvey(id);
  return { purged: true };
}

function emptyRecycleBin() {
  const ids = readAll('Surveys').filter(function (s) { return !!s.deleted_at; }).map(function (s) { return s.id; });
  ids.forEach(function (id) { hardDeleteSurvey(id); });
  return { purged: ids.length };
}

// 自动清理超过保留期的回收站记录
function purgeExpired() {
  const now = Date.now();
  readAll('Surveys').forEach(function (s) {
    if (!s.deleted_at) return;
    const t = new Date(toIso(s.deleted_at)).getTime();
    if (!isNaN(t) && now - t > RETENTION_DAYS * 24 * 3600 * 1000) {
      hardDeleteSurvey(s.id);
    }
  });
}

// 真正从表格与网盘移除
function hardDeleteSurvey(id) {
  const products = readAll('Products').filter(function (pr) { return String(pr.survey_id) === String(id); });
  const photos = readAll('Photos');
  products.forEach(function (pr) {
    photos.filter(function (ph) { return String(ph.product_id) === String(pr.id); })
      .forEach(function (ph) { deleteDriveFile_(ph.drive_file_id); deleteRowById('Photos', ph.id); });
    deleteRowById('Products', pr.id);
  });
  photos.filter(function (ph) { return String(ph.survey_id) === String(id); })
    .forEach(function (ph) { deleteDriveFile_(ph.drive_file_id); deleteRowById('Photos', ph.id); });
  deleteRowById('Surveys', id);
}

/* ============================================================
 *  产品记录
 * ============================================================ */

function saveProduct(p) {
  validateProduct(p);
  const category = p.category;
  if (!CATEGORY_FIELDS[category]) throw new Error('产品类别无效');

  if (p.product_name) upsertDict('product_name', p.product_name, category);
  if (p.form) upsertDict('form', p.form, category);
  if (p.energy_rating) upsertDict('energy_rating', p.energy_rating, '');

  const data = cleanProductFields(p, category);
  data.updated_at = nowIso();
  let id = p.id;
  if (id) {
    updateRowById('Products', id, data);
  } else {
    id = uuid();
    data.id = id;
    data.created_at = nowIso();
    if (data.sort_order === '' || data.sort_order === undefined) {
      data.sort_order = nextProductSort(p.survey_id);
    }
    appendRow('Products', data);
  }
  return { id: id };
}

function cleanProductFields(p, category) {
  const allowed = CATEGORY_FIELDS[category];
  const data = {
    survey_id: p.survey_id,
    category: category,
    product_name: p.product_name,
    sample_price: toNumber(p.sample_price),
    remark: p.remark || '',
    product_params: p.product_params || '',
    sort_order: p.sort_order === undefined || p.sort_order === '' ? '' : Number(p.sort_order)
  };
  if (data.sample_price === '' || data.sample_price < 0) throw new Error('终端出样价格无效');
  SPECIAL_FIELDS.forEach(function (f) {
    if (allowed.indexOf(f) >= 0) {
      const v = p[f];
      if (['noise_db', 'sets_count', 'liter', 'air_volume'].indexOf(f) >= 0) {
        data[f] = (v === '' || v === null || v === undefined) ? '' : toNumber(v);
        if (data[f] !== '' && data[f] < 0) throw new Error(f + ' 不能为负数');
      } else {
        data[f] = v || '';
      }
    } else {
      data[f] = ''; // 非本类别字段一律清空
    }
  });
  return data;
}

function toNumber(v) {
  if (v === '' || v === null || v === undefined) return '';
  const n = Number(v);
  if (isNaN(n)) throw new Error('不是有效数字: ' + v);
  return n;
}

function nextProductSort(surveyId) {
  const list = readAll('Products').filter(function (pr) { return String(pr.survey_id) === String(surveyId); });
  let max = -1;
  list.forEach(function (pr) { max = Math.max(max, Number(pr.sort_order) || 0); });
  return max + 1;
}

function validateProduct(p) {
  if (!p.survey_id) throw new Error('缺少巡店单');
  if (!p.category) throw new Error('产品类别必填');
  if (!p.product_name) throw new Error('产品名必填');
  if (p.sample_price === '' || p.sample_price === null || p.sample_price === undefined) throw new Error('终端出样价格必填');
}

function deleteProduct(id) {
  readAll('Photos').filter(function (ph) { return String(ph.product_id) === String(id); })
    .forEach(function (ph) { deleteDriveFile_(ph.drive_file_id); deleteRowById('Photos', ph.id); });
  deleteRowById('Products', id);
  return { deleted: true };
}

function duplicateProduct(id) {
  const rows = readAll('Products');
  const src = rows.filter(function (r) { return String(r.id) === String(id); })[0];
  if (!src) throw new Error('产品记录不存在');
  const copy = {};
  SHEET_SCHEMA.Products.forEach(function (h) { if (h !== '_row') copy[h] = src[h]; });
  copy.id = uuid();
  copy.sort_order = nextProductSort(src.survey_id);
  copy.created_at = nowIso();
  copy.updated_at = nowIso();
  appendRow('Products', copy);
  readAll('Photos').filter(function (ph) { return String(ph.product_id) === String(id); })
    .forEach(function (ph) {
      appendRow('Photos', {
        id: uuid(), survey_id: '', product_id: copy.id,
        drive_file_id: ph.drive_file_id, url: ph.url,
        sort_order: ph.sort_order, created_at: nowIso()
      });
    });
  return { id: copy.id };
}

/* ============================================================
 *  照片（Google Drive）
 * ============================================================ */

function getPhotoFolder() {
  const it = DriveApp.getFoldersByName(PHOTO_FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(PHOTO_FOLDER_NAME);
}

function uploadPhoto(p) {
  if (!p.dataBase64) throw new Error('缺少图片数据');
  if (!p.surveyId && !p.productId) throw new Error('照片必须关联巡店单或产品');
  const bytes = Utilities.base64Decode(p.dataBase64);
  const blob = Utilities.newBlob(bytes, p.mimeType || 'image/jpeg', p.name || ('photo-' + Date.now() + '.jpg'));
  const file = getPhotoFolder().createFile(blob);
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) { /* 组织策略可能禁止公开分享，忽略 */ }
  const url = 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1200';
  const obj = {
    id: uuid(),
    survey_id: p.productId ? '' : (p.surveyId || ''),
    product_id: p.productId || '',
    drive_file_id: file.getId(),
    url: url,
    sort_order: p.sortOrder === undefined ? 0 : Number(p.sortOrder),
    created_at: nowIso()
  };
  appendRow('Photos', obj);
  return obj;
}

function deletePhoto(id) {
  const ph = readAll('Photos').filter(function (r) { return String(r.id) === String(id); })[0];
  if (ph) deleteDriveFile_(ph.drive_file_id);
  deleteRowById('Photos', id);
  return { deleted: true };
}

function deleteDriveFile_(fileId) {
  if (!fileId) return;
  try { DriveApp.getFileById(fileId).setTrashed(true); } catch (e) { /* 文件可能已删 */ }
}

/* ============================================================
 *  统计
 * ============================================================ */

function statsAll() {
  purgeExpired();
  const surveys = readAll('Surveys').filter(function (s) { return !s.deleted_at; });
  const validIds = {};
  surveys.forEach(function (s) { validIds[s.id] = true; });
  const products = readAll('Products').filter(function (pr) { return validIds[pr.survey_id]; });
  return {
    byChannel: countByField(surveys, 'channel'),
    byCustomer: countByField(surveys, 'customer'),
    byStore: countByField(surveys, 'store'),
    byCategory: countProductByCategory(products),
    energyRatio: energyRatio(products),
    totals: { surveys: surveys.length, products: products.length }
  };
}

function countByField(rows, field) {
  const map = {};
  rows.forEach(function (r) {
    const k = r[field] || '(未填)';
    map[k] = (map[k] || 0) + 1;
  });
  return Object.keys(map).map(function (k) { return { name: k, count: map[k] }; })
    .sort(function (a, b) { return b.count - a.count; });
}

function countProductByCategory(products) {
  const map = {};
  products.forEach(function (pr) { map[pr.category] = (map[pr.category] || 0) + 1; });
  return Object.keys(map).map(function (k) { return { category: k, count: map[k] }; })
    .sort(function (a, b) { return b.count - a.count; });
}

function energyRatio(products) {
  const byCat = {};
  products.forEach(function (pr) {
    byCat[pr.category] = byCat[pr.category] || {};
    const e = pr.energy_rating || '未填写';
    byCat[pr.category][e] = (byCat[pr.category][e] || 0) + 1;
  });
  const out = [];
  Object.keys(byCat).forEach(function (cat) {
    const total = Object.keys(byCat[cat]).reduce(function (s, k) { return s + byCat[cat][k]; }, 0);
    Object.keys(byCat[cat]).forEach(function (e) {
      out.push({
        category: cat, energy_rating: e, count: byCat[cat][e],
        ratio: total ? Math.round(byCat[cat][e] / total * 10000) / 10000 : 0
      });
    });
  });
  return out;
}

/* ============================================================
 *  导出
 * ============================================================ */

function exportData() {
  purgeExpired();
  const surveys = readAll('Surveys').filter(function (s) { return !s.deleted_at; });
  surveys.forEach(function (s) { s.visit_date = toDateString(s.visit_date); });
  const validIds = {};
  surveys.forEach(function (s) { validIds[s.id] = true; });
  const products = readAll('Products').filter(function (pr) { return validIds[pr.survey_id]; });
  const photos = readAll('Photos').filter(function (ph) {
    return (ph.survey_id && validIds[ph.survey_id]) ||
      (ph.product_id && products.some(function (pr) { return pr.id === ph.product_id; }));
  });
  const dict = readAll('Dict');
  return {
    surveys: surveys.map(stripRow_),
    products: products.map(stripRow_),
    photos: photos.map(stripRow_),
    dict: dict.map(stripRow_)
  };
}
