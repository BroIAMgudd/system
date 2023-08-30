async function getFilesList(conn, ip, path) {
  return conn.query(
    'SELECT id, filename, ext, size, modification, version FROM filesystem WHERE ip = ? AND path = ?',
    [ip, path]
  );
}

async function getFile(conn, searchType, fileInfo, targetIP = null, path = null, ext = null) {
  let sql = 'SELECT * FROM filesystem WHERE';
  sql += (searchType === 'id') ? ' id = ?' : ' filename = ?';
  sql += (targetIP) ? ' AND ip = ?' : '';
  sql += (path) ? ' AND path = ?' : '';
  sql += (ext) ? ' AND ext = ?' : '';

  let values = [fileInfo];
  if (targetIP) values.push(targetIP);
  if (path) values.push(path);
  if (ext) values.push(ext);

  const [rows] = await conn.query(sql, values);
  return (rows.length > 0) ? rows : null;
}

async function createFile(conn, file, ip, path) {
  const { status, owner, filename, ext, contents, size, version  } = file 
  await conn.query(
    'INSERT INTO filesystem (status, owner, ip, filename, ext, contents, size, path, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [status, owner, ip, filename, ext, contents, size, path, version]
  );
}

async function rmFile(conn, search, data) {
  await conn.query(`DELETE FROM filesystem WHERE ${search} = ?`, [data]);
}

async function rmFilePath(conn, ip, path) {
  await conn.query(
    'DELETE FROM filesystem WHERE ip = ? AND path LIKE ?',
    [ip, path]
  );
}

async function updateFileIPs(conn, oldIP, newIP) {
  await conn.query('UPDATE filesystem SET ip = ? WHERE ip = ?', [
    newIP,
    oldIP
  ]);
}

module.exports = {
  getFilesList,
  getFile,
  createFile,
  rmFile,
  rmFilePath,
  updateFileIPs
};