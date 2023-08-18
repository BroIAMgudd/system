export const deleteTaskHandle = (socket, removeTask) => {
  socket.on('deleteTask', (id) => {
    removeTask(id);
  });
};