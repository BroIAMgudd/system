async function findTaskByID(conn, taskid) {
  const [task] = await conn.query('SELECT * FROM tasks WHERE id = ?', [taskid]);
  return task[0];
}

async function deleteTaskByUser(conn, username) {
  await conn.query('DELETE FROM tasks WHERE username = ?', [username]);
}

async function deleteTaskByIP(conn, targetIP) {
  await conn.query('DELETE FROM tasks WHERE targetIP = ?', [targetIP]);
}

module.exports = {
  findTaskByID,
  deleteTaskByUser,
  deleteTaskByIP
};