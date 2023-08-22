async function findTaskByID(conn, taskid) {
  const [task] = await conn.query('SELECT * FROM tasks WHERE id = ?', [taskid]);
  return task[0];
}

module.exports = {
  findTaskByID
};